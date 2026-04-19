"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { ActiveVideoCall, IncomingVideoCall, VideoCallStatus } from "../types";

type StartVideoCallParams = {
  toUserId: string;
  conversationId: string;
};

type VideoCallRingingPayload = {
  callId: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
};

type WebRtcOfferPayload = {
  callId: string;
  fromUserId: string;
  toUserId: string;
  conversationId: string;
  offer: RTCSessionDescriptionInit;
};

type WebRtcAnswerPayload = {
  callId: string;
  fromUserId: string;
  toUserId: string;
  answer: RTCSessionDescriptionInit;
};

type WebRtcIceCandidatePayload = {
  callId: string;
  fromUserId: string;
  toUserId: string;
  candidate: RTCIceCandidateInit;
};

type VideoCallEndedPayload = {
  callId: string;
  reason?: string;
  endedBy?: string;
};

type VideoCallUnavailablePayload = {
  callId?: string;
  reason?: string;
  toUserId?: string;
};

type VideoCallErrorPayload = {
  callId?: string;
  code?: string;
  message?: string;
};

type UseWebRTCParams = {
  socket: Socket | null;
  currentUserId: string;
};

type UseWebRTCReturn = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callStatus: VideoCallStatus;
  incomingCall: IncomingVideoCall | null;
  activeCall: ActiveVideoCall | null;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  callError: string | null;
  retryMediaPermission: () => Promise<void>;
  startVideoCall: (params: StartVideoCallParams) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: () => void;
  endVideoCall: (reason?: string) => void;
  toggleMicrophone: () => void;
  toggleCamera: () => void;
  clearCallError: () => void;
};

const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function toFriendlyUnavailableReason(reason?: string): string {
  switch (reason) {
    case "callee-busy":
      return "Nguoi nhan dang co cuoc goi khac.";
    case "callee-offline":
    case "peer-offline":
      return "Nguoi nhan hien dang offline.";
    default:
      return "Khong the thiet lap cuoc goi luc nay.";
  }
}

function toFriendlyEndedReason(reason?: string): string | null {
  switch (reason) {
    case "peer-disconnected":
      return "Doi phuong da mat ket noi.";
    case "callee-busy":
      return "Doi phuong dang ban.";
    case "declined":
      return "Doi phuong da tu choi cuoc goi.";
    case "no-answer":
      return "Doi phuong chua chap nhan cuoc goi.";
    default:
      return null;
  }
}

function getMediaErrorName(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof (error as { name?: unknown }).name === "string"
  ) {
    return (error as { name: string }).name;
  }

  return null;
}

type LegacyGetUserMediaFn = (
  constraints: MediaStreamConstraints,
  onSuccess: (stream: MediaStream) => void,
  onError: (error: DOMException | Error) => void,
) => void;

type NavigatorWithLegacyGetUserMedia = Navigator & {
  getUserMedia?: LegacyGetUserMediaFn;
  webkitGetUserMedia?: LegacyGetUserMediaFn;
  mozGetUserMedia?: LegacyGetUserMediaFn;
  msGetUserMedia?: LegacyGetUserMediaFn;
};

function isLoopbackHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

function buildGetUserMediaUnavailableError(): Error {
  if (typeof window !== "undefined") {
    const isSecureOrigin = window.isSecureContext;
    const isLoopback = isLoopbackHostname(window.location.hostname);

    if (!isSecureOrigin && !isLoopback) {
      return new Error(
        "Trinh duyet tren thiet bi nay chi cho phep camera/microphone qua HTTPS. Hay mo app bang HTTPS (hoac localhost).",
      );
    }
  }

  return new Error(
    "Trinh duyet khong ho tro getUserMedia. Hay dung Chrome/Edge/Safari ban moi nhat va mo bang trinh duyet goc (khong dung in-app browser).",
  );
}

function getLegacyGetUserMedia(): LegacyGetUserMediaFn | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const legacyNavigator = navigator as NavigatorWithLegacyGetUserMedia;
  return (
    legacyNavigator.getUserMedia ||
    legacyNavigator.webkitGetUserMedia ||
    legacyNavigator.mozGetUserMedia ||
    legacyNavigator.msGetUserMedia ||
    null
  );
}

async function requestUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (typeof navigator === "undefined") {
    throw new Error("Khong tim thay trinh duyet de truy cap camera.");
  }

  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  const legacyGetUserMedia = getLegacyGetUserMedia();
  if (!legacyGetUserMedia) {
    throw buildGetUserMediaUnavailableError();
  }

  return new Promise<MediaStream>((resolve, reject) => {
    legacyGetUserMedia.call(
      navigator as unknown as NavigatorWithLegacyGetUserMedia,
      constraints,
      resolve,
      reject,
    );
  });
}

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent);
}

const DESKTOP_CAMERA_PREFER_PATTERNS: RegExp[] = [/integrated/i, /webcam/i, /camera/i, /hd/i];

const DESKTOP_CAMERA_AVOID_PATTERNS: RegExp[] = [
  /mobile/i,
  /phone/i,
  /phone link/i,
  /mobile device camera/i,
  /continuity/i,
  /pzinh/i,
  /droidcam/i,
  /iriun/i,
  /epoccam/i,
  /camo/i,
  /android/i,
  /iphone/i,
  /ip camera/i,
];

const DESKTOP_CAMERA_STORAGE_KEY = "chat_preferred_desktop_camera_device_id";

function getDesktopCameraScore(label?: string): number {
  if (!label) {
    return 0;
  }

  const normalized = label.toLowerCase();
  let score = 0;

  if (DESKTOP_CAMERA_PREFER_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score += 10;
  }

  if (DESKTOP_CAMERA_AVOID_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score -= 100;
  }

  if (normalized.includes("virtual")) {
    score -= 30;
  }

  return score;
}

function isLikelyMobileCameraLabel(label?: string): boolean {
  if (!label) {
    return false;
  }

  return DESKTOP_CAMERA_AVOID_PATTERNS.some((pattern) => pattern.test(label));
}

function pickDesktopCameraCandidates(videoInputs: MediaDeviceInfo[]): MediaDeviceInfo[] {
  if (videoInputs.length === 0) {
    return [];
  }

  const namedInputs = videoInputs.filter((device) => device.label.trim().length > 0);
  if (namedInputs.length === 0) {
    return videoInputs;
  }

  const nonMobileNamedInputs = namedInputs.filter(
    (device) => !isLikelyMobileCameraLabel(device.label),
  );

  if (nonMobileNamedInputs.length > 0) {
    return nonMobileNamedInputs;
  }

  return namedInputs;
}

function getStoredDesktopCameraDeviceId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(DESKTOP_CAMERA_STORAGE_KEY)?.trim();
  return stored && stored.length > 0 ? stored : null;
}

function setStoredDesktopCameraDeviceId(deviceId?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!deviceId) {
    window.localStorage.removeItem(DESKTOP_CAMERA_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(DESKTOP_CAMERA_STORAGE_KEY, deviceId);
}

async function findPreferredDesktopCameraDeviceId(options?: {
  avoidDeviceId?: string;
}): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return null;
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoInputs = devices.filter(
    (device) =>
      device.kind === "videoinput" &&
      Boolean(device.deviceId) &&
      device.deviceId !== options?.avoidDeviceId,
  );

  if (videoInputs.length === 0) {
    return null;
  }

  const prioritizedInputs = pickDesktopCameraCandidates(videoInputs);
  const sortedByScore = [...prioritizedInputs].sort(
    (left, right) => getDesktopCameraScore(right.label) - getDesktopCameraScore(left.label),
  );

  return sortedByScore[0]?.deviceId || videoInputs[0]?.deviceId || null;
}

async function listPreferredDesktopCameraDeviceIds(options?: {
  avoidDeviceId?: string;
}): Promise<string[]> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoInputs = devices.filter(
    (device) =>
      device.kind === "videoinput" &&
      Boolean(device.deviceId) &&
      device.deviceId !== options?.avoidDeviceId,
  );

  const prioritizedInputs = pickDesktopCameraCandidates(videoInputs).sort(
    (left, right) =>
      getDesktopCameraScore(right.label) - getDesktopCameraScore(left.label),
  );

  const sortedIds = prioritizedInputs.map((device) => device.deviceId);
  const storedId = getStoredDesktopCameraDeviceId();

  if (!storedId) {
    return sortedIds;
  }

  const index = sortedIds.indexOf(storedId);
  if (index <= 0) {
    return sortedIds;
  }

  sortedIds.splice(index, 1);
  sortedIds.unshift(storedId);
  return sortedIds;
}

function buildPreferredMediaConstraints(preferredDesktopDeviceId?: string): MediaStreamConstraints {
  const audioConstraints: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  };

  if (isMobileUserAgent()) {
    return {
      audio: audioConstraints,
      video: {
        ...videoConstraints,
        facingMode: "user",
      },
    };
  }

  if (preferredDesktopDeviceId) {
    return {
      audio: audioConstraints,
      video: {
        ...videoConstraints,
        deviceId: { exact: preferredDesktopDeviceId },
      },
    };
  }

  return {
    audio: audioConstraints,
    video: videoConstraints,
  };
}

function toFriendlyMediaError(error: unknown): string {
  const errorName = getMediaErrorName(error);

  switch (errorName) {
    case "NotAllowedError":
      return "Quyen Camera/Microphone dang bi chan. Bam bieu tuong camera bi gach tren thanh dia chi, chuyen sang Allow roi thu lai.";
    case "NotFoundError":
      return "Khong tim thay camera hoac microphone tren thiet bi.";
    case "NotReadableError":
      return "Camera hoac microphone dang bi ung dung khac su dung, hoac desktop dang chon camera dien thoai. Hay doi Camera ve Integrated Webcam/USB Camera, tat app dang chiem camera, roi thu lai.";
    case "SecurityError":
      return "Trinh duyet chan truy cap camera/microphone vi ly do bao mat. Hay dung localhost hoac HTTPS.";
    case "OverconstrainedError":
      return "Thiet bi khong ho tro cau hinh camera hien tai. Da thu cau hinh mac dinh.";
    default:
      break;
  }

  if (error instanceof Error && error.message) {
    const normalizedMessage = error.message.toLowerCase();
    if (
      normalizedMessage.includes("mobile device camera") ||
      normalizedMessage.includes("continuity")
    ) {
      return "Desktop dang chon camera dien thoai. Hay doi camera ve webcam laptop trong cai dat camera cua trinh duyet va thu lai.";
    }

    return error.message;
  }

  return "Khong the khoi tao camera/microphone.";
}

export function useWebRTC({ socket, currentUserId }: UseWebRTCParams): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<VideoCallStatus>("idle");
  const [incomingCall, setIncomingCall] = useState<IncomingVideoCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveVideoCall | null>(null);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [callError, setCallError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const callStatusRef = useRef<VideoCallStatus>("idle");
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const incomingCallRef = useRef<IncomingVideoCall | null>(null);
  const activeCallRef = useRef<ActiveVideoCall | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingOutgoingRef = useRef<StartVideoCallParams | null>(null);
  const pendingOfferRef = useRef<WebRtcOfferPayload | null>(null);
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    remoteStreamRef.current = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const clearCallError = useCallback(() => {
    setCallError(null);
  }, []);

  const stopMediaStream = useCallback((stream: MediaStream | null) => {
    if (!stream) {
      return;
    }

    stream.getTracks().forEach((track) => track.stop());
  }, []);

  const queueIceCandidate = useCallback((callId: string, candidate: RTCIceCandidateInit) => {
    const queued = pendingIceCandidatesRef.current.get(callId) || [];
    queued.push(candidate);
    pendingIceCandidatesRef.current.set(callId, queued);
  }, []);

  const flushQueuedIceCandidates = useCallback(async (callId: string, pc: RTCPeerConnection) => {
    const queued = pendingIceCandidatesRef.current.get(callId);
    if (!queued || queued.length === 0) {
      return;
    }

    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("[useWebRTC] addIceCandidate error:", error);
      }
    }

    pendingIceCandidatesRef.current.delete(callId);
  }, []);

  const resetPeerConnection = useCallback(() => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection) {
      return;
    }

    peerConnection.ontrack = null;
    peerConnection.onicecandidate = null;
    peerConnection.onconnectionstatechange = null;
    peerConnection.close();
    peerConnectionRef.current = null;
  }, []);

  const resetCallState = useCallback(
    (options?: { preserveError?: boolean }) => {
      resetPeerConnection();
      stopMediaStream(localStreamRef.current);
      stopMediaStream(remoteStreamRef.current);

      localStreamRef.current = null;
      remoteStreamRef.current = null;
      incomingCallRef.current = null;
      activeCallRef.current = null;
      pendingOutgoingRef.current = null;
      pendingOfferRef.current = null;
      pendingIceCandidatesRef.current.clear();

      setLocalStream(null);
      setRemoteStream(null);
      setIncomingCall(null);
      setActiveCall(null);
      setCallStatus("idle");
      setIsMicrophoneEnabled(true);
      setIsCameraEnabled(true);

      if (!options?.preserveError) {
        setCallError(null);
      }
    },
    [resetPeerConnection, stopMediaStream],
  );

  const ensureLocalStream = useCallback(async (): Promise<MediaStream> => {
    const existingStream = localStreamRef.current;
    if (existingStream) {
      return existingStream;
    }

    if (!navigator.mediaDevices?.getUserMedia && !getLegacyGetUserMedia()) {
      throw buildGetUserMediaUnavailableError();
    }

    const attachLocalStream = (stream: MediaStream): MediaStream => {
      const hasVideoTrack = stream.getVideoTracks().length > 0;
      if (!hasVideoTrack) {
        stopMediaStream(stream);
        throw new Error("Khong lay duoc luong video tu camera.");
      }

      const selectedVideoTrack = stream.getVideoTracks()[0];
      if (
        !isMobileUserAgent() &&
        selectedVideoTrack?.getSettings().deviceId &&
        !isLikelyMobileCameraLabel(selectedVideoTrack.label)
      ) {
        setStoredDesktopCameraDeviceId(selectedVideoTrack.getSettings().deviceId);
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMicrophoneEnabled(stream.getAudioTracks().some((track) => track.enabled));
      setIsCameraEnabled(stream.getVideoTracks().some((track) => track.enabled));
      return stream;
    };

    const tryDesktopCameraCandidates = async (options?: {
      avoidDeviceId?: string;
      rejectMobileLabels?: boolean;
    }): Promise<MediaStream | null> => {
      if (isMobileUserAgent()) {
        return null;
      }

      const preferredDesktopDeviceIds = await listPreferredDesktopCameraDeviceIds({
        avoidDeviceId: options?.avoidDeviceId,
      });

      for (const deviceId of preferredDesktopDeviceIds) {
        try {
          const stream = await requestUserMedia(
            buildPreferredMediaConstraints(deviceId),
          );

          if (options?.rejectMobileLabels) {
            const track = stream.getVideoTracks()[0];
            if (track && isLikelyMobileCameraLabel(track.label)) {
              stopMediaStream(stream);
              continue;
            }
          }

          return stream;
        } catch (candidateError) {
          console.warn("[useWebRTC] Desktop camera candidate failed:", candidateError);
        }
      }

      return null;
    };

    const ensureDesktopCameraLabelsVisible = async (): Promise<void> => {
      if (
        isMobileUserAgent() ||
        !navigator.mediaDevices?.enumerateDevices
      ) {
        return;
      }

      const currentDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = currentDevices.filter(
        (device) => device.kind === "videoinput" && Boolean(device.deviceId),
      );

      const hasNamedCamera = videoInputs.some((device) => device.label.trim().length > 0);
      if (hasNamedCamera || videoInputs.length <= 1) {
        return;
      }

      try {
        const probeStream = await requestUserMedia({
          audio: true,
          video: false,
        });
        stopMediaStream(probeStream);
      } catch (probeError) {
        console.warn("[useWebRTC] Desktop camera label probe failed:", probeError);
      }
    };

    const replaceMobileDesktopCameraIfNeeded = async (
      stream: MediaStream,
    ): Promise<MediaStream> => {
      if (isMobileUserAgent()) {
        return stream;
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        console.info("[useWebRTC] Desktop selected camera track:", videoTrack.label || "(hidden label)");
      }

      if (!videoTrack || !isLikelyMobileCameraLabel(videoTrack.label)) {
        return stream;
      }

      const currentDeviceId = videoTrack.getSettings().deviceId;
      const alternativeDeviceId = await findPreferredDesktopCameraDeviceId({
        avoidDeviceId: currentDeviceId,
      });

      if (!alternativeDeviceId) {
        return stream;
      }

      const replacementStream = await tryDesktopCameraCandidates({
        avoidDeviceId: currentDeviceId,
        rejectMobileLabels: true,
      });

      if (replacementStream) {
        stopMediaStream(stream);
        return replacementStream;
      }

      return stream;
    };

    const isDesktopMobileCameraError = (error: unknown): boolean => {
      if (isMobileUserAgent() || !(error instanceof Error)) {
        return false;
      }

      const normalizedMessage = error.message.toLowerCase();
      return (
        normalizedMessage.includes("mobile device camera") ||
        normalizedMessage.includes("continuity") ||
        normalizedMessage.includes("phone link") ||
        normalizedMessage.includes("resend permission") ||
        normalizedMessage.includes("pzinh")
      );
    };

    const acquireStreamWithDesktopFallback = async (): Promise<MediaStream> => {
      if (isMobileUserAgent()) {
        return requestUserMedia(buildPreferredMediaConstraints());
      }

      await ensureDesktopCameraLabelsVisible();

      const streamFromCandidates = await tryDesktopCameraCandidates({
        rejectMobileLabels: true,
      });

      if (streamFromCandidates) {
        return streamFromCandidates;
      }

      return requestUserMedia(buildPreferredMediaConstraints());
    };

    try {
      const stream = await acquireStreamWithDesktopFallback();
      const stableStream = await replaceMobileDesktopCameraIfNeeded(stream);
      return attachLocalStream(stableStream);
    } catch (error) {
      if (!isMobileUserAgent() && getMediaErrorName(error) !== "NotAllowedError") {
        setStoredDesktopCameraDeviceId();
        const recoveredDesktopStream = await tryDesktopCameraCandidates({
          rejectMobileLabels: true,
        });

        if (recoveredDesktopStream) {
          const stableRecoveredStream = await replaceMobileDesktopCameraIfNeeded(
            recoveredDesktopStream,
          );
          return attachLocalStream(stableRecoveredStream);
        }
      }

      if (isDesktopMobileCameraError(error)) {
        setStoredDesktopCameraDeviceId();
        const recoveredDesktopStream = await tryDesktopCameraCandidates({
          rejectMobileLabels: true,
        });

        if (recoveredDesktopStream) {
          const stableRecoveredStream = await replaceMobileDesktopCameraIfNeeded(
            recoveredDesktopStream,
          );
          return attachLocalStream(stableRecoveredStream);
        }
      }

      if (getMediaErrorName(error) !== "OverconstrainedError") {
        throw error;
      }

      const fallbackStream = await requestUserMedia({
        video: true,
        audio: true,
      });
      const stableFallbackStream = await replaceMobileDesktopCameraIfNeeded(
        fallbackStream,
      );
      return attachLocalStream(stableFallbackStream);
    }
  }, [stopMediaStream]);

  const retryMediaPermission = useCallback(async () => {
    try {
      setCallError(null);
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
      setLocalStream(null);

      await ensureLocalStream();
    } catch (error) {
      setCallError(toFriendlyMediaError(error));
    }
  }, [ensureLocalStream, stopMediaStream]);

  const toggleMicrophone = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      return;
    }

    const shouldEnable = audioTracks.some((track) => !track.enabled);
    audioTracks.forEach((track) => {
      track.enabled = shouldEnable;
    });

    setIsMicrophoneEnabled(shouldEnable);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      return;
    }

    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      return;
    }

    const shouldEnable = videoTracks.some((track) => !track.enabled);
    videoTracks.forEach((track) => {
      track.enabled = shouldEnable;
    });

    setIsCameraEnabled(shouldEnable);
  }, []);

  const createPeerConnection = useCallback(
    (call: ActiveVideoCall) => {
      const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
      const stream = localStreamRef.current;

      if (stream) {
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });
      }

      peerConnection.onicecandidate = (event) => {
        if (!event.candidate || !socketRef.current) {
          return;
        }

        socketRef.current.emit("webrtcIceCandidate", {
          callId: call.callId,
          toUserId: call.peerUserId,
          candidate: event.candidate,
        });
      };

      peerConnection.ontrack = (event) => {
        const [streamFromEvent] = event.streams;
        if (streamFromEvent) {
          remoteStreamRef.current = streamFromEvent;
          setRemoteStream(streamFromEvent);
          return;
        }

        const mergedStream = remoteStreamRef.current || new MediaStream();
        mergedStream.addTrack(event.track);
        remoteStreamRef.current = mergedStream;
        setRemoteStream(mergedStream);
      };

      peerConnection.onconnectionstatechange = () => {
        console.debug("[useWebRTC] Peer connection state:", peerConnection.connectionState);

        if (peerConnection.connectionState === "connected") {
          setCallStatus("connected");
          setCallError(null);
        }

        if (peerConnection.connectionState === "failed") {
          setCallError("Ket noi WebRTC that bai. Vui long thu lai.");
        }

        if (peerConnection.connectionState === "disconnected") {
          setCallError("Ket noi tam thoi bi gian doan.");
        }
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    },
    [],
  );

  const applyIncomingOfferAndAnswer = useCallback(
    async (payload: WebRtcOfferPayload, callOverride?: ActiveVideoCall) => {
      const currentCall = callOverride || activeCallRef.current;
      if (!currentCall || currentCall.callId !== payload.callId) {
        return;
      }

      let peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        peerConnection = createPeerConnection(currentCall);
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.offer));
      await flushQueuedIceCandidates(payload.callId, peerConnection);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socketRef.current?.emit("webrtcAnswer", {
        callId: payload.callId,
        toUserId: payload.fromUserId,
        answer,
      });
    },
    [createPeerConnection, flushQueuedIceCandidates],
  );

  const startVideoCall = useCallback(
    async ({ toUserId, conversationId }: StartVideoCallParams) => {
      if (!socketRef.current) {
        setCallError("Khong ket noi duoc den signaling server.");
        return;
      }

      if (!currentUserId || callStatusRef.current !== "idle") {
        return;
      }

      try {
        setCallError(null);
        await ensureLocalStream();

        pendingOutgoingRef.current = {
          toUserId,
          conversationId,
        };

        setCallStatus("calling");
        socketRef.current.emit("startVideoCall", {
          calleeUserId: toUserId,
          conversationId,
        });
      } catch (error) {
        setCallError(toFriendlyMediaError(error));
        resetCallState({ preserveError: true });
      }
    },
    [currentUserId, ensureLocalStream, resetCallState],
  );

  const acceptIncomingCall = useCallback(async () => {
    const call = incomingCallRef.current;
    if (!call || !socketRef.current) {
      return;
    }

    try {
      setCallError(null);
      await ensureLocalStream();

      const nextActiveCall: ActiveVideoCall = {
        callId: call.callId,
        conversationId: call.conversationId,
        peerUserId: call.fromUserId,
        direction: "incoming",
      };

      setIncomingCall(null);
      setActiveCall(nextActiveCall);
      setCallStatus("calling");

      createPeerConnection(nextActiveCall);

      const pendingOffer = pendingOfferRef.current;
      if (pendingOffer && pendingOffer.callId === call.callId) {
        pendingOfferRef.current = null;
        await applyIncomingOfferAndAnswer(pendingOffer, nextActiveCall);
      }
    } catch (error) {
      const message = toFriendlyMediaError(error);
      setCallError(message);
      socketRef.current.emit("endVideoCall", {
        callId: call.callId,
        reason: "accept-failed",
      });
      resetCallState({ preserveError: true });
    }
  }, [applyIncomingOfferAndAnswer, createPeerConnection, ensureLocalStream, resetCallState]);

  const declineIncomingCall = useCallback(() => {
    const call = incomingCallRef.current;
    if (!call) {
      return;
    }

    socketRef.current?.emit("endVideoCall", {
      callId: call.callId,
      reason: "declined",
    });

    setIncomingCall(null);
    setCallStatus("idle");
    pendingOfferRef.current = null;
    pendingIceCandidatesRef.current.delete(call.callId);
  }, []);

  const endVideoCall = useCallback(
    (reason = "ended") => {
      const safeReason =
        typeof reason === "string" && reason.trim().length > 0
          ? reason
          : "ended";

      const currentCall = activeCallRef.current;
      if (currentCall && socketRef.current) {
        socketRef.current.emit("endVideoCall", {
          callId: currentCall.callId,
          reason: safeReason,
        });
      }

      resetCallState();
    },
    [resetCallState],
  );

  useEffect(() => {
    if (!socket || !currentUserId) {
      return;
    }

    const handleIncomingVideoCall = (payload: IncomingVideoCall) => {
      if (payload.toUserId && payload.toUserId !== currentUserId) {
        return;
      }

      if (callStatusRef.current !== "idle") {
        socket.emit("endVideoCall", {
          callId: payload.callId,
          reason: "callee-busy",
        });
        return;
      }

      setCallError(null);
      setIncomingCall(payload);
      setCallStatus("receiving");
    };

    const handleVideoCallRinging = async (payload: VideoCallRingingPayload) => {
      const pendingOutgoing = pendingOutgoingRef.current;
      if (!pendingOutgoing) {
        return;
      }

      if (payload.fromUserId !== currentUserId) {
        return;
      }

      if (payload.toUserId !== pendingOutgoing.toUserId) {
        return;
      }

      const nextActiveCall: ActiveVideoCall = {
        callId: payload.callId,
        conversationId: payload.conversationId,
        peerUserId: payload.toUserId,
        direction: "outgoing",
      };

      setActiveCall(nextActiveCall);

      try {
        await ensureLocalStream();
        const peerConnection = createPeerConnection(nextActiveCall);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit("webrtcOffer", {
          callId: payload.callId,
          toUserId: payload.toUserId,
          offer,
        });
      } catch (error) {
        setCallError(toFriendlyMediaError(error));
        socket.emit("endVideoCall", {
          callId: payload.callId,
          reason: "offer-create-failed",
        });
        resetCallState({ preserveError: true });
      }
    };

    const handleWebRtcOffer = async (payload: WebRtcOfferPayload) => {
      if (payload.toUserId && payload.toUserId !== currentUserId) {
        return;
      }

      const currentCall = activeCallRef.current;
      if (!currentCall) {
        // Offer can arrive before incomingVideoCall due to event ordering.
        // Keep the latest offer so callee can apply it after accepting.
        pendingOfferRef.current = payload;
        return;
      }

      if (currentCall.callId !== payload.callId) {
        return;
      }

      if (currentCall.direction !== "incoming") {
        return;
      }

      try {
        await applyIncomingOfferAndAnswer(payload);
      } catch (error) {
        console.error("[useWebRTC] Failed to handle offer:", error);
        setCallError("Khong the xu ly goi den luc nay.");
        socket.emit("endVideoCall", {
          callId: payload.callId,
          reason: "offer-handle-failed",
        });
        resetCallState({ preserveError: true });
      }
    };

    const handleWebRtcAnswer = async (payload: WebRtcAnswerPayload) => {
      if (payload.toUserId && payload.toUserId !== currentUserId) {
        return;
      }

      const currentCall = activeCallRef.current;
      const peerConnection = peerConnectionRef.current;
      if (!currentCall || !peerConnection) {
        return;
      }

      if (currentCall.callId !== payload.callId || currentCall.direction !== "outgoing") {
        return;
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(payload.answer),
        );
        await flushQueuedIceCandidates(payload.callId, peerConnection);
      } catch (error) {
        console.error("[useWebRTC] Failed to set remote answer:", error);
        setCallError("Khong the thiet lap ket noi voi doi phuong.");
        resetCallState({ preserveError: true });
      }
    };

    const handleWebRtcIceCandidate = async (payload: WebRtcIceCandidatePayload) => {
      if (payload.toUserId && payload.toUserId !== currentUserId) {
        return;
      }

      const candidate = payload.candidate;
      const currentCall = activeCallRef.current;
      const peerConnection = peerConnectionRef.current;

      if (!candidate) {
        return;
      }

      if (!currentCall || currentCall.callId !== payload.callId || !peerConnection) {
        queueIceCandidate(payload.callId, candidate);
        return;
      }

      if (!peerConnection.remoteDescription) {
        queueIceCandidate(payload.callId, candidate);
        return;
      }

      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("[useWebRTC] addIceCandidate failed:", error);
      }
    };

    const handleVideoCallEnded = (payload: VideoCallEndedPayload) => {
      const active = activeCallRef.current;
      const incoming = incomingCallRef.current;

      if (
        (!active || active.callId !== payload.callId) &&
        (!incoming || incoming.callId !== payload.callId)
      ) {
        return;
      }

      const endedReason = toFriendlyEndedReason(payload.reason);
      if (endedReason) {
        setCallError(endedReason);
      }

      resetCallState({ preserveError: Boolean(endedReason) });
    };

    const handleVideoCallUnavailable = (payload: VideoCallUnavailablePayload) => {
      const pendingOutgoing = pendingOutgoingRef.current;
      const active = activeCallRef.current;

      if (!pendingOutgoing && !active) {
        return;
      }

      if (payload.callId && active?.callId && payload.callId !== active.callId) {
        return;
      }

      setCallError(toFriendlyUnavailableReason(payload.reason));
      resetCallState({ preserveError: true });
    };

    const handleVideoCallError = (payload: VideoCallErrorPayload) => {
      if (payload.callId && activeCallRef.current?.callId && payload.callId !== activeCallRef.current.callId) {
        return;
      }

      if (payload.message) {
        setCallError(payload.message);
      }
    };

    const handleVideoCallConnected = () => {
      setCallStatus("connected");
    };

    socket.on("incomingVideoCall", handleIncomingVideoCall);
    socket.on("videoCallRinging", handleVideoCallRinging);
    socket.on("webrtcOffer", handleWebRtcOffer);
    socket.on("webrtcAnswer", handleWebRtcAnswer);
    socket.on("webrtcIceCandidate", handleWebRtcIceCandidate);
    socket.on("videoCallEnded", handleVideoCallEnded);
    socket.on("videoCallUnavailable", handleVideoCallUnavailable);
    socket.on("videoCallError", handleVideoCallError);
    socket.on("videoCallConnected", handleVideoCallConnected);

    return () => {
      socket.off("incomingVideoCall", handleIncomingVideoCall);
      socket.off("videoCallRinging", handleVideoCallRinging);
      socket.off("webrtcOffer", handleWebRtcOffer);
      socket.off("webrtcAnswer", handleWebRtcAnswer);
      socket.off("webrtcIceCandidate", handleWebRtcIceCandidate);
      socket.off("videoCallEnded", handleVideoCallEnded);
      socket.off("videoCallUnavailable", handleVideoCallUnavailable);
      socket.off("videoCallError", handleVideoCallError);
      socket.off("videoCallConnected", handleVideoCallConnected);
    };
  }, [
    applyIncomingOfferAndAnswer,
    createPeerConnection,
    currentUserId,
    ensureLocalStream,
    flushQueuedIceCandidates,
    queueIceCandidate,
    resetCallState,
    socket,
  ]);

  useEffect(() => {
    if (
      !activeCall ||
      activeCall.direction !== "outgoing" ||
      callStatus !== "calling" ||
      Boolean(remoteStream)
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const latestActiveCall = activeCallRef.current;
      if (!latestActiveCall || latestActiveCall.callId !== activeCall.callId) {
        return;
      }

      socketRef.current?.emit("endVideoCall", {
        callId: activeCall.callId,
        reason: "no-answer",
      });

      setCallError("Doi phuong chua chap nhan cuoc goi.");
      resetCallState({ preserveError: true });
    }, 20000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCall, callStatus, remoteStream, resetCallState]);

  useEffect(() => {
    return () => {
      const active = activeCallRef.current;
      if (active && socketRef.current) {
        socketRef.current.emit("endVideoCall", {
          callId: active.callId,
          reason: "component-unmount",
        });
      }

      resetCallState();
    };
  }, [resetCallState]);

  return {
    localStream,
    remoteStream,
    callStatus,
    incomingCall,
    activeCall,
    isMicrophoneEnabled,
    isCameraEnabled,
    callError,
    startVideoCall,
    acceptIncomingCall,
    declineIncomingCall,
    endVideoCall,
    toggleMicrophone,
    toggleCamera,
    retryMediaPermission,
    clearCallError,
  };
}
