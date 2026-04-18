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
  callError: string | null;
  startVideoCall: (params: StartVideoCallParams) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: () => void;
  endVideoCall: (reason?: string) => void;
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
    default:
      return null;
  }
}

function toFriendlyMediaError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "NotAllowedError"
  ) {
    return "Can cap quyen Camera/Microphone de goi video. Trinh duyet chi cap quyen tren localhost hoac HTTPS.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "NotFoundError"
  ) {
    return "Khong tim thay camera hoac microphone tren thiet bi.";
  }

  if (error instanceof Error && error.message) {
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

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Trinh duyet khong ho tro getUserMedia. Hay thu tren localhost hoac HTTPS.",
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
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
        if (peerConnection.connectionState === "connected") {
          setCallStatus("connected");
          setCallError(null);
        }

        if (peerConnection.connectionState === "failed") {
          setCallError("Ket noi WebRTC that bai. Vui long thu lai.");
        }
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    },
    [],
  );

  const applyIncomingOfferAndAnswer = useCallback(
    async (payload: WebRtcOfferPayload) => {
      const currentCall = activeCallRef.current;
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

      setCallStatus("connected");
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
        await applyIncomingOfferAndAnswer(pendingOffer);
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
      const currentCall = activeCallRef.current;
      if (currentCall && socketRef.current) {
        socketRef.current.emit("endVideoCall", {
          callId: currentCall.callId,
          reason,
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
        if (incomingCallRef.current?.callId === payload.callId) {
          pendingOfferRef.current = payload;
        }
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
        setCallStatus("connected");
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
    callError,
    startVideoCall,
    acceptIncomingCall,
    declineIncomingCall,
    endVideoCall,
    clearCallError,
  };
}
