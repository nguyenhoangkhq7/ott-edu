import mongoose from "mongoose";
import Conversation from "../model/Conversation.ts";
import Message from "../model/Message.ts";
import User from "../model/User.ts";

export interface MediaItem {
  url: string;
  fileName: string;
  messageId: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

export interface FileItem {
  url: string;
  fileName: string;
  fileType: string;
  sizeBytes: number; // Approximation based on URL length
  messageId: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

export interface LinkItem {
  url: string;
  title?: string;
  messageId: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

export interface ConversationInfoDTO {
  conversationId: string;
  name: string;
  avatarUrl: string;
  type: "private" | "class";
  ownerId: string | null;
  deputyId: string | null;
  participants: Array<{
    _id: string;
    fullName: string;
    avatarUrl: string;
    email: string;
  }>;
  totalMembers: number;
}

export class ConversationInfoService {
  /**
   * Lấy thông tin cơ bản của conversation (tên, avatar, danh sách thành viên)
   */
  static async getConversationInfo(
    conversationId: string
  ): Promise<ConversationInfoDTO> {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error("Invalid conversation ID");
      }

      const conversation = await Conversation.findById(conversationId)
        .populate("participants", "fullName avatarUrl email")
        .lean();

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      return {
        conversationId: conversation._id.toString(),
        name:
          conversation.name ||
          (conversation.participants as any[])
            .map((p: any) => p.fullName)
            .join(", "),
        avatarUrl: conversation.avatarUrl || "",
        type: conversation.type,
        ownerId: conversation.ownerId ? conversation.ownerId.toString() : null,
        deputyId: conversation.deputyId ? conversation.deputyId.toString() : null,
        participants: (conversation.participants as any[]).map((p: any) => ({
          _id: p._id.toString(),
          fullName: p.fullName,
          avatarUrl: p.avatarUrl,
          email: p.email,
        })),
        totalMembers: conversation.participants.length,
      };
    } catch (error: any) {
      console.error("[ConversationInfoService] getConversationInfo error:", error);
      throw new Error(`Failed to get conversation info: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách Media (Images & Videos) từ một conversation
   * Sử dụng MongoDB Aggregation để filter messages có attachments là image/video
   */
  static async getMediaItems(
    conversationId: string,
    limit: number = 50
  ): Promise<MediaItem[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error("Invalid conversation ID");
      }

      const mediaMessages = await Message.aggregate([
        {
          $match: {
            conversationId: new mongoose.Types.ObjectId(conversationId),
            isRevoked: false,
            attachments: { $exists: true, $ne: [] },
          },
        },
        {
          $unwind: "$attachments",
        },
        {
          $match: {
            "attachments.fileType": {
              $regex: "^(image|video)/",
              $options: "i",
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "senderId",
            foreignField: "_id",
            as: "sender",
          },
        },
        {
          $unwind: "$sender",
        },
        {
          $project: {
            url: "$attachments.url",
            fileName: "$attachments.fileName",
            fileType: "$attachments.fileType",
            messageId: "$_id",
            senderId: "$senderId",
            senderName: "$sender.fullName",
            timestamp: "$createdAt",
          },
        },
        {
          $sort: { timestamp: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      return mediaMessages;
    } catch (error: any) {
      console.error("[ConversationInfoService] getMediaItems error:", error);
      throw new Error(`Failed to get media items: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách Files từ một conversation
   * Filter attachments không phải image/video
   */
  static async getFileItems(
    conversationId: string,
    limit: number = 50
  ): Promise<FileItem[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error("Invalid conversation ID");
      }

      const fileMessages = await Message.aggregate([
        {
          $match: {
            conversationId: new mongoose.Types.ObjectId(conversationId),
            isRevoked: false,
            attachments: { $exists: true, $ne: [] },
          },
        },
        {
          $unwind: "$attachments",
        },
        {
          $match: {
            "attachments.fileType": {
              $not: { $regex: "^(image|video)/", $options: "i" },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "senderId",
            foreignField: "_id",
            as: "sender",
          },
        },
        {
          $unwind: "$sender",
        },
        {
          $project: {
            url: "$attachments.url",
            fileName: "$attachments.fileName",
            fileType: "$attachments.fileType",
            sizeBytes: {
              $cond: [
                { $isNumber: "$attachments.sizeBytes" },
                "$attachments.sizeBytes",
                { $multiply: [{ $strLenCP: "$attachments.url" }, 10] }, // Rough estimate
              ],
            },
            messageId: "$_id",
            senderId: "$senderId",
            senderName: "$sender.fullName",
            timestamp: "$createdAt",
          },
        },
        {
          $sort: { timestamp: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      return fileMessages;
    } catch (error: any) {
      console.error("[ConversationInfoService] getFileItems error:", error);
      throw new Error(`Failed to get file items: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách Links từ messages của conversation
   * Parse content để tìm các URL
   */
  static async getLinkItems(
    conversationId: string,
    limit: number = 50
  ): Promise<LinkItem[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error("Invalid conversation ID");
      }

      // Regex để tìm URL
      const urlRegex =
        /(https?:\/\/[^\s]+)/gi;

      const messagesWithLinks = await Message.aggregate([
        {
          $match: {
            conversationId: new mongoose.Types.ObjectId(conversationId),
            isRevoked: false,
            content: { $regex: "http", $options: "i" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "senderId",
            foreignField: "_id",
            as: "sender",
          },
        },
        {
          $unwind: "$sender",
        },
        {
          $project: {
            messageId: "$_id",
            content: "$content",
            senderId: "$senderId",
            senderName: "$sender.fullName",
            timestamp: "$createdAt",
          },
        },
        {
          $sort: { timestamp: -1 },
        },
      ]);

      // Parse từng message để extract URLs
      const links: LinkItem[] = [];
      for (const msg of messagesWithLinks) {
        const urlMatches = msg.content.match(urlRegex) || [];
        for (const url of urlMatches) {
          if (links.length < limit) {
            links.push({
              url,
              title: this.extractDomain(url),
              messageId: msg.messageId.toString(),
              senderId: msg.senderId.toString(),
              senderName: msg.senderName,
              timestamp: msg.timestamp,
            });
          }
        }
      }

      return links.slice(0, limit);
    } catch (error: any) {
      console.error("[ConversationInfoService] getLinkItems error:", error);
      throw new Error(`Failed to get link items: ${error.message}`);
    }
  }

  /**
   * Helper: Extract domain từ URL
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname || url;
    } catch {
      return url;
    }
  }

  /**
   * Kiểm tra xem user có phải là member của conversation không
   */
  static async isUserMemberOfConversation(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(conversationId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return false;
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: new mongoose.Types.ObjectId(userId),
      }).lean();

      return !!conversation;
    } catch (error: any) {
      console.error(
        "[ConversationInfoService] isUserMemberOfConversation error:",
        error
      );
      return false;
    }
  }
}
