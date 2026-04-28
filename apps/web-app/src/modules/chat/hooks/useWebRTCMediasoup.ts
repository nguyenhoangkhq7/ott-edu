"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";
import type { Device, Producer, Consumer, Transport } from "mediasoup-client/lib/types";
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
  callError: string | null;
  retryMediaPermission: () => Promise<void>;
  startGroupCall: (conversationId: string) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: () => void;
  endCall: (reason?: string) => void;
  toggleMicrophone: () => void;
  toggleCamera: () => void;
  clearCallError: () => void;
};

const RTC_ICE_SERVERS =
  typeof window !== "undefined" && (window as any).MEDIASOUP_ICE_SERVERS
    ? JSON.parse((window as any).MEDIASOUP_ICE_SERVERS)
    : [{ urls: "stun:stun.l.google.com:19302" }];

async function requestUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (typeof navigator === "undefined") {
    throw new Error("Navigator not available");
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia not supported");
  }

  return navigator.mediaDevices.getUserMedia(constraints);
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
  const [callError, setCallError] = useState<string | null>(null);

  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producersRef = useRef<Map<string, Producer>>(new Map());
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const currentConversationIdRef = useRef<string | null>(null);

  const clearCallError = useCallback(() => {
    setCallError(null);
  }, []);

  const retryMediaPermission = useCallback(async () => {
    try {
      setCallError(null);
      const stream = await requestUserMedia({ audio: true, video: true });
      setLocalStream(stream);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to access camera/microphone";
      setCallError(message);
    }
  }, []);

  const toggleMicrophone = useCallback(() => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMicrophoneEnabled(!isMicrophoneEnabled);
  }, [localStream, isMicrophoneEnabled]);

  const toggleCamera = useCallback(() => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraEnabled(!isCameraEnabled);
  }, [localStream, isCameraEnabled]);

  const initDevice = useCallback(async () => {
    if (!socket || deviceRef.current) return;

    try {
      const device = new mediasoupClient.Device();
      deviceRef.current = device;

      socket.emit(
        "getRtpCapabilities",
        currentConversationIdRef.current,
        (response: { ok: boolean; data?: any; error?: any }) => {
          if (response.ok && response.data) {
            device.load({ routerRtpCapabilities: response.data });
          } else {
            console.error("Failed to get RTP capabilities:", response.error);
          }
        },
      );
    } catch (error) {
      console.error("Failed to init device:", error);
    }
  }, [socket]);

  const createTransports = useCallback(async (conversationId: string) => {
    if (!socket || !deviceRef.current) return;

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

          sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
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
          });

          sendTransport.on("produce", async ({ kind, rtpParameters, appData }, callback, errback) => {
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
          });

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

              recvTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
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
              });

              resolve({ sendTransport, recvTransport });
            },
          );
        },
      );
    });
  }, [socket]);

  const startGroupCall = useCallback(
    async (conversationId: string) => {
      if (!socket || callStatus !== "idle") return;

      try {
        setCallError(null);
        currentConversationIdRef.current = conversationId;
        setCallStatus("connecting");

        // Get local media
        const stream = await requestUserMedia({ audio: true, video: true });
        setLocalStream(stream);

        // Initialize device if needed
        await initDevice();

        // Join media room
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            "joinMediaRoom",
            {
              conversationId,
              rtpCapabilities: deviceRef.current?.rtpCapabilities,
            },
            (response: { ok: boolean; data?: any; error?: any }) => {
              if (response.ok) {
                resolve();
              } else {
                reject(new Error(response.error?.message || "Failed to join media room"));
              }
            },
          );
        });

        // Create transports
        await createTransports(conversationId);

        // Produce audio/video
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];

        if (audioTrack && sendTransportRef.current) {
          const audioProducer = await sendTransportRef.current.produce({
            track: audioTrack,
            kind: "audio",
          });
          producersRef.current.set("audio", audioProducer);
        }

        if (videoTrack && sendTransportRef.current) {
          const videoProducer = await sendTransportRef.current.produce({
            track: videoTrack,
            kind: "video",
          });
          producersRef.current.set("video", videoProducer);
        }

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
        setCallStatus("idle");
      }
    },
    [socket, callStatus, initDevice, createTransports],
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

      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }

      setActiveCall(null);
      setCallStatus("idle");
      setRemoteStreams(new Map());
      currentConversationIdRef.current = null;
    },
    [socket, localStream],
  );

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
      if (!recvTransportRef.current || !deviceRef.current) return;

      recvTransportRef.current.consume({
        id: producerId,
        producerId,
        kind,
        rtpCapabilities: deviceRef.current.rtpCapabilities,
      });
    };

    socket.on("newProducer", handleNewProducer);

    return () => {
      socket.off("newProducer", handleNewProducer);
    };
  }, [socket]);

  // Listen for peers leaving
  useEffect(() => {
    if (!socket) return;

    const handlePeerLeft = ({ userId }: { userId: string }) => {
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
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callStatus !== "idle") {
        endCall();
      }
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    callStatus,
    incomingCall,
    activeCall,
    isMicrophoneEnabled,
    isCameraEnabled,
    callError,
    retryMediaPermission,
    startGroupCall,
    acceptIncomingCall,
    declineIncomingCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    clearCallError,
  };
}
