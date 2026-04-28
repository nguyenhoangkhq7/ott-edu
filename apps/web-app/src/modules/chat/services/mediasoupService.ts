// Socket events for mediasoup SFU signaling
// These are the events that will be emitted and listened to between client and server

import type { Socket } from "socket.io-client";

export interface JoinMediaRoomPayload {
  conversationId: string;
  rtpCapabilities?: any;
}

export interface CreateWebRtcTransportPayload {
  conversationId: string;
  direction: "send" | "recv";
}

export interface ConnectTransportPayload {
  conversationId: string;
  transportId: string;
  dtlsParameters: any;
}

export interface ProducePayload {
  conversationId: string;
  transportId: string;
  kind: "audio" | "video";
  rtpParameters: any;
  appData?: any;
}

export interface ConsumePayload {
  conversationId: string;
  producerId: string;
  rtpCapabilities: any;
}

export interface MediasoupSocketManager {
  /**
   * Get RTP capabilities from server for device initialization
   */
  getRtpCapabilities(
    conversationId: string,
    callback: (response: { ok: boolean; data?: any; error?: any }) => void,
  ): void;

  /**
   * Join a media room on the server
   */
  joinMediaRoom(
    payload: JoinMediaRoomPayload,
    callback: (response: { ok: boolean; data?: any; error?: any }) => void,
  ): void;

  /**
   * Create a WebRTC transport (send or recv)
   */
  createWebRtcTransport(
    payload: CreateWebRtcTransportPayload,
    callback: (response: { ok: boolean; data?: any; error?: any }) => void,
  ): void;

  /**
   * Connect a transport with DTLS parameters
   */
  connectTransport(
    payload: ConnectTransportPayload,
    callback: (response: { ok: boolean; error?: any }) => void,
  ): void;

  /**
   * Produce audio/video track
   */
  produce(
    payload: ProducePayload,
    callback: (response: { ok: boolean; data?: { producerId: string }; error?: any }) => void,
  ): void;

  /**
   * Consume a producer (subscribe to remote track)
   */
  consume(
    conversationId: string,
    consumeParams: any,
    callback: (response: { ok: boolean; data?: any; error?: any }) => void,
  ): void;

  /**
   * Resume a paused consumer
   */
  resume(
    conversationId: string,
    consumerId: string,
    callback: (response: { ok: boolean; error?: any }) => void,
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
      rtpParameters: any;
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
