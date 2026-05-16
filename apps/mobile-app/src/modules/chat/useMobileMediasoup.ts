/**
 * useMobileMediasoup.ts
 *
 * Hook kết nối SFU Mediasoup cho React Native.
 *
 * Luồng hoạt động:
 *  1. joinMediaRoom  → server trả về rtpCapabilities + existingProducers
 *  2. Device.load(rtpCapabilities)
 *  3. createWebRtcTransport (send)  → sendTransport
 *  4. createWebRtcTransport (recv)  → recvTransport
 *  5. sendTransport.produce(audioTrack) + sendTransport.produce(videoTrack)
 *  6. Với mỗi existingProducer / newProducer → recvTransport.consume()
 *  7. consumer.resume()  (server pauses consumer by default)
 *
 * Socket events (client → server):
 *   joinMediaRoom, createWebRtcTransport, connectTransport,
 *   produce, consume, resume, closeProducer, leaveMediaRoom
 *
 * Socket events (server → client):
 *   newProducer, producerClosed, mediaPeerLeft, mediaPeerJoined, mediaError
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { MediaStream } from "react-native-webrtc";

// ─── Mediasoup-client types (loaded lazily) ───────────────────────────────────
type Device = import("mediasoup-client").Device;
type Transport = import("mediasoup-client/types").Transport;
type RtpCapabilities = import("mediasoup-client/types").RtpCapabilities;
type DtlsParameters = import("mediasoup-client/types").DtlsParameters;
type IceParameters = import("mediasoup-client/types").IceParameters;
type IceCandidate = import("mediasoup-client/types").IceCandidate;
type RtpParameters = import("mediasoup-client/types").RtpParameters;
type RNMediaStreamTrack = import("react-native-webrtc").MediaStreamTrack;

// ─── Internal types ────────────────────────────────────────────────────────────
type TransportOptions = {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
};

type AckResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type ExistingProducer = {
  producerId: string;
  kind: "audio" | "video";
  userId: string;
};

type NewProducerPayload = {
  producerId: string;
  kind: "audio" | "video";
  userId: string;
};

type ProducerClosedPayload = { producerId: string };
type MediaPeerLeftPayload = { userId: string; socketId: string; conversationId: string };

/** Một remote stream từ 1 peer trong phòng */
export type RemoteParticipant = {
  /** userId của peer */
  userId: string;
  /** MediaStream ghép từ các consumer của peer đó */
  stream: MediaStream;
  /** consumerId của audio track (nếu có) */
  audioConsumerId?: string;
  /** consumerId của video track (nếu có) */
  videoConsumerId?: string;
};

export type SfuCallStatus =
  | "idle"
  | "joining"   // đang join phòng
  | "ready"     // đã join, chờ produce
  | "connected" // đang trong phòng, có ít nhất 1 remote
  | "error";

export type UseMobileMediasoupParams = {
  socket: Socket | null;
  currentUserId: string;
  /** conversationId sẽ được dùng làm roomId cho SFU */
  conversationId: string | null;
  /** private call: chỉ cần 1 peer rời là kết thúc cuộc gọi */
  endOnPeerLeave?: boolean;
  /** group call: initiator tắt cuộc gọi sẽ kết thúc cho toàn bộ room */
  isCallInitiator?: boolean;
};

export type UseMobileMediasoupReturn = {
  /** Local camera/mic stream */
  localStream: MediaStream | null;
  /** Danh sách remote participants */
  remoteParticipants: RemoteParticipant[];
  callStatus: SfuCallStatus;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  cameraFacing: "front" | "back";
  callError: string | null;
  /** Bắt đầu join phòng và publish local stream */
  joinRoom: () => Promise<void>;
  /** Rời phòng và cleanup */
  leaveRoom: () => void;
  toggleMicrophone: () => void;
  toggleCamera: () => void;
  switchCamera: () => void;
  clearCallError: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ENABLE_WEBRTC = process.env.EXPO_PUBLIC_ENABLE_WEBRTC === "true";

let webRtcGlobalsRegistered = false;

// ─── Lazy loaders ─────────────────────────────────────────────────────────────
function loadWebRtcModule() {
  if (!ENABLE_WEBRTC) return null;
  try {
    return require("react-native-webrtc") as typeof import("react-native-webrtc");
  } catch {
    return null;
  }
}

function ensureWebRtcGlobals(webRtcModule: typeof import("react-native-webrtc")) {
  if (webRtcGlobalsRegistered) return;
  if (typeof webRtcModule.registerGlobals === "function") {
    webRtcModule.registerGlobals();
    webRtcGlobalsRegistered = true;
  }
}

function loadMediasoupClient() {
  try {
    // mediasoup-client phải được cài: npm i mediasoup-client
    return require("mediasoup-client") as typeof import("mediasoup-client");
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toFriendlyError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "NotAllowedError"
  ) {
    return "Cần cấp quyền Camera/Microphone để tham gia cuộc gọi.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Đã xảy ra lỗi không xác định.";
}

/**
 * Gọi socket emit với callback (ack).
 * Trả về Promise<AckResponse<T>>.
 */
function socketEmitAck<T = unknown>(
  socket: Socket,
  event: string,
  data: unknown,
): Promise<AckResponse<T>> {
  return new Promise((resolve) => {
    // Timeout bảo vệ nếu server không ack
    const timer = setTimeout(() => {
      resolve({
        ok: false,
        error: { code: "TIMEOUT", message: `Socket event "${event}" timed out.` },
      });
    }, 10_000);

    socket.emit(event, data, (response: AckResponse<T>) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMobileMediasoup({
  socket,
  currentUserId,
  conversationId,
  endOnPeerLeave = false,
  isCallInitiator = false,
}: UseMobileMediasoupParams): UseMobileMediasoupReturn {
  // ── state ──
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [callStatus, setCallStatus] = useState<SfuCallStatus>("idle");
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [callError, setCallError] = useState<string | null>(null);

  // ── refs ──
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  /** producerId → kind mapping của local producers */
  const localProducerIdsRef = useRef<Map<string, "audio" | "video">>(new Map());
  /**
   * Lưu MediaStream theo userId để có thể addTrack vào stream đúng peer.
   * key = userId
   */
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  /**
   * consumerId → userId (để biết khi producerClosed cần update participant nào)
   */
  const consumerUserMapRef = useRef<Map<string, string>>(new Map());
  /**
   * producerId -> consumerId mapping để xử lý đúng event producerClosed từ server.
   */
  const producerConsumerMapRef = useRef<Map<string, string>>(new Map());
  /**
   * Track thông tin consumerId của từng peer (audio/video)
   * key = userId, value = { audioConsumerId?, videoConsumerId? }
   */
  const peerConsumerInfoRef = useRef<
    Map<string, { audioConsumerId?: string; videoConsumerId?: string }>
  >(new Map());

  const conversationIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const isCleaningUpRef = useRef(false);

  // ── sync refs ──
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ─── helpers (stable callbacks) ──────────────────────────────────────────────

  const clearCallError = useCallback(() => setCallError(null), []);

  /** Dừng tất cả track trong 1 stream */
  const stopStream = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach((t) => t.stop());
  }, []);

  /** Đồng bộ state remoteParticipants từ ref */
  const syncRemoteParticipants = useCallback(() => {
    if (!isMountedRef.current) return;
    const participants: RemoteParticipant[] = [];
    remoteStreamsRef.current.forEach((stream, userId) => {
      const info = peerConsumerInfoRef.current.get(userId) ?? {};
      participants.push({
        userId,
        stream,
        audioConsumerId: info.audioConsumerId,
        videoConsumerId: info.videoConsumerId,
      });
    });
    setRemoteParticipants(participants);
  }, []);

  /**
   * Rebuild remote stream theo kind để RTCView cập nhật ổn định trên mobile.
   */
  const upsertRemoteTrack = useCallback((userId: string, track: RNMediaStreamTrack) => {
    const webRtcModule = loadWebRtcModule();
    if (!webRtcModule) return;

    const existing = remoteStreamsRef.current.get(userId) as unknown as import("react-native-webrtc").MediaStream | undefined;
    const next = new webRtcModule.MediaStream();

    if (existing) {
      existing.getTracks().forEach((t) => {
        if (t.kind !== track.kind && t.readyState !== "ended") {
          next.addTrack(t);
        }
      });
    }

    next.addTrack(track);
    remoteStreamsRef.current.set(userId, next as unknown as MediaStream);
  }, []);

  /**
   * Xử lý 1 producerId: consume từ recvTransport → add track vào remote stream.
   */
  const consumeProducer = useCallback(
    async (producerId: string, kind: "audio" | "video", userId: string) => {
      const socket = socketRef.current;
      const roomId = conversationIdRef.current;
      const recvTransport = recvTransportRef.current;
      const device = deviceRef.current;

      if (!socket || !roomId || !recvTransport || !device) return;

      try {
        const ack = await socketEmitAck<{
          id: string;
          producerId: string;
          kind: "audio" | "video";
          rtpParameters: unknown;
        }>(socket, "consume", {
          conversationId: roomId,
          transportId: recvTransport.id,
          producerId,
          rtpCapabilities: device.rtpCapabilities,
        });

        if (!ack.ok) {
          console.warn("[useMobileMediasoup] consume error:", ack.error);
          return;
        }

        const { id: consumerId, rtpParameters } = ack.data;

        // Tạo consumer trong mediasoup-client
        const consumer = await recvTransport.consume({
          id: consumerId,
          producerId,
          kind,
          rtpParameters: rtpParameters as RtpParameters,
        });

        // Ghi nhận mapping
        consumerUserMapRef.current.set(consumerId, userId);
        producerConsumerMapRef.current.set(producerId, consumerId);
        const peerInfo = peerConsumerInfoRef.current.get(userId) ?? {};
        if (kind === "audio") peerInfo.audioConsumerId = consumerId;
        else peerInfo.videoConsumerId = consumerId;
        peerConsumerInfoRef.current.set(userId, peerInfo);

        // Thêm track vào remote stream của userId
        upsertRemoteTrack(
          userId,
          consumer.track as unknown as RNMediaStreamTrack,
        );

        // Resume consumer trên server (server tạo ở trạng thái paused)
        await socketEmitAck(socket, "resume", {
          conversationId: roomId,
          consumerId,
        });

        syncRemoteParticipants();
      } catch (err) {
        console.error("[useMobileMediasoup] consumeProducer error:", err);
      }
    },
    [syncRemoteParticipants, upsertRemoteTrack],
  );

  // ─── Cleanup toàn bộ SFU state ───────────────────────────────────────────────
  const cleanup = useCallback(
    (options?: { preserveError?: boolean }) => {
      if (isCleaningUpRef.current) return;
      isCleaningUpRef.current = true;

      // Đóng transports
      try { sendTransportRef.current?.close(); } catch { /* noop */ }
      try { recvTransportRef.current?.close(); } catch { /* noop */ }
      sendTransportRef.current = null;
      recvTransportRef.current = null;
      deviceRef.current = null;

      // Dừng local stream
      stopStream(localStreamRef.current);
      localStreamRef.current = null;

      // Dừng remote streams
      remoteStreamsRef.current.forEach((s) => stopStream(s as unknown as MediaStream));
      remoteStreamsRef.current.clear();
      consumerUserMapRef.current.clear();
      producerConsumerMapRef.current.clear();
      peerConsumerInfoRef.current.clear();
      localProducerIdsRef.current.clear();

      if (!isMountedRef.current) return;
      setLocalStream(null);
      setRemoteParticipants([]);
      setCallStatus("idle");
      setIsMicrophoneEnabled(true);
      setIsCameraEnabled(true);
      setCameraFacing("front");
      if (!options?.preserveError) setCallError(null);

      isCleaningUpRef.current = false;
    },
    [stopStream],
  );

  // ─── leaveRoom ───────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    const roomId = conversationIdRef.current;
    if (roomId && socketRef.current) {
      if (isCallInitiator && !endOnPeerLeave) {
        socketRef.current.emit("callEnded", {
          conversationId: roomId,
          endedByUserId: currentUserId,
          reason: "initiator-ended",
        });
      }
      socketRef.current.emit("leaveMediaRoom", roomId);
    }
    cleanup();
  }, [cleanup, currentUserId, endOnPeerLeave, isCallInitiator]);

  // ─── joinRoom ────────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async () => {
    const socket = socketRef.current;
    const roomId = conversationIdRef.current;

    if (!socket || !roomId || !currentUserId) {
      setCallError("Không có kết nối socket hoặc chưa chọn phòng.");
      return;
    }

    if (callStatus !== "idle") return;

    const webRtcModule = loadWebRtcModule();
    if (!webRtcModule) {
      setCallError(
        "Tính năng gọi video cần Expo Development Build (không hỗ trợ Expo Go).",
      );
      return;
    }

    ensureWebRtcGlobals(webRtcModule);

    const mediasoupClient = loadMediasoupClient();
    if (!mediasoupClient) {
      setCallError(
        "Thư viện mediasoup-client chưa được cài đặt. Chạy: npm i mediasoup-client",
      );
      return;
    }

    try {
      isCleaningUpRef.current = false;
      setCallError(null);
      setCallStatus("joining");

      // ── 1. Lấy local media ─────────────────────────────────────────────────
      const stream = await webRtcModule.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });

      localStreamRef.current = stream as unknown as MediaStream;
      if (isMountedRef.current) {
        setLocalStream(stream as unknown as MediaStream);
        setIsMicrophoneEnabled(stream.getAudioTracks().some((t) => t.enabled));
        setIsCameraEnabled(stream.getVideoTracks().some((t) => t.enabled));
      }

      // ── 2. Join media room → rtpCapabilities + existingProducers ──────────
      const joinAck = await socketEmitAck<{
        rtpCapabilities: RtpCapabilities;
        existingProducers: ExistingProducer[];
      }>(socket, "joinMediaRoom", { conversationId: roomId });

      if (!joinAck.ok) {
        throw new Error(joinAck.error.message);
      }

      const { rtpCapabilities, existingProducers } = joinAck.data;

      // ── 3. Load mediasoup Device ──────────────────────────────────────────
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = device;

      // ── 4. Tạo sendTransport ──────────────────────────────────────────────
      const sendAck = await socketEmitAck<TransportOptions>(
        socket,
        "createWebRtcTransport",
        { conversationId: roomId, direction: "send" },
      );

      if (!sendAck.ok) throw new Error(sendAck.error.message);

      const sendTransport = device.createSendTransport(sendAck.data);
      sendTransportRef.current = sendTransport;

      sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
        socketEmitAck(socket, "connectTransport", {
          conversationId: roomId,
          transportId: sendTransport.id,
          dtlsParameters,
        })
          .then((ack) => {
            if (ack.ok) callback();
            else errback(new Error(ack.error.message));
          })
          .catch(errback);
      });

      sendTransport.on("produce", async ({ kind, rtpParameters, appData }, callback, errback) => {
        try {
          const produceAck = await socketEmitAck<{ producerId: string }>(socket, "produce", {
            conversationId: roomId,
            transportId: sendTransport.id,
            kind,
            rtpParameters,
            appData,
          });

          if (!produceAck.ok) {
            errback(new Error(produceAck.error.message));
            return;
          }

          callback({ id: produceAck.data.producerId });
        } catch (err) {
          errback(err as Error);
        }
      });

      // ── 5. Tạo recvTransport ──────────────────────────────────────────────
      const recvAck = await socketEmitAck<TransportOptions>(
        socket,
        "createWebRtcTransport",
        { conversationId: roomId, direction: "recv" },
      );

      if (!recvAck.ok) throw new Error(recvAck.error.message);

      const recvTransport = device.createRecvTransport(recvAck.data);
      recvTransportRef.current = recvTransport;

      recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
        socketEmitAck(socket, "connectTransport", {
          conversationId: roomId,
          transportId: recvTransport.id,
          dtlsParameters,
        })
          .then((ack) => {
            if (ack.ok) callback();
            else errback(new Error(ack.error.message));
          })
          .catch(errback);
      });

      // ── 6. Produce local audio & video ────────────────────────────────────
      const audioTrack = (stream as unknown as import("react-native-webrtc").MediaStream)
        .getAudioTracks()[0];
      const videoTrack = (stream as unknown as import("react-native-webrtc").MediaStream)
        .getVideoTracks()[0];

      if (audioTrack) {
        const audioProducer = await sendTransport.produce({
          track: audioTrack as unknown as RNMediaStreamTrack,
          appData: { userId: currentUserId, kind: "audio" },
        });
        localProducerIdsRef.current.set(audioProducer.id, "audio");
      }

      if (videoTrack) {
        const videoProducer = await sendTransport.produce({
          track: videoTrack as unknown as RNMediaStreamTrack,
          encodings: [
            { maxBitrate: 100_000 },
            { maxBitrate: 300_000 },
            { maxBitrate: 900_000 },
          ],
          codecOptions: { videoGoogleStartBitrate: 1000 },
          appData: { userId: currentUserId, kind: "video" },
        });
        localProducerIdsRef.current.set(videoProducer.id, "video");
      }

      // ── 7. Consume existing producers ─────────────────────────────────────
      for (const ep of existingProducers) {
        await consumeProducer(ep.producerId, ep.kind, ep.userId);
      }

      socket.emit("startGroupMediaCall", { conversationId: roomId });

      if (isMountedRef.current) {
        setCallStatus(existingProducers.length > 0 ? "connected" : "ready");
      }
    } catch (err) {
      console.error("[useMobileMediasoup] joinRoom error:", err);
      if (isMountedRef.current) {
        setCallError(toFriendlyError(err));
        setCallStatus("error");
      }
      cleanup({ preserveError: true });
    }
  }, [callStatus, cleanup, consumeProducer, currentUserId]);

  // ─── Xử lý media controls ────────────────────────────────────────────────────
  const toggleMicrophone = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = (stream as unknown as import("react-native-webrtc").MediaStream).getAudioTracks();
    if (tracks.length === 0) return;
    const shouldEnable = tracks.some((t) => !t.enabled);
    tracks.forEach((t) => { t.enabled = shouldEnable; });
    setIsMicrophoneEnabled(shouldEnable);
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = (stream as unknown as import("react-native-webrtc").MediaStream).getVideoTracks();
    if (tracks.length === 0) return;
    const shouldEnable = tracks.some((t) => !t.enabled);
    tracks.forEach((t) => { t.enabled = shouldEnable; });
    setIsCameraEnabled(shouldEnable);
  }, []);

  const switchCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = (stream as unknown as import("react-native-webrtc").MediaStream)
      .getVideoTracks()[0] as (RNMediaStreamTrack & {
        _switchCamera?: () => void;
      }) | undefined;

    if (!videoTrack || typeof videoTrack._switchCamera !== "function") return;
    videoTrack._switchCamera();
    setCameraFacing((prev) => (prev === "front" ? "back" : "front"));
  }, []);

  // ─── Lắng nghe sự kiện từ server ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewProducer = async (payload: NewProducerPayload) => {
      // Không consume producer của chính mình
      if (payload.userId === currentUserId) return;
      await consumeProducer(payload.producerId, payload.kind, payload.userId);
      if (isMountedRef.current) {
        setCallStatus("connected");
      }
    };

    const handleProducerClosed = ({ producerId }: ProducerClosedPayload) => {
      const consumerId = producerConsumerMapRef.current.get(producerId);
      if (!consumerId) return;

      // Tìm userId sở hữu consumer tương ứng producerId đã đóng
      const userId = consumerUserMapRef.current.get(consumerId);
      if (!userId) return;

      // Xoá consumer khỏi tracking
      producerConsumerMapRef.current.delete(producerId);
      consumerUserMapRef.current.delete(consumerId);

      const peerInfo = peerConsumerInfoRef.current.get(userId);
      if (peerInfo) {
        if (peerInfo.audioConsumerId === consumerId) peerInfo.audioConsumerId = undefined;
        if (peerInfo.videoConsumerId === consumerId) peerInfo.videoConsumerId = undefined;

        // Nếu peer không còn consumer nào → xoá khỏi danh sách
        if (!peerInfo.audioConsumerId && !peerInfo.videoConsumerId) {
          peerConsumerInfoRef.current.delete(userId);
          stopStream(remoteStreamsRef.current.get(userId) as unknown as MediaStream);
          remoteStreamsRef.current.delete(userId);
        }
      }

      syncRemoteParticipants();
      setCallStatus(remoteStreamsRef.current.size > 0 ? "connected" : "ready");
    };

    const handleMediaPeerLeft = ({ userId }: MediaPeerLeftPayload) => {
      if (endOnPeerLeave && userId !== currentUserId) {
        cleanup();
        return;
      }

      peerConsumerInfoRef.current.delete(userId);
      stopStream(remoteStreamsRef.current.get(userId) as unknown as MediaStream);
      remoteStreamsRef.current.delete(userId);
      // Xoá tất cả consumer mapping của userId này
      consumerUserMapRef.current.forEach((uid, consumerId) => {
        if (uid === userId) consumerUserMapRef.current.delete(consumerId);
      });
      producerConsumerMapRef.current.forEach((mappedConsumerId, producerId) => {
        if (mappedConsumerId && !consumerUserMapRef.current.has(mappedConsumerId)) {
          producerConsumerMapRef.current.delete(producerId);
        }
      });
      syncRemoteParticipants();
      setCallStatus(remoteStreamsRef.current.size > 0 ? "connected" : "ready");
    };

    const handleCallEnded = ({
      conversationId: endedConversationId,
    }: {
      conversationId: string;
      endedByUserId?: string;
      reason?: string;
    }) => {
      if (!conversationIdRef.current || endedConversationId !== conversationIdRef.current) return;
      cleanup();
    };

    const handleMediaError = (err: { code: string; message: string }) => {
      console.error("[useMobileMediasoup] mediaError from server:", err);
      if (isMountedRef.current) {
        setCallError(`Lỗi server: ${err.message} (${err.code})`);
      }
    };

    socket.on("newProducer", handleNewProducer);
    socket.on("producerClosed", handleProducerClosed);
    socket.on("mediaPeerLeft", handleMediaPeerLeft);
    socket.on("mediaError", handleMediaError);
    socket.on("callEnded", handleCallEnded);
    socket.on("videoCallEnded", handleCallEnded);

    return () => {
      socket.off("newProducer", handleNewProducer);
      socket.off("producerClosed", handleProducerClosed);
      socket.off("mediaPeerLeft", handleMediaPeerLeft);
      socket.off("mediaError", handleMediaError);
      socket.off("callEnded", handleCallEnded);
      socket.off("videoCallEnded", handleCallEnded);
    };
  }, [cleanup, consumeProducer, currentUserId, endOnPeerLeave, socket, stopStream, syncRemoteParticipants]);

  // ─── Cleanup khi unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Không gọi socket.emit tại đây vì socket có thể đã ngắt.
      // leaveRoom phải được gọi chủ động từ component.
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    localStream,
    remoteParticipants,
    callStatus,
    isMicrophoneEnabled,
    isCameraEnabled,
    cameraFacing,
    callError,
    joinRoom,
    leaveRoom,
    toggleMicrophone,
    toggleCamera,
    switchCamera,
    clearCallError,
  };
}
