import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { Server, Socket } from "socket.io";
import mediasoup from "mediasoup";
import type {
  Consumer,
  DtlsParameters,
  Producer,
  Router,
  RtpCapabilities,
  RtpParameters,
  WebRtcTransport,
  Worker,
} from "mediasoup/types";
import CallLog from "./model/CallLog.ts";
import Conversation from "./model/Conversation.ts";
import Message from "./model/Message.ts";
import mediasoupConfig from "./config/mediasoup.ts";

type StartVideoCallPayload = {
  calleeUserId: string;
  conversationId: string;
};

type WebRtcOfferPayload = {
  callId: string;
  toUserId?: string;
  offer: unknown;
};

type WebRtcAnswerPayload = {
  callId: string;
  toUserId?: string;
  answer: unknown;
};

type WebRtcIceCandidatePayload = {
  callId: string;
  toUserId?: string;
  candidate: unknown;
};

type EndVideoCallPayload = {
  callId: string;
  reason?: string;
};

type CallSessionStatus = "ringing" | "connected";

type CallSession = {
  callId: string;
  conversationId: string;
  callerId: string;
  calleeId: string;
  status: CallSessionStatus;
  createdAt: number;
  connectedAt?: number;
};

type JoinMediaRoomPayload = {
  conversationId: string;
  rtpCapabilities?: RtpCapabilities;
};

type CreateWebRtcTransportPayload = {
  conversationId: string;
  direction: "send" | "recv";
};

type MediaCallKind = "audio" | "video";

type ConnectTransportPayload = {
  conversationId: string;
  transportId: string;
  dtlsParameters: DtlsParameters;
};

type ProducePayload = {
  conversationId: string;
  transportId: string;
  kind: "audio" | "video";
  rtpParameters: RtpParameters;
  appData?: Record<string, unknown>;
};

type ConsumePayload = {
  conversationId: string;
  transportId: string;
  producerId: string;
  rtpCapabilities?: RtpCapabilities;
};

type ResumeConsumerPayload = {
  conversationId: string;
  consumerId: string;
};

type MediaAck =
  | ((response: { ok: true; data: unknown }) => void)
  | ((response: {
      ok: false;
      error: { code: string; message: string };
    }) => void);

type MediaPeer = {
  socketId: string;
  userId: string;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  rtpCapabilities?: RtpCapabilities;
};

type MediaRoom = {
  conversationId: string;
  router: Router;
  peers: Map<string, MediaPeer>;
};

class SocketManager {
  private io: Server | null = null;
  private onlineUsers = new Map<string, string>();
  private callSessions = new Map<string, CallSession>();
  private activeCallByUser = new Map<string, string>();
  private mediasoupReady: Promise<void> | null = null;
  private mediasoupWorkers: Worker[] = [];
  private nextMediasoupWorkerIndex = 0;
  private mediaRooms = new Map<string, MediaRoom>();
  private mediaCallByConversation = new Map<
    string,
    { callId: string; callType: MediaCallKind; callerId: string; calleeId: string }
  >();

  private normalizeUserId(userId: unknown): string | null {
    if (typeof userId === "string" && userId.trim().length > 0) {
      return userId.trim();
    }

    return null;
  }

  private getPeerId(session: CallSession, userId: string): string | null {
    if (session.callerId === userId) {
      return session.calleeId;
    }

    if (session.calleeId === userId) {
      return session.callerId;
    }

    return null;
  }

  private isSessionParticipant(session: CallSession, userId: string): boolean {
    return session.callerId === userId || session.calleeId === userId;
  }

  private emitToUser(
    userId: string,
    eventName: string,
    payload: unknown,
  ): boolean {
    if (!this.io) {
      return false;
    }

    const socketId = this.onlineUsers.get(userId);
    if (!socketId) {
      return false;
    }

    this.io.to(socketId).emit(eventName, payload);
    return true;
  }

  public isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  private clearCallSession(callId: string): void {
    const session = this.callSessions.get(callId);
    if (!session) {
      return;
    }

    this.callSessions.delete(callId);
    this.activeCallByUser.delete(session.callerId);
    this.activeCallByUser.delete(session.calleeId);
  }

  private mapReasonToCallStatus(
    reason: string,
  ): "ended" | "declined" | "unavailable" | "failed" {
    switch (reason) {
      case "declined":
        return "declined";
      case "callee-busy":
      case "callee-offline":
      case "peer-offline":
      case "no-answer":
        return "unavailable";
      case "accept-failed":
      case "offer-create-failed":
      case "offer-handle-failed":
      case "peer-disconnected":
        return "failed";
      default:
        return "ended";
    }
  }

  private async createCallLog(session: CallSession): Promise<void> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(session.conversationId) ||
        !mongoose.Types.ObjectId.isValid(session.callerId) ||
        !mongoose.Types.ObjectId.isValid(session.calleeId)
      ) {
        return;
      }

      await CallLog.create({
        callId: session.callId,
        conversationId: new mongoose.Types.ObjectId(session.conversationId),
        callerId: new mongoose.Types.ObjectId(session.callerId),
        calleeId: new mongoose.Types.ObjectId(session.calleeId),
        callType: "video",
        status: "ringing",
        startedAt: new Date(session.createdAt),
      });
    } catch (error) {
      console.error("[SocketManager] createCallLog error:", error);
    }
  }

  private async markCallConnected(
    callId: string,
    connectedAt: number,
  ): Promise<void> {
    try {
      await CallLog.findOneAndUpdate(
        { callId } as any,
        {
          $set: {
            status: "connected",
            connectedAt: new Date(connectedAt),
          },
        },
        { new: true, upsert: false } as any,
      );
    } catch (error) {
      console.error("[SocketManager] markCallConnected error:", error);
    }
  }

  private async finalizeCallLog(
    callId: string,
    reason: string,
    endedAtMs?: number,
  ): Promise<void> {
    try {
      const endedAtDate = new Date(endedAtMs || Date.now());
      const current = await CallLog.findOne({ callId } as any)
        .select("startedAt")
        .lean();

      const startedAtMs = current?.startedAt
        ? new Date(current.startedAt).getTime()
        : endedAtDate.getTime();
      const durationSec = Math.max(
        0,
        Math.round((endedAtDate.getTime() - startedAtMs) / 1000),
      );

      await CallLog.findOneAndUpdate(
        { callId } as any,
        {
          $set: {
            status: this.mapReasonToCallStatus(reason),
            endedAt: endedAtDate,
            durationSec,
            endReason: reason,
          },
        },
        { new: true, upsert: false } as any,
      );
    } catch (error) {
      console.error("[SocketManager] finalizeCallLog error:", error);
    }
  }

  private endCallSession(
    callId: string,
    endedByUserId: string,
    reason: string,
    notifyEndedByUser = true,
  ): void {
    const session = this.callSessions.get(callId);
    if (!session) {
      return;
    }

    const peerUserId = this.getPeerId(session, endedByUserId);
    void this.finalizeCallLog(callId, reason);
    this.clearCallSession(callId);

    if (notifyEndedByUser) {
      this.emitToUser(endedByUserId, "videoCallEnded", {
        callId,
        reason,
        endedBy: endedByUserId,
      });
    }

    if (peerUserId) {
      this.emitToUser(peerUserId, "videoCallEnded", {
        callId,
        reason,
        endedBy: endedByUserId,
      });
    }
  }

  private async canStartPrivateCall(
    conversationId: string,
    callerId: string,
    calleeId: string,
  ): Promise<boolean> {
    const conversation = await Conversation.findOne(
      {
        _id: conversationId,
        type: "private",
        isArchived: { $ne: true },
        participants: { $all: [callerId, calleeId] },
      },
      { participants: 1, type: 1 },
    ).lean();

    if (!conversation) {
      return false;
    }

    const participantIds = (conversation.participants || []).map(
      (participant) => participant.toString(),
    );

    return (
      participantIds.length === 2 &&
      participantIds.includes(callerId) &&
      participantIds.includes(calleeId)
    );
  }

  private async startMediaConversationCall(
    conversationId: string,
    callerId: string,
    callType: MediaCallKind,
  ): Promise<void> {
    const existing = this.mediaCallByConversation.get(conversationId);
    if (existing) {
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(conversationId) ||
      !mongoose.Types.ObjectId.isValid(callerId)
    ) {
      return;
    }

    const conversation = await Conversation.findOne(
      {
        _id: conversationId,
        type: "private",
        isArchived: { $ne: true },
        participants: callerId,
      },
      { participants: 1 },
    ).lean();

    if (!conversation || !Array.isArray(conversation.participants)) {
      return;
    }

    const participantIds = conversation.participants.map((participant) =>
      participant.toString(),
    );

    if (participantIds.length !== 2) {
      return;
    }

    const calleeId = participantIds.find((id) => id !== callerId);
    if (!calleeId || !mongoose.Types.ObjectId.isValid(calleeId)) {
      return;
    }

    const callId = randomUUID();
    await CallLog.create({
      callId,
      conversationId: new mongoose.Types.ObjectId(conversationId),
      callerId: new mongoose.Types.ObjectId(callerId),
      calleeId: new mongoose.Types.ObjectId(calleeId),
      callType,
      status: "ringing",
      startedAt: new Date(),
    });

    this.mediaCallByConversation.set(conversationId, {
      callId,
      callType,
      callerId,
      calleeId,
    });
  }

  private markMediaConversationConnected(conversationId: string): void {
    const mediaCall = this.mediaCallByConversation.get(conversationId);
    if (!mediaCall) {
      return;
    }

    void this.markCallConnected(mediaCall.callId, Date.now());
  }

  private finalizeMediaConversationCall(
    conversationId: string,
    reason: string,
  ): void {
    const mediaCall = this.mediaCallByConversation.get(conversationId);
    if (!mediaCall) {
      return;
    }

    this.mediaCallByConversation.delete(conversationId);
    void this.finalizeCallLog(mediaCall.callId, reason, Date.now());
  }

  private relayWebRtcPayload(
    socket: Socket,
    fromUserId: string,
    eventName: "webrtcOffer" | "webrtcAnswer" | "webrtcIceCandidate",
    payload: {
      callId: string;
      toUserId?: string;
      dataKey: "offer" | "answer" | "candidate";
      dataValue: unknown;
    },
  ): boolean {
    const { callId, toUserId, dataKey, dataValue } = payload;
    const session = this.callSessions.get(callId);

    if (!session) {
      socket.emit("videoCallError", {
        code: "CALL_NOT_FOUND",
        message: "Video call session not found.",
        callId,
      });
      return false;
    }

    if (!this.isSessionParticipant(session, fromUserId)) {
      socket.emit("videoCallError", {
        code: "CALL_FORBIDDEN",
        message: "You are not a participant of this call.",
        callId,
      });
      return false;
    }

    const peerUserId = this.getPeerId(session, fromUserId);
    if (!peerUserId) {
      socket.emit("videoCallError", {
        code: "PEER_NOT_FOUND",
        message: "Peer user is unavailable for this call.",
        callId,
      });
      return false;
    }

    if (toUserId && toUserId !== peerUserId) {
      socket.emit("videoCallError", {
        code: "INVALID_TARGET",
        message: "Signal target does not match current call session.",
        callId,
      });
      return false;
    }

    const emitted = this.emitToUser(peerUserId, eventName, {
      callId,
      fromUserId,
      toUserId: peerUserId,
      conversationId: session.conversationId,
      [dataKey]: dataValue,
    });

    if (!emitted) {
      socket.emit("videoCallUnavailable", {
        callId,
        toUserId: peerUserId,
        reason: "peer-offline",
      });
      this.endCallSession(callId, fromUserId, "peer-offline", false);
      return false;
    }

    return true;
  }

  private safeAck(
    ack: unknown,
    payload:
      | { ok: true; data: unknown }
      | { ok: false; error: { code: string; message: string } },
  ): void {
    if (typeof ack === "function") {
      (ack as MediaAck)(payload as any);
    }
  }

  private emitMediaError(
    socket: Socket,
    code: string,
    message: string,
    ack?: unknown,
  ): void {
    if (ack) {
      this.safeAck(ack, { ok: false, error: { code, message } });
      return;
    }

    socket.emit("mediaError", { code, message });
  }

  private async initMediasoupWorkers(): Promise<void> {
    if (this.mediasoupWorkers.length > 0) {
      return;
    }

    const workerCount = Math.max(1, mediasoupConfig.workerCount || 1);

    for (let i = 0; i < workerCount; i += 1) {
      const worker = await mediasoup.createWorker(mediasoupConfig.worker);

      worker.on("died", () => {
        console.error("[Mediasoup] worker died, exiting in 2s...", {
          pid: worker.pid,
        });
        setTimeout(() => process.exit(1), 2000);
      });

      this.mediasoupWorkers.push(worker);
    }

    console.log(
      `[Mediasoup] started ${this.mediasoupWorkers.length} worker(s).`,
    );
  }

  private getMediasoupWorker(): Worker {
    if (this.mediasoupWorkers.length === 0) {
      throw new Error("Mediasoup workers not initialized.");
    }

    const worker = this.mediasoupWorkers[this.nextMediasoupWorkerIndex];
    this.nextMediasoupWorkerIndex =
      (this.nextMediasoupWorkerIndex + 1) % this.mediasoupWorkers.length;
    if (!worker) {
      throw new Error("Worker is not available.");
    }
    return worker;
  }

  private async getOrCreateMediaRoom(
    conversationId: string,
  ): Promise<MediaRoom> {
    const existing = this.mediaRooms.get(conversationId);
    if (existing) {
      return existing;
    }

    const worker = this.getMediasoupWorker();
    const router = await worker.createRouter({
      mediaCodecs: mediasoupConfig.router.mediaCodecs,
    });

    const room: MediaRoom = {
      conversationId,
      router,
      peers: new Map(),
    };

    this.mediaRooms.set(conversationId, room);
    return room;
  }

  private getMediaPeer(room: MediaRoom, socketId: string): MediaPeer | null {
    return room.peers.get(socketId) || null;
  }

  private ensureMediaPeer(
    room: MediaRoom,
    socketId: string,
    userId: string,
  ): MediaPeer {
    const existing = room.peers.get(socketId);
    if (existing) {
      existing.userId = userId;
      return existing;
    }

    const peer: MediaPeer = {
      socketId,
      userId,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    };

    room.peers.set(socketId, peer);
    return peer;
  }

  private closeMediaPeer(room: MediaRoom, peer: MediaPeer): void {
    peer.consumers.forEach((consumer) => {
      try {
        consumer.close();
      } catch (error) {
        console.warn("[Mediasoup] consumer close error", error);
      }
    });

    peer.producers.forEach((producer) => {
      try {
        producer.close();
      } catch (error) {
        console.warn("[Mediasoup] producer close error", error);
      }
    });

    peer.transports.forEach((transport) => {
      try {
        transport.close();
      } catch (error) {
        console.warn("[Mediasoup] transport close error", error);
      }
    });

    room.peers.delete(peer.socketId);
  }

  private closeRoomIfEmpty(room: MediaRoom): void {
    if (room.peers.size > 0) {
      return;
    }

    try {
      room.router.close();
    } catch (error) {
      console.warn("[Mediasoup] router close error", error);
    }

    this.mediaRooms.delete(room.conversationId);
  }

  private listExistingProducers(
    room: MediaRoom,
    excludingSocketId: string,
  ): Array<{ producerId: string; kind: string; userId: string }> {
    const results: Array<{ producerId: string; kind: string; userId: string }> =
      [];

    room.peers.forEach((peer, peerSocketId) => {
      if (peerSocketId === excludingSocketId) {
        return;
      }

      peer.producers.forEach((producer) => {
        results.push({
          producerId: producer.id,
          kind: producer.kind,
          userId: peer.userId,
        });
      });
    });

    return results;
  }

  private removeMediaPeerBySocketId(socketId: string): void {
    this.mediaRooms.forEach((room) => {
      const peer = room.peers.get(socketId);
      if (!peer) {
        return;
      }

      // If this was a 1-1 call room, notify the remaining peer that the call ended
      const isPrivateCall = room.peers.size === 2;
      if (isPrivateCall) {
        this.finalizeMediaConversationCall(room.conversationId, "peer-disconnected");
        this.io?.to(room.conversationId).emit("callEnded", {
          conversationId: room.conversationId,
          endedByUserId: peer.userId,
          reason: "disconnected",
        });
      }

      this.closeMediaPeer(room, peer);
      this.io?.to(room.conversationId).emit("mediaPeerLeft", {
        userId: peer.userId,
        socketId: peer.socketId,
        conversationId: room.conversationId,
      });
      this.closeRoomIfEmpty(room);
    });
  }

  public init(io: Server) {
    this.io = io;
    this.mediasoupReady = this.initMediasoupWorkers();

    this.io.on("connection", async (socket: Socket) => {
      const userId = this.normalizeUserId(
        socket.handshake.auth?.userId || socket.handshake.query?.userId,
      );

      if (userId) {
        this.onlineUsers.set(userId, socket.id);
        console.log(`User ${userId} joined with socket ${socket.id}`);

        // Tự động Join user vào tất cả các phòng (conversation) mà họ tham gia
        try {
          // Lấy trực tiếp từ Model Mongoose để tránh Circular Dependency với ChatService
          const conversations = await Conversation.find(
            { participants: userId },
            { _id: 1 },
          ).lean();

          conversations.forEach((conv) => {
            socket.join(conv._id.toString());
          });
          console.log(
            `User ${userId} joined ${conversations.length} conversation rooms.`,
          );
        } catch (error) {
          console.error("Error joining rooms on connect:", error);
        }
      } else {
        console.warn(`Socket connected without userId: ${socket.id}`);
      }

      socket.on("disconnect", () => {
        if (userId) {
          const activeCallId = this.activeCallByUser.get(userId);
          if (activeCallId) {
            this.endCallSession(
              activeCallId,
              userId,
              "peer-disconnected",
              false,
            );
          }

          this.onlineUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
        }

        this.removeMediaPeerBySocketId(socket.id);
      });

      // Cho phép client explicitly xin vào room mới khi được thêm vào nhóm (hoặc tạo hội thoại mới)
      socket.on("joinRoom", (conversationId: string) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined room ${conversationId}`);
      });

      // ✨ JOIN TEAM/CLASS ROOM for realtime updates (Posts, Comments, Files)
      socket.on("join_room", (data: { roomId: string }) => {
        const { roomId } = data;
        if (roomId) {
          socket.join(roomId);
          console.log(
            `[SocketManager] Socket ${socket.id} (userId: ${userId}) joined team room: ${roomId}`,
          );
        }
      });

      // ✨ LEAVE TEAM/CLASS ROOM
      socket.on("leave_room", (data: { roomId: string }) => {
        const { roomId } = data;
        if (roomId) {
          socket.leave(roomId);
          console.log(
            `[SocketManager] Socket ${socket.id} (userId: ${userId}) left team room: ${roomId}`,
          );
        }
      });

      socket.on(
        "joinMediaRoom",
        async (data: JoinMediaRoomPayload, ack?: MediaAck) => {
          if (!userId) {
            this.emitMediaError(
              socket,
              "UNAUTHORIZED",
              "Missing user identity.",
              ack,
            );
            return;
          }

          const conversationId = data?.conversationId?.trim();
          if (!conversationId) {
            this.emitMediaError(
              socket,
              "INVALID_PAYLOAD",
              "conversationId is required.",
              ack,
            );
            return;
          }

          try {
            await this.mediasoupReady;
            const room = await this.getOrCreateMediaRoom(conversationId);
            const peer = this.ensureMediaPeer(room, socket.id, userId);

            if (data?.rtpCapabilities) {
              peer.rtpCapabilities = data.rtpCapabilities;
            }

            socket.join(conversationId);

            if (room.peers.size === 2) {
              this.markMediaConversationConnected(conversationId);
            }

            const existingProducers = this.listExistingProducers(
              room,
              socket.id,
            );

            // Notify other peers in the room about the new user joining
            socket.to(conversationId).emit("mediaPeerJoined", {
              userId,
              socketId: socket.id,
              conversationId,
            });

            this.safeAck(ack, {
              ok: true,
              data: {
                rtpCapabilities: room.router.rtpCapabilities,
                existingProducers,
              },
            });
          } catch (error) {
            console.error("[Mediasoup] joinMediaRoom error:", error);
            this.emitMediaError(
              socket,
              "MEDIA_JOIN_FAILED",
              "Unable to join media room.",
              ack,
            );
          }
        },
      );

      socket.on(
        "getRtpCapabilities",
        async (conversationId: string, ack?: MediaAck) => {
          const roomId = conversationId?.trim();
          if (!roomId) {
            this.emitMediaError(
              socket,
              "INVALID_PAYLOAD",
              "conversationId is required.",
              ack,
            );
            return;
          }

          try {
            await this.mediasoupReady;
            const room = await this.getOrCreateMediaRoom(roomId);
            this.safeAck(ack, { ok: true, data: room.router.rtpCapabilities });
          } catch (error) {
            console.error("[Mediasoup] getRtpCapabilities error:", error);
            this.emitMediaError(
              socket,
              "MEDIA_RTP_FAILED",
              "Unable to get RTP capabilities.",
              ack,
            );
          }
        },
      );

      socket.on(
        "createWebRtcTransport",
        async (data: CreateWebRtcTransportPayload, ack?: MediaAck) => {
          if (!userId) {
            this.emitMediaError(
              socket,
              "UNAUTHORIZED",
              "Missing user identity.",
              ack,
            );
            return;
          }

          const conversationId = data?.conversationId?.trim();
          if (!conversationId || !data?.direction) {
            this.emitMediaError(
              socket,
              "INVALID_PAYLOAD",
              "conversationId and direction are required.",
              ack,
            );
            return;
          }

          try {
            await this.mediasoupReady;
            const room = await this.getOrCreateMediaRoom(conversationId);
            const peer = this.ensureMediaPeer(room, socket.id, userId);

            const transport = await room.router.createWebRtcTransport({
              listenIps: mediasoupConfig.webRtcTransport.listenIps,
              enableUdp: true,
              enableTcp: true,
              preferUdp: true,
              initialAvailableOutgoingBitrate:
                mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,
            });

            if (mediasoupConfig.webRtcTransport.maxIncomingBitrate) {
              try {
                await transport.setMaxIncomingBitrate(
                  mediasoupConfig.webRtcTransport.maxIncomingBitrate,
                );
              } catch (error) {
                console.warn("[Mediasoup] setMaxIncomingBitrate error", error);
              }
            }

            transport.appData = { direction: data.direction };
            peer.transports.set(transport.id, transport);

            transport.on("dtlsstatechange", (dtlsState: string) => {
              if (dtlsState === "closed") {
                transport.close();
              }
            });

            transport.on("@close", () => {
              peer.transports.delete(transport.id);
            });

            this.safeAck(ack, {
              ok: true,
              data: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
              },
            });
          } catch (error) {
            console.error("[Mediasoup] createWebRtcTransport error:", error);
            this.emitMediaError(
              socket,
              "MEDIA_TRANSPORT_FAILED",
              "Unable to create WebRTC transport.",
              ack,
            );
          }
        },
      );

      socket.on(
        "connectTransport",
        async (data: ConnectTransportPayload, ack?: MediaAck) => {
          const conversationId = data?.conversationId?.trim();
          if (!conversationId || !data?.transportId || !data?.dtlsParameters) {
            this.emitMediaError(
              socket,
              "INVALID_PAYLOAD",
              "conversationId, transportId and dtlsParameters are required.",
              ack,
            );
            return;
          }

          const room = this.mediaRooms.get(conversationId);
          if (!room) {
            this.emitMediaError(
              socket,
              "ROOM_NOT_FOUND",
              "Media room not found.",
              ack,
            );
            return;
          }

          const peer = this.getMediaPeer(room, socket.id);
          if (!peer) {
            this.emitMediaError(
              socket,
              "PEER_NOT_FOUND",
              "Media peer not found.",
              ack,
            );
            return;
          }

          const transport = peer.transports.get(data.transportId);
          if (!transport) {
            this.emitMediaError(
              socket,
              "TRANSPORT_NOT_FOUND",
              "Transport not found.",
              ack,
            );
            return;
          }

          try {
            await transport.connect({ dtlsParameters: data.dtlsParameters });
            this.safeAck(ack, { ok: true, data: { connected: true } });
          } catch (error) {
            console.error("[Mediasoup] connectTransport error:", error);
            this.emitMediaError(
              socket,
              "MEDIA_CONNECT_FAILED",
              "Unable to connect transport.",
              ack,
            );
          }
        },
      );

      socket.on("produce", async (data: ProducePayload, ack?: MediaAck) => {
        if (!userId) {
          this.emitMediaError(
            socket,
            "UNAUTHORIZED",
            "Missing user identity.",
            ack,
          );
          return;
        }

        const conversationId = data?.conversationId?.trim();
        if (
          !conversationId ||
          !data?.transportId ||
          !data?.kind ||
          !data?.rtpParameters
        ) {
          this.emitMediaError(
            socket,
            "INVALID_PAYLOAD",
            "conversationId, transportId, kind, and rtpParameters are required.",
            ack,
          );
          return;
        }

        const room = this.mediaRooms.get(conversationId);
        if (!room) {
          this.emitMediaError(
            socket,
            "ROOM_NOT_FOUND",
            "Media room not found.",
            ack,
          );
          return;
        }

        const peer = this.getMediaPeer(room, socket.id);
        if (!peer) {
          this.emitMediaError(
            socket,
            "PEER_NOT_FOUND",
            "Media peer not found.",
            ack,
          );
          return;
        }

        const transport = peer.transports.get(data.transportId);
        if (!transport) {
          this.emitMediaError(
            socket,
            "TRANSPORT_NOT_FOUND",
            "Transport not found.",
            ack,
          );
          return;
        }

        try {
          const producer = await transport.produce({
            kind: data.kind,
            rtpParameters: data.rtpParameters,
            appData: {
              ...data.appData,
              userId,
            },
          });

          peer.producers.set(producer.id, producer);

          producer.on("transportclose", () => {
            peer.producers.delete(producer.id);
          });

          producer.on("@close", () => {
            peer.producers.delete(producer.id);
          });

          socket.to(conversationId).emit("newProducer", {
            producerId: producer.id,
            kind: producer.kind,
            userId,
          });

          this.safeAck(ack, { ok: true, data: { producerId: producer.id } });
        } catch (error) {
          console.error("[Mediasoup] produce error:", error);
          this.emitMediaError(
            socket,
            "MEDIA_PRODUCE_FAILED",
            "Unable to produce. Check your browser's media permissions.",
            ack,
          );
        }
      });

      socket.on("consume", async (data: ConsumePayload, ack?: MediaAck) => {
        const conversationId = data?.conversationId?.trim();
        if (!conversationId || !data?.transportId || !data?.producerId) {
          this.emitMediaError(
            socket,
            "INVALID_PAYLOAD",
            "conversationId, transportId, and producerId are required.",
            ack,
          );
          return;
        }

        const room = this.mediaRooms.get(conversationId);
        if (!room) {
          this.emitMediaError(
            socket,
            "ROOM_NOT_FOUND",
            "Media room not found.",
            ack,
          );
          return;
        }

        const peer = this.getMediaPeer(room, socket.id);
        if (!peer) {
          this.emitMediaError(
            socket,
            "PEER_NOT_FOUND",
            "Media peer not found.",
            ack,
          );
          return;
        }

        const transport = peer.transports.get(data.transportId);
        if (!transport) {
          this.emitMediaError(
            socket,
            "TRANSPORT_NOT_FOUND",
            "Transport not found.",
            ack,
          );
          return;
        }

        const rtpCapabilities = data.rtpCapabilities || peer.rtpCapabilities;
        if (!rtpCapabilities) {
          this.emitMediaError(
            socket,
            "MISSING_CAPABILITIES",
            "rtpCapabilities are required for consume.",
            ack,
          );
          return;
        }

        try {
          const canConsumeResult = room.router.canConsume({
            producerId: data.producerId,
            rtpCapabilities,
          });
          if (!canConsumeResult) {
            console.warn(
              "[Mediasoup] canConsume failed for producer",
              data.producerId,
              "with peer rtpCapabilities:",
              JSON.stringify(rtpCapabilities, null, 2),
            );
            this.emitMediaError(
              socket,
              "CANNOT_CONSUME",
              "Router cannot consume this producer. Producer may not exist or codecs are incompatible.",
              ack,
            );
            return;
          }
        } catch (checkError) {
          console.error("[Mediasoup] canConsume check error:", checkError);
          this.emitMediaError(
            socket,
            "CANNOT_CONSUME",
            "Unable to verify consumer capability.",
            ack,
          );
          return;
        }

        try {
          const consumer = await transport.consume({
            producerId: data.producerId,
            rtpCapabilities,
            paused: true,
          });

          peer.consumers.set(consumer.id, consumer);

          consumer.on("transportclose", () => {
            peer.consumers.delete(consumer.id);
          });

          consumer.on("producerclose", () => {
            peer.consumers.delete(consumer.id);
            socket.emit("producerClosed", {
              producerId: data.producerId,
            });
          });

          this.safeAck(ack, {
            ok: true,
            data: {
              id: consumer.id,
              producerId: data.producerId,
              kind: consumer.kind,
              rtpParameters: consumer.rtpParameters,
            },
          });
        } catch (error) {
          console.error("[Mediasoup] consume error - details:", {
            error: (error as Error).message,
            producerId: data.producerId,
            conversationId,
            rtpCapabilitiesProvided: !!data.rtpCapabilities,
            peerRtpCapabilitiesSet: !!peer.rtpCapabilities,
          });
          this.emitMediaError(
            socket,
            "MEDIA_CONSUME_FAILED",
            "Unable to consume. The producer may have been closed or codecs don't match.",
            ack,
          );
        }
      });

      socket.on(
        "resume",
        async (data: ResumeConsumerPayload, ack?: MediaAck) => {
          const conversationId = data?.conversationId?.trim();
          if (!conversationId || !data?.consumerId) {
            this.emitMediaError(
              socket,
              "INVALID_PAYLOAD",
              "conversationId and consumerId are required.",
              ack,
            );
            return;
          }

          const room = this.mediaRooms.get(conversationId);
          if (!room) {
            this.emitMediaError(
              socket,
              "ROOM_NOT_FOUND",
              "Media room not found.",
              ack,
            );
            return;
          }

          const peer = this.getMediaPeer(room, socket.id);
          if (!peer) {
            this.emitMediaError(
              socket,
              "PEER_NOT_FOUND",
              "Media peer not found.",
              ack,
            );
            return;
          }

          const consumer = peer.consumers.get(data.consumerId);
          if (!consumer) {
            this.emitMediaError(
              socket,
              "CONSUMER_NOT_FOUND",
              "Consumer not found.",
              ack,
            );
            return;
          }

          try {
            await consumer.resume();
            this.safeAck(ack, { ok: true, data: { resumed: true } });
          } catch (error) {
            console.error("[Mediasoup] resume error:", error);
            this.emitMediaError(
              socket,
              "MEDIA_RESUME_FAILED",
              "Unable to resume.",
              ack,
            );
          }
        },
      );

      socket.on(
        "closeProducer",
        (
          data: { conversationId: string; producerId: string },
          ack?: MediaAck,
        ) => {
          const conversationId = data?.conversationId?.trim();
          if (!conversationId || !data?.producerId) {
            this.emitMediaError(
              socket,
              "INVALID_PAYLOAD",
              "conversationId and producerId are required.",
              ack,
            );
            return;
          }

          const room = this.mediaRooms.get(conversationId);
          if (!room) return;

          const peer = this.getMediaPeer(room, socket.id);
          if (!peer) return;

          const producer = peer.producers.get(data.producerId);
          if (producer) {
            try {
              producer.close();
            } catch (error) {
              console.warn("[Mediasoup] close producer error:", error);
            }
            peer.producers.delete(data.producerId);

            socket.to(conversationId).emit("producerClosed", {
              producerId: data.producerId,
            });
          }

          this.safeAck(ack, { ok: true, data: { closed: true } });
        },
      );

      socket.on("leaveMediaRoom", (conversationId: string) => {
        const roomId = conversationId?.trim();
        if (!roomId) {
          return;
        }

        const room = this.mediaRooms.get(roomId);
        if (!room) {
          return;
        }

        const peer = room.peers.get(socket.id);
        if (!peer) {
          return;
        }

        // If this is a 1-1 room (2 peers), notify the remaining peer that the call ended
        const isPrivateCall = room.peers.size === 2;
        if (isPrivateCall) {
          this.finalizeMediaConversationCall(roomId, "ended");
          socket.to(roomId).emit("callEnded", {
            conversationId: roomId,
            endedByUserId: peer.userId,
            reason: "left",
          });
        }

        this.closeMediaPeer(room, peer);
        this.io?.to(roomId).emit("mediaPeerLeft", {
          userId: peer.userId,
          socketId: peer.socketId,
          conversationId: roomId,
        });
        this.closeRoomIfEmpty(room);
      });

      // For group calls: broadcast incoming call event when joining media room
      socket.on(
        "startGroupMediaCall",
        async (data: { conversationId: string; callType?: MediaCallKind }) => {
          if (!userId) {
            socket.emit("videoCallError", {
              code: "UNAUTHORIZED",
              message: "Missing user identity for starting group call.",
            });
            return;
          }

          const conversationId = data?.conversationId?.trim();
          if (!conversationId) {
            socket.emit("videoCallError", {
              code: "INVALID_PAYLOAD",
              message: "conversationId is required.",
            });
            return;
          }

          try {
            const room = this.mediaRooms.get(conversationId);
            if (!room) {
              socket.emit("videoCallError", {
                code: "ROOM_NOT_FOUND",
                message: "Media room not found.",
              });
              return;
            }

            const callType: MediaCallKind = data?.callType === "audio" ? "audio" : "video";
            await this.startMediaConversationCall(conversationId, userId, callType);

            // Broadcast group call started to all peers in the room
            socket.to(conversationId).emit("incomingGroupMediaCall", {
              conversationId,
              initiatorUserId: userId,
              initiatedAt: new Date().toISOString(),
              callType,
            });

            socket.emit("groupMediaCallStarted", {
              conversationId,
            });
          } catch (error) {
            console.error("[Mediasoup] startGroupMediaCall error:", error);
            socket.emit("videoCallError", {
              code: "GROUP_CALL_FAILED",
              message: "Unable to start group media call.",
            });
          }
        },
      );

      // Signaling: Caller bắt đầu gọi cho Callee trong private conversation hiện tại
      socket.on("startVideoCall", async (data: StartVideoCallPayload) => {
        if (!userId) {
          socket.emit("videoCallError", {
            code: "UNAUTHORIZED",
            message: "Missing user identity for starting video call.",
          });
          return;
        }

        const conversationId = data?.conversationId?.trim();
        const calleeUserId = data?.calleeUserId?.trim();

        if (!conversationId || !calleeUserId) {
          socket.emit("videoCallError", {
            code: "INVALID_PAYLOAD",
            message: "conversationId and calleeUserId are required.",
          });
          return;
        }

        if (calleeUserId === userId) {
          socket.emit("videoCallError", {
            code: "INVALID_TARGET",
            message: "Cannot start a video call with yourself.",
          });
          return;
        }

        if (this.activeCallByUser.has(userId)) {
          socket.emit("videoCallError", {
            code: "CALL_BUSY",
            message: "You already have an active call.",
          });
          return;
        }

        if (this.activeCallByUser.has(calleeUserId)) {
          socket.emit("videoCallUnavailable", {
            toUserId: calleeUserId,
            reason: "callee-busy",
          });
          return;
        }

        try {
          const canCall = await this.canStartPrivateCall(
            conversationId,
            userId,
            calleeUserId,
          );

          if (!canCall) {
            socket.emit("videoCallError", {
              code: "CALL_NOT_ALLOWED",
              message:
                "Video call is only allowed between users in the same private conversation.",
            });
            return;
          }

          const callId = randomUUID();
          const session: CallSession = {
            callId,
            conversationId,
            callerId: userId,
            calleeId: calleeUserId,
            status: "ringing",
            createdAt: Date.now(),
          };

          this.callSessions.set(callId, session);
          this.activeCallByUser.set(userId, callId);
          this.activeCallByUser.set(calleeUserId, callId);
          void this.createCallLog(session);

          const incomingPayload = {
            callId,
            conversationId,
            fromUserId: userId,
            toUserId: calleeUserId,
            initiatedAt: new Date(session.createdAt).toISOString(),
          };

          const emitted = this.emitToUser(
            calleeUserId,
            "incomingVideoCall",
            incomingPayload,
          );

          if (!emitted) {
            this.clearCallSession(callId);
            socket.emit("videoCallUnavailable", {
              callId,
              toUserId: calleeUserId,
              reason: "callee-offline",
            });
            return;
          }

          socket.emit("videoCallRinging", {
            callId,
            conversationId,
            fromUserId: userId,
            toUserId: calleeUserId,
          });
        } catch (error) {
          console.error("Error handling startVideoCall:", error);
          socket.emit("videoCallError", {
            code: "CALL_START_FAILED",
            message: "Unable to start video call right now.",
          });
        }
      });

      // Legacy direct WebRTC signaling handlers removed; mediasoup-only flow used.

      // Signaling: End call từ một trong hai peer
      socket.on("endVideoCall", (data: EndVideoCallPayload) => {
        if (!userId) {
          return;
        }

        const callId = data?.callId?.trim();
        if (!callId) {
          socket.emit("videoCallError", {
            code: "INVALID_PAYLOAD",
            message: "callId is required.",
          });
          return;
        }

        const session = this.callSessions.get(callId);
        if (!session) {
          socket.emit("videoCallError", {
            code: "CALL_NOT_FOUND",
            message: "Video call session not found.",
            callId,
          });
          return;
        }

        if (!this.isSessionParticipant(session, userId)) {
          socket.emit("videoCallError", {
            code: "CALL_FORBIDDEN",
            message: "You are not a participant of this call.",
            callId,
          });
          return;
        }

        this.endCallSession(callId, userId, data.reason || "ended");
      });

      // Handle message reactions
      socket.on(
        "reactMessage",
        async (data: {
          messageId: string;
          conversationId: string;
          emoji: string;
        }) => {
          try {
            const { messageId, conversationId, emoji } = data;

            if (!messageId || !conversationId || !emoji || !userId) {
              console.warn("Invalid reaction data:", data);
              return;
            }

            if (!mongoose.Types.ObjectId.isValid(userId)) {
              console.warn("Invalid userId for reaction:", userId);
              return;
            }

            // Update message with reaction
            const message = await Message.findById(messageId);
            if (!message) {
              console.warn("Message not found:", messageId);
              return;
            }

            // Check if user already reacted with this emoji
            const existingReactionIndex = message.reactions.findIndex(
              (r: any) =>
                r.userId.toString() === userId.toString() && r.emoji === emoji,
            );

            if (existingReactionIndex !== -1) {
              // Remove reaction if it already exists
              message.reactions.splice(existingReactionIndex, 1);
            } else {
              // Add new reaction
              message.reactions.push({
                userId: new mongoose.Types.ObjectId(userId),
                emoji,
              });
            }

            await message.save();

            // Emit updated message to all clients in the room
            this.io?.to(conversationId).emit("messageReacted", {
              messageId,
              reactions: message.reactions,
            });
          } catch (error) {
            console.error("Error handling reaction:", error);
          }
        },
      );

      // Handle message revocation
      socket.on(
        "revokeMessage",
        async (data: { messageId: string; conversationId: string }) => {
          try {
            const { messageId, conversationId } = data;

            if (!messageId || !conversationId || !userId) {
              console.warn("Invalid revoke data:", data);
              return;
            }

            // Update message as revoked
            const message = await Message.findByIdAndUpdate(
              messageId,
              { isRevoked: true },
              { new: true },
            );

            if (!message) {
              console.warn("Message not found:", messageId);
              return;
            }

            // Emit revocation event to all clients in the room
            this.io?.to(conversationId).emit("messageRevoked", {
              messageId,
              isRevoked: true,
            });
          } catch (error) {
            console.error("Error handling message revocation:", error);
          }
        },
      );

      // ── Xử lý typing indicator ──────────────────────────────────────────
      socket.on("userTyping", (data: { conversationId: string }) => {
        if (!userId || !data.conversationId) return;
        // Broadcast tới tất cả trong room EXCEPT chính socket này
        socket.broadcast.to(data.conversationId).emit("userTyping", {
          userId,
          conversationId: data.conversationId,
          timestamp: Date.now(),
        });
      });

      socket.on("userStoppedTyping", (data: { conversationId: string }) => {
        if (!userId || !data.conversationId) return;
        // Broadcast tới tất cả trong room EXCEPT chính socket này
        socket.broadcast.to(data.conversationId).emit("userStoppedTyping", {
          userId,
          conversationId: data.conversationId,
        });
      });
    });
  }

  // Cập nhật hàm emit: giờ ta emit vào Room thay vì trỏ từng người
  // Bằng cách này gửi tin nhắn dù private (2 ng) hay group (100 ng) đều cực kỳ nhanh và chỉ 1 lệnh
  public emitMessageToRoom(conversationId: string, message: any) {
    if (this.io) {
      this.io.to(conversationId).emit("newMessage", message);
    }
  }

  // ✨ BROADCAST TO ROOM - Phát sự kiện realtime tới toàn bộ clients trong room (classId)
  public broadcastToRoom(
    classId: string,
    eventName: string,
    payload: any,
  ): void {
    if (!this.io) {
      console.error("[SocketManager] broadcastToRoom: io not initialized");
      return;
    }

    // Broadcast tới tất cả clients trong room với tên là classId
    this.io.to(classId).emit(eventName, payload);
    console.log(
      `[SocketManager] ✓ Broadcasted event '${eventName}' to room '${classId}'`,
    );
  }

  // 👇 CHỈ CẦN DÁN THÊM HÀM NÀY VÀO TRƯỚC DẤU NGOẶC ĐÓNG CỦA CLASS 👇
  public emitToUserTarget(
    userId: string,
    eventName: string,
    payload: any,
  ): void {
    this.emitToUser(userId, eventName, payload);
  }
}

export default new SocketManager();
