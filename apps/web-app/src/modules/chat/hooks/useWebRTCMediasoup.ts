"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";
import type {
  Device,
  Producer,
  Consumer,
  Transport,
  RtpCapabilities,
  RtpParameters,
  DtlsParameters,
} from "mediasoup-client/types";
import type { Socket } from "socket.io-client";
import type { ActiveVideoCall, IncomingVideoCall, VideoCallStatus } from "../types";

type UseWebRTCMediasoupParams = {
  socket: Socket | null;
  currentUserId: string;
};

type UseWebRTCMediasoupReturn = {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  callStatus: VideoCallStatus;
  incomingCall: IncomingVideoCall | null;
  activeCall: ActiveVideoCall | null;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  callError: string | null;
  retryMediaPermission: () => Promise<void>;
  startGroupCall: (conversationId: string) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: () => void;
  endCall: (reason?: string) => void;
  toggleMicrophone: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  clearCallError: () => void;
};

type JoinMediaRoomResponse = {
  rtpCapabilities: RtpCapabilities;
  existingProducers: Array<{ producerId: string; kind: "audio" | "video"; userId: string }>;
};

const RTC_ICE_SERVERS =
  typeof window !== "undefined" && (window as any).MEDIASOUP_ICE_SERVERS
    ? JSON.parse((window as any).MEDIASOUP_ICE_SERVERS)
    : [{ urls: "stun:stun.l.google.com:19302" }];

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent);
}

const DESKTOP_DEVICE_PREFER_PATTERNS: RegExp[] = [/integrated/i, /webcam/i, /camera/i, /hd/i];

const DESKTOP_DEVICE_AVOID_PATTERNS: RegExp[] = [
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

function getDesktopDeviceScore(label?: string): number {
  if (!label) {
    return 0;
  }

  const normalized = label.toLowerCase();
  let score = 0;

  if (DESKTOP_DEVICE_PREFER_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score += 10;
  }

  if (DESKTOP_DEVICE_AVOID_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score -= 100;
  }

  if (normalized.includes("virtual")) {
    score -= 30;
  }

  return score;
}

function isLikelyMobileDeviceLabel(label?: string): boolean {
  if (!label) {
    return false;
  }

  return DESKTOP_DEVICE_AVOID_PATTERNS.some((pattern) => pattern.test(label));
}

function buildPreferredConstraints(options?: {
  videoDeviceId?: string;
  audioDeviceId?: string;
}): MediaStreamConstraints {
  const audioConstraints: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...(options?.audioDeviceId ? { deviceId: { exact: options.audioDeviceId } } : {}),
  };

  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    ...(options?.videoDeviceId ? { deviceId: { exact: options.videoDeviceId } } : {}),
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

  return {
    audio: audioConstraints,
    video: videoConstraints,
  };
}

async function listPreferredDeviceIds(kind: "videoinput" | "audioinput"): Promise<string[]> {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.enumerateDevices ||
    isMobileUserAgent()
  ) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const inputs = devices.filter(
    (device) => device.kind === kind && Boolean(device.deviceId),
  );

  if (inputs.length === 0) {
    return [];
  }

  const namedInputs = inputs.filter((device) => device.label.trim().length > 0);
  const candidates = namedInputs.length > 0 ? namedInputs : inputs;

  const nonMobile = candidates.filter((device) => !isLikelyMobileDeviceLabel(device.label));
  const prioritized = nonMobile.length > 0 ? nonMobile : candidates;

  return [...prioritized]
    .sort((left, right) => getDesktopDeviceScore(right.label) - getDesktopDeviceScore(left.label))
    .map((device) => device.deviceId);
}

async function requestUserMediaWithDesktopPreference(): Promise<MediaStream> {
  if (typeof navigator === "undefined") {
    throw new Error("Navigator not available");
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia not supported");
  }

  if (isMobileUserAgent()) {
    return navigator.mediaDevices.getUserMedia(buildPreferredConstraints());
  }

  const videoIds = await listPreferredDeviceIds("videoinput");
  const audioIds = await listPreferredDeviceIds("audioinput");
  const preferredVideoId = videoIds[0];
  const preferredAudioId = audioIds[0];

  if (preferredVideoId || preferredAudioId) {
    try {
      return await navigator.mediaDevices.getUserMedia(
        buildPreferredConstraints({
          videoDeviceId: preferredVideoId,
          audioDeviceId: preferredAudioId,
        }),
      );
    } catch (error) {
      console.warn("[useWebRTCMediasoup] Preferred device getUserMedia failed:", error);
    }
  }

  return navigator.mediaDevices.getUserMedia(buildPreferredConstraints());
}

export default function useWebRTCMediasoup({
  socket,
  currentUserId,
}: UseWebRTCMediasoupParams): UseWebRTCMediasoupReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [callStatus, setCallStatus] = useState<VideoCallStatus>("idle");
  const [incomingCall, setIncomingCall] = useState<IncomingVideoCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveVideoCall | null>(null);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  const deviceRef = useRef<Device | null>(null);
  const deviceLoadPromiseRef = useRef<Promise<Device> | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producersRef = useRef<Map<string, Producer>>(new Map());
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const consumerMetaRef = useRef<Map<string, { producerId: string; userId: string }>>(new Map());
  const consumedProducerIdsRef = useRef<Set<string>>(new Set());
  const pendingProducersRef = useRef<Array<{ producerId: string; kind: "audio" | "video"; userId: string }>>([]);
  const currentConversationIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const clearCallError = useCallback(() => {
    setCallError(null);
  }, []);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const stopMediaStream = useCallback((stream: MediaStream | null) => {
    if (!stream) {
      return;
    }

    stream.getTracks().forEach((track) => track.stop());
  }, []);

  const ensureLocalStream = useCallback(async (): Promise<MediaStream> => {
    const existing = localStreamRef.current;
    if (existing) {
      return existing;
    }

    const stream = await requestUserMediaWithDesktopPreference();
    setLocalStream(stream);
    setIsMicrophoneEnabled(stream.getAudioTracks().some((track) => track.enabled));
    setIsCameraEnabled(stream.getVideoTracks().some((track) => track.enabled));
    return stream;
  }, []);

  const retryMediaPermission = useCallback(async () => {
    try {
      setCallError(null);
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
      const stream = await ensureLocalStream();
      setLocalStream(stream);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to access camera/microphone";
      setCallError(message);
    }
  }, [ensureLocalStream, stopMediaStream]);

  const toggleMicrophone = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMicrophoneEnabled(!isMicrophoneEnabled);
  }, [isMicrophoneEnabled]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraEnabled(!isCameraEnabled);
  }, [isCameraEnabled]);

  const toggleScreenShare = useCallback(async () => {
    if (!currentConversationIdRef.current) {
      setCallError("Can bat dau cuoc goi truoc khi chia se man hinh.");
      return;
    }

    if (!sendTransportRef.current) {
      setCallError("Send transport chua san sang.");
      return;
    }

    try {
      // If already sharing, stop
      const existingScreenProducer = producersRef.current.get("screen");
      if (existingScreenProducer) {
        try {
          existingScreenProducer.close();
        } catch (e) {
          console.warn("close screen producer error", e);
        }
        producersRef.current.delete("screen");
        // Restore camera preview if available
        const previewStream = localStreamRef.current;
        if (previewStream) {
          setLocalStream(previewStream);
        }
        return;
      }

      // Start screen share
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // @ts-ignore
      const screenStream = await (navigator as any).mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) {
        setCallError("Khong the chia se man hinh.");
        return;
      }

      const screenProducer = await sendTransportRef.current.produce({
        track: screenTrack,
      });

      producersRef.current.set("screen", screenProducer);

      // Replace local preview with screen preview
      const preview = new MediaStream();
      const audioTrack = localStreamRef.current?.getAudioTracks()[0] || null;
      if (audioTrack) preview.addTrack(audioTrack);
      preview.addTrack(screenTrack);
      setLocalStream(preview);
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        try {
          screenProducer.close();
        } catch (e) {
          console.warn("close screen producer onended error", e);
        }
        producersRef.current.delete("screen");
        setIsScreenSharing(false);
        // restore camera
        const previewStream = localStreamRef.current;
        if (previewStream) setLocalStream(previewStream);
      };
    } catch (error) {
      console.warn("toggleScreenShare failed:", error);
      setCallError("Khong the chia se man hinh luc nay.");
    }
  }, []);

  const updateRemoteStreams = useCallback(
    (updater: (next: Map<string, MediaStream>) => void) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        updater(next);
        return next;
      });
    },
    [],
  );

  const addRemoteTrack = useCallback(
    (userId: string, track: MediaStreamTrack) => {
      updateRemoteStreams((next) => {
        const existing = next.get(userId) || new MediaStream();
        const updatedStream = new MediaStream();

        existing.getTracks().forEach((existingTrack) => {
          if (existingTrack.id !== track.id) {
            updatedStream.addTrack(existingTrack);
          }
        });

        updatedStream.addTrack(track);
        next.set(userId, updatedStream);
      });
    },
    [updateRemoteStreams],
  );

  const removeConsumer = useCallback(
    (consumerId: string) => {
      const consumer = consumersRef.current.get(consumerId);
      if (!consumer) {
        return;
      }

      const meta = consumerMetaRef.current.get(consumerId);

      try {
        consumer.close();
      } catch (error) {
        console.warn("[useWebRTCMediasoup] consumer close error:", error);
      }

      consumersRef.current.delete(consumerId);
      consumerMetaRef.current.delete(consumerId);

      if (meta?.producerId) {
        consumedProducerIdsRef.current.delete(meta.producerId);
      }

      if (!meta) {
        return;
      }

      updateRemoteStreams((next) => {
        const existing = next.get(meta.userId);
        if (!existing) {
          return;
        }

        const remainingTracks = existing
          .getTracks()
          .filter((track) => track.id !== consumer.track.id);

        if (remainingTracks.length === 0) {
          next.delete(meta.userId);
          return;
        }

        const updatedStream = new MediaStream();
        remainingTracks.forEach((track) => updatedStream.addTrack(track));
        next.set(meta.userId, updatedStream);
      });
    },
    [updateRemoteStreams],
  );

  const consumeProducer = useCallback(
    async (producerId: string, kind: "audio" | "video", userId: string) => {
      if (
        !socket ||
        !recvTransportRef.current ||
        !deviceRef.current?.loaded ||
        !currentConversationIdRef.current
      ) {
        return;
      }

      if (consumedProducerIdsRef.current.has(producerId)) {
        return;
      }

      const consumerResponse = await new Promise<{
        ok: boolean;
        data?: { id: string; producerId: string; kind: "audio" | "video"; rtpParameters: unknown };
        error?: any;
      }>((resolve) => {
        socket.emit(
          "consume",
          {
            conversationId: currentConversationIdRef.current,
            transportId: recvTransportRef.current!.id,
            producerId,
            rtpCapabilities: deviceRef.current!.rtpCapabilities,
          },
          resolve,
        );
      });

      if (!consumerResponse.ok || !consumerResponse.data) {
        throw new Error(consumerResponse.error?.message || "Failed to consume remote producer");
      }

      const consumer = await recvTransportRef.current.consume({
        id: consumerResponse.data.id,
        producerId: consumerResponse.data.producerId,
        kind: consumerResponse.data.kind,
        rtpParameters: consumerResponse.data.rtpParameters as any,
      });

      consumersRef.current.set(consumer.id, consumer);
      consumerMetaRef.current.set(consumer.id, { producerId, userId });
      consumedProducerIdsRef.current.add(producerId);

      consumer.on("transportclose", () => removeConsumer(consumer.id));
      consumer.on("trackended", () => removeConsumer(consumer.id));

      await new Promise<void>((resolve, reject) => {
        socket.emit(
          "resume",
          {
            conversationId: currentConversationIdRef.current,
            consumerId: consumer.id,
          },
          (response: { ok: boolean; error?: any }) => {
            if (response.ok) {
              resolve();
            } else {
              reject(new Error(response.error?.message || "Failed to resume consumer"));
            }
          },
        );
      });

      addRemoteTrack(userId, consumer.track);
    },
    [addRemoteTrack, removeConsumer, socket],
  );

  const joinMediaRoom = useCallback(
    async (conversationId: string): Promise<JoinMediaRoomResponse> => {
      if (!socket) {
        throw new Error("Socket not connected");
      }

      return new Promise<JoinMediaRoomResponse>((resolve, reject) => {
        socket.emit(
          "joinMediaRoom",
          { conversationId },
          (response: { ok: boolean; data?: JoinMediaRoomResponse; error?: any }) => {
            if (response.ok && response.data?.rtpCapabilities) {
              resolve(response.data);
              return;
            }

            reject(new Error(response.error?.message || "Failed to join media room"));
          },
        );
      });
    },
    [socket],
  );

  const ensureDeviceReady = useCallback(
    async (routerRtpCapabilities: RtpCapabilities): Promise<Device> => {
      if (deviceRef.current?.loaded) {
        return deviceRef.current;
      }

      if (deviceLoadPromiseRef.current) {
        return deviceLoadPromiseRef.current;
      }

      const loadPromise = (async () => {
        const device = deviceRef.current ?? new mediasoupClient.Device();
        deviceRef.current = device;
        await device.load({ routerRtpCapabilities });
        return device;
      })();

      deviceLoadPromiseRef.current = loadPromise;

      try {
        return await loadPromise;
      } catch (error) {
        deviceRef.current = null;
        throw error;
      } finally {
        if (deviceLoadPromiseRef.current === loadPromise) {
          deviceLoadPromiseRef.current = null;
        }
      }
    },
    [],
  );

  const createTransports = useCallback(async (conversationId: string) => {
    if (!socket || !deviceRef.current?.loaded) return;

    return new Promise<{ sendTransport: Transport; recvTransport: Transport }>((resolve, reject) => {
      socket.emit(
        "createWebRtcTransport",
        { conversationId, direction: "send" },
        (response: { ok: boolean; data?: any; error?: any }) => {
          if (!response.ok) {
            reject(new Error(response.error?.message || "Failed to create send transport"));
            return;
          }

          const sendTransport = deviceRef.current!.createSendTransport(response.data);
          sendTransportRef.current = sendTransport;

          sendTransport.on(
            "connect",
            async (
              { dtlsParameters }: { dtlsParameters: DtlsParameters },
              callback: () => void,
              errback: (error: Error) => void,
            ) => {
            socket.emit(
              "connectTransport",
              {
                conversationId,
                transportId: sendTransport.id,
                dtlsParameters,
              },
              (connectResponse: { ok: boolean; error?: any }) => {
                if (connectResponse.ok) {
                  callback();
                } else {
                  errback(connectResponse.error);
                }
              },
            );
            },
          );

          sendTransport.on(
            "produce",
            async (
              {
                kind,
                rtpParameters,
                appData,
              }: { kind: "audio" | "video"; rtpParameters: RtpParameters; appData?: unknown },
              callback: ({ id }: { id: string }) => void,
              errback: (error: Error) => void,
            ) => {
            socket.emit(
              "produce",
              {
                conversationId,
                transportId: sendTransport.id,
                kind,
                rtpParameters,
                appData,
              },
              (produceResponse: { ok: boolean; data?: any; error?: any }) => {
                if (produceResponse.ok) {
                  callback({ id: produceResponse.data.producerId });
                } else {
                  errback(produceResponse.error);
                }
              },
            );
            },
          );

          // Create receive transport
          socket.emit(
            "createWebRtcTransport",
            { conversationId, direction: "recv" },
            (recvResponse: { ok: boolean; data?: any; error?: any }) => {
              if (!recvResponse.ok) {
                reject(new Error(recvResponse.error?.message || "Failed to create recv transport"));
                return;
              }

              const recvTransport = deviceRef.current!.createRecvTransport(recvResponse.data);
              recvTransportRef.current = recvTransport;

              recvTransport.on(
                "connect",
                async (
                  { dtlsParameters }: { dtlsParameters: DtlsParameters },
                  callback: () => void,
                  errback: (error: Error) => void,
                ) => {
                socket.emit(
                  "connectTransport",
                  {
                    conversationId,
                    transportId: recvTransport.id,
                    dtlsParameters,
                  },
                  (connectResponse: { ok: boolean; error?: any }) => {
                    if (connectResponse.ok) {
                      callback();
                    } else {
                      errback(connectResponse.error);
                    }
                  },
                );
                },
              );

              resolve({ sendTransport, recvTransport });
            },
          );
        },
      );
    });
  }, [socket]);

  const flushPendingProducers = useCallback(async () => {
    if (!currentConversationIdRef.current || pendingProducersRef.current.length === 0) {
      return;
    }

    const pending = [...pendingProducersRef.current];
    pendingProducersRef.current = [];

    for (const producer of pending) {
      await consumeProducer(producer.producerId, producer.kind, producer.userId);
    }
  }, [consumeProducer]);

  const endCall = useCallback(
    (reason?: string) => {
      if (currentConversationIdRef.current) {
        socket?.emit("leaveMediaRoom", currentConversationIdRef.current);
      }

      // Close producers
      producersRef.current.forEach((producer) => {
        producer.close();
      });
      producersRef.current.clear();

      // Close consumers
      consumersRef.current.forEach((consumer) => {
        consumer.close();
      });
      consumersRef.current.clear();

      // Close transports
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      sendTransportRef.current = null;
      recvTransportRef.current = null;

      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      setLocalStream(null);
      setIsScreenSharing(false);
      setActiveCall(null);
      setCallStatus("idle");
      setRemoteStreams(new Map());
      currentConversationIdRef.current = null;
      pendingProducersRef.current = [];
      consumedProducerIdsRef.current.clear();
      deviceLoadPromiseRef.current = null;
      deviceRef.current = null;
    },
    [socket],
  );

  const startGroupCall = useCallback(
    async (conversationId: string) => {
      if (!socket || callStatus !== "idle") return;

      try {
        setCallError(null);
        currentConversationIdRef.current = conversationId;
        setCallStatus("calling");

        // Get local media
        const stream = await ensureLocalStream();
        setLocalStream(stream);

        const joinResponse = await joinMediaRoom(conversationId);
        await ensureDeviceReady(joinResponse.rtpCapabilities);

        // Create transports
        await createTransports(conversationId);

        // Consume streams that arrived before transports were ready
        await flushPendingProducers();

        for (const existingProducer of joinResponse.existingProducers) {
          await consumeProducer(
            existingProducer.producerId,
            existingProducer.kind,
            existingProducer.userId,
          );
        }

        // Produce audio/video
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];

        if (audioTrack && sendTransportRef.current) {
          const audioProducer = await sendTransportRef.current.produce({
            track: audioTrack,
          });
          producersRef.current.set("audio", audioProducer);
        }

        if (videoTrack && sendTransportRef.current) {
          const videoProducer = await sendTransportRef.current.produce({
            track: videoTrack,
          });
          producersRef.current.set("video", videoProducer);
        }

        // Notify other peers that this user is starting a group call
        socket.emit("startGroupMediaCall", { conversationId });

        setActiveCall({
          callId: conversationId,
          conversationId,
          peerUserId: "",
          direction: "group",
        });
        setCallStatus("connected");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to start call";
        setCallError(message);
        endCall();
        setCallStatus("idle");
        currentConversationIdRef.current = null;
      }
    },
    [
      callStatus,
      consumeProducer,
      createTransports,
      ensureDeviceReady,
      ensureLocalStream,
      flushPendingProducers,
      joinMediaRoom,
      socket,
    ],
  );

  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall) return;
    await startGroupCall(incomingCall.conversationId);
    setIncomingCall(null);
  }, [incomingCall, startGroupCall]);

  const declineIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    socket?.emit("leaveMediaRoom", incomingCall.conversationId);
    setIncomingCall(null);
  }, [incomingCall, socket]);

  // Listen for new producers from other peers
  useEffect(() => {
    if (!socket) return;

    const handleNewProducer = ({
      producerId,
      kind,
      userId,
    }: {
      producerId: string;
      kind: "audio" | "video";
      userId: string;
    }) => {
      if (!producerId || !userId || userId === currentUserId) return;

      if (consumedProducerIdsRef.current.has(producerId)) {
        return;
      }

      if (!deviceRef.current?.loaded || !recvTransportRef.current) {
        pendingProducersRef.current.push({ producerId, kind, userId });
        return;
      }

      void consumeProducer(producerId, kind, userId).catch((error) => {
        console.error("[useWebRTCMediasoup] Failed to consume producer:", error);
      });
    };

    socket.on("newProducer", handleNewProducer);

    return () => {
      socket.off("newProducer", handleNewProducer);
    };
  }, [socket, currentUserId, consumeProducer]);

  // Listen for incoming group media calls
  useEffect(() => {
    if (!socket) return;

    const handleIncomingGroupMediaCall = ({
      conversationId,
      initiatorUserId,
      initiatedAt,
    }: {
      conversationId: string;
      initiatorUserId: string;
      initiatedAt: string;
    }) => {
      if (!conversationId || initiatorUserId === currentUserId) return;

      if (callStatus === "idle") {
        setIncomingCall({
          callId: conversationId,
          conversationId,
          fromUserId: initiatorUserId,
          toUserId: currentUserId,
          initiatedAt,
        });
      }
    };

    socket.on("incomingGroupMediaCall", handleIncomingGroupMediaCall);

    return () => {
      socket.off("incomingGroupMediaCall", handleIncomingGroupMediaCall);
    };
  }, [socket, currentUserId, callStatus]);

  // Listen for peers leaving
  useEffect(() => {
    if (!socket) return;

    const handlePeerLeft = ({ userId }: { userId: string }) => {
      const consumerIds: string[] = [];
      consumerMetaRef.current.forEach((meta, consumerId) => {
        if (meta.userId === userId) {
          consumerIds.push(consumerId);
        }
      });

      consumerIds.forEach((consumerId) => removeConsumer(consumerId));

      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on("mediaPeerLeft", handlePeerLeft);

    return () => {
      socket.off("mediaPeerLeft", handlePeerLeft);
    };
  }, [currentUserId, consumeProducer, removeConsumer, socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    remoteStreams,
    callStatus,
    incomingCall,
    activeCall,
    isMicrophoneEnabled,
    isScreenSharing,
    isCameraEnabled,
    callError,
    retryMediaPermission,
    startGroupCall,
    acceptIncomingCall,
    declineIncomingCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    clearCallError,
  };
}
