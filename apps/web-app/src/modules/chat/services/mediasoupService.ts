// Socket events for mediasoup SFU signaling
// These are the events that will be emitted and listened to between client and server

import type { Socket } from "socket.io-client";

export interface JoinMediaRoomPayload {
  conversationId: string;
  rtpCapabilities?: unknown;
}

export interface CreateWebRtcTransportPayload {
  conversationId: string;
  direction: "send" | "recv";
}

export interface ConnectTransportPayload {
  conversationId: string;
  transportId: string;
  dtlsParameters: unknown;
}

export interface ProducePayload {
  conversationId: string;
  transportId: string;
  kind: "audio" | "video";
  rtpParameters: unknown;
  appData?: unknown;
}

export interface ConsumePayload {
  conversationId: string;
  producerId: string;
  rtpCapabilities: unknown;
}

export interface MediasoupSocketManager {
  /**
   * Get RTP capabilities from server for device initialization
   */
  getRtpCapabilities(
    conversationId: string,
    callback: (response: { ok: boolean; data?: unknown; error?: unknown }) => void,
  ): void;

  /**
   * Join a media room on the server
   */
  joinMediaRoom(
    payload: JoinMediaRoomPayload,
    callback: (response: { ok: boolean; data?: unknown; error?: unknown }) => void,
  ): void;

  /**
   * Create a WebRTC transport (send or recv)
   */
  createWebRtcTransport(
    payload: CreateWebRtcTransportPayload,
    callback: (response: { ok: boolean; data?: unknown; error?: unknown }) => void,
  ): void;

  /**
   * Connect a transport with DTLS parameters
   */
  connectTransport(
    payload: ConnectTransportPayload,
    callback: (response: { ok: boolean; error?: unknown }) => void,
  ): void;

  /**
   * Produce audio/video track
   */
  produce(
    payload: ProducePayload,
    callback: (response: { ok: boolean; data?: { producerId: string }; error?: unknown }) => void,
  ): void;

  /**
   * Consume a producer (subscribe to remote track)
   */
  consume(
    conversationId: string,
    consumeParams: unknown,
    callback: (response: { ok: boolean; data?: unknown; error?: unknown }) => void,
  ): void;

  /**
   * Resume a paused consumer
   */
  resume(
    conversationId: string,
    consumerId: string,
    callback: (response: { ok: boolean; error?: unknown }) => void,
  ): void;

  /**
   * Leave the media room
   */
  leaveMediaRoom(conversationId: string): void;

  /**
   * Listen for new producers from other peers
   */
  onNewProducer(handler: (data: { producerId: string; kind: "audio" | "video"; userId: string }) => void): void;

  /**
   * Listen for peers leaving
   */
  onPeerLeft(handler: (data: { userId: string }) => void): void;

  /**
   * Listen for consumer info (when we successfully consume a track)
   */
  onConsumerInfo(
    handler: (data: {
      consumerId: string;
      kind: "audio" | "video";
      userId: string;
      rtpParameters: unknown;
    }) => void,
  ): void;
}

export function setupMediasoupSocketListeners(socket: Socket): MediasoupSocketManager {
  return {
    getRtpCapabilities(conversationId, callback) {
      socket.emit("getRtpCapabilities", conversationId, callback);
    },

    joinMediaRoom(payload, callback) {
      socket.emit("joinMediaRoom", payload, callback);
    },

    createWebRtcTransport(payload, callback) {
      socket.emit("createWebRtcTransport", payload, callback);
    },

    connectTransport(payload, callback) {
      socket.emit("connectTransport", payload, callback);
    },

    produce(payload, callback) {
      socket.emit("produce", payload, callback);
    },

    consume(conversationId, consumeParams, callback) {
      socket.emit("consume", { conversationId, ...consumeParams }, callback);
    },

    resume(conversationId, consumerId, callback) {
      socket.emit("resume", { conversationId, consumerId }, callback);
    },

    leaveMediaRoom(conversationId) {
      socket.emit("leaveMediaRoom", conversationId);
    },

    onNewProducer(handler) {
      socket.on("newProducer", handler);
    },

    onPeerLeft(handler) {
      socket.on("mediaPeerLeft", handler);
    },

    onConsumerInfo(handler) {
      socket.on("consumerInfo", handler);
    },
  };
}
