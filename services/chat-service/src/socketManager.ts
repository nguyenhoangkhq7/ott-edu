import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { Server, Socket } from "socket.io";
import Conversation from "./model/Conversation.ts";
import Message from "./model/Message.ts";

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
};

class SocketManager {
  private io: Server | null = null;
  private onlineUsers = new Map<string, string>();
  private callSessions = new Map<string, CallSession>();
  private activeCallByUser = new Map<string, string>();

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

  private emitToUser(userId: string, eventName: string, payload: unknown): boolean {
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

  private clearCallSession(callId: string): void {
    const session = this.callSessions.get(callId);
    if (!session) {
      return;
    }

    this.callSessions.delete(callId);
    this.activeCallByUser.delete(session.callerId);
    this.activeCallByUser.delete(session.calleeId);
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

    const participantIds = (conversation.participants || []).map((participant) =>
      participant.toString(),
    );

    return (
      participantIds.length === 2 &&
      participantIds.includes(callerId) &&
      participantIds.includes(calleeId)
    );
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
  ): void {
    const { callId, toUserId, dataKey, dataValue } = payload;
    const session = this.callSessions.get(callId);

    if (!session) {
      socket.emit("videoCallError", {
        code: "CALL_NOT_FOUND",
        message: "Video call session not found.",
        callId,
      });
      return;
    }

    if (!this.isSessionParticipant(session, fromUserId)) {
      socket.emit("videoCallError", {
        code: "CALL_FORBIDDEN",
        message: "You are not a participant of this call.",
        callId,
      });
      return;
    }

    const peerUserId = this.getPeerId(session, fromUserId);
    if (!peerUserId) {
      socket.emit("videoCallError", {
        code: "PEER_NOT_FOUND",
        message: "Peer user is unavailable for this call.",
        callId,
      });
      return;
    }

    if (toUserId && toUserId !== peerUserId) {
      socket.emit("videoCallError", {
        code: "INVALID_TARGET",
        message: "Signal target does not match current call session.",
        callId,
      });
      return;
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
    }
  }

  public init(io: Server) {
    this.io = io;

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
            this.endCallSession(activeCallId, userId, "peer-disconnected", false);
          }

          this.onlineUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
        }
      });

      // Cho phép client explicitly xin vào room mới khi được thêm vào nhóm (hoặc tạo hội thoại mới)
      socket.on("joinRoom", (conversationId: string) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined room ${conversationId}`);
      });

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

      // Signaling relay: SDP Offer
      socket.on("webrtcOffer", (data: WebRtcOfferPayload) => {
        if (!userId) {
          return;
        }

        const callId = data?.callId?.trim();
        if (!callId || !data?.offer) {
          socket.emit("videoCallError", {
            code: "INVALID_PAYLOAD",
            message: "callId and offer are required.",
          });
          return;
        }

        this.relayWebRtcPayload(socket, userId, "webrtcOffer", {
          callId,
          ...(data?.toUserId ? { toUserId: data.toUserId } : {}),
          dataKey: "offer",
          dataValue: data.offer,
        });
      });

      // Signaling relay: SDP Answer
      socket.on("webrtcAnswer", (data: WebRtcAnswerPayload) => {
        if (!userId) {
          return;
        }

        const callId = data?.callId?.trim();
        if (!callId || !data?.answer) {
          socket.emit("videoCallError", {
            code: "INVALID_PAYLOAD",
            message: "callId and answer are required.",
          });
          return;
        }

        const session = this.callSessions.get(callId);
        if (session) {
          session.status = "connected";
        }

        this.relayWebRtcPayload(socket, userId, "webrtcAnswer", {
          callId,
          ...(data?.toUserId ? { toUserId: data.toUserId } : {}),
          dataKey: "answer",
          dataValue: data.answer,
        });

        if (session && this.isSessionParticipant(session, userId)) {
          const peerUserId = this.getPeerId(session, userId);
          socket.emit("videoCallConnected", {
            callId,
            conversationId: session.conversationId,
          });

          if (peerUserId) {
            this.emitToUser(peerUserId, "videoCallConnected", {
              callId,
              conversationId: session.conversationId,
            });
          }
        }
      });

      // Signaling relay: ICE Candidate
      socket.on("webrtcIceCandidate", (data: WebRtcIceCandidatePayload) => {
        if (!userId) {
          return;
        }

        const callId = data?.callId?.trim();
        if (!callId || !data?.candidate) {
          socket.emit("videoCallError", {
            code: "INVALID_PAYLOAD",
            message: "callId and candidate are required.",
          });
          return;
        }

        this.relayWebRtcPayload(socket, userId, "webrtcIceCandidate", {
          callId,
          ...(data?.toUserId ? { toUserId: data.toUserId } : {}),
          dataKey: "candidate",
          dataValue: data.candidate,
        });
      });

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
    });
  }

  // Cập nhật hàm emit: giờ ta emit vào Room thay vì trỏ từng người
  // Bằng cách này gửi tin nhắn dù private (2 ng) hay group (100 ng) đều cực kỳ nhanh và chỉ 1 lệnh
  public emitMessageToRoom(conversationId: string, message: any) {
    if (this.io) {
      this.io.to(conversationId).emit("newMessage", message);
    }
  }
}

export default new SocketManager();
