import mongoose from "mongoose";
import User from "../../model/User.ts";
import Conversation from "../../model/Conversation.ts";
import FriendRequest from "../../model/FriendRequest.ts";
import socketManager from "../../socketManager.ts";
import { ChatService } from "../chat.service.ts";

jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
    },
    Types: {
      ...actualMongoose.Types,
      ObjectId: actualMongoose.Types.ObjectId,
    },
  };
});

jest.mock("../../model/User.ts", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock("../../model/Conversation.ts", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  },
}));

jest.mock("../../model/FriendRequest.ts", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

jest.mock("../../socketManager.ts", () => ({
  __esModule: true,
  default: {
    isUserOnline: jest.fn(),
    emitToUserTarget: jest.fn(),
    broadcastToRoom: jest.fn(),
    emitMessageToRoom: jest.fn(),
  },
}));

jest.mock("../link-preview.service.ts", () => ({
  LinkPreviewService: {
    processMessageForLinkPreview: jest.fn(),
  },
}));

// Helper to mock chainable mongoose queries
const mockQuery = (val: any) => {
  const q: any = {
    select: jest.fn().mockImplementation(() => q),
    limit: jest.fn().mockImplementation(() => q),
    lean: jest.fn().mockImplementation(() => Promise.resolve(val)),
    exec: jest.fn().mockImplementation(() => Promise.resolve(val)),
    then: jest.fn().mockImplementation((resolve: any) => resolve(val)),
  };
  return q;
};

describe("ChatService - Selected Methods Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // ==========================================
  // 1. searchUsers
  // ==========================================
  describe("searchUsers", () => {
    it("should return users from core service successfully (Happy Path)", async () => {
      const currentUserId = new mongoose.Types.ObjectId().toString();
      const friendId = new mongoose.Types.ObjectId().toString();
      const pendingRequestId = new mongoose.Types.ObjectId().toString();

      // Mock User.findById to return current user with friends list
      (User.findById as any).mockReturnValue(mockQuery({ friends: [friendId] }));

      // Mock FriendRequest.find to return a pending request
      (FriendRequest.find as any).mockReturnValue(mockQuery([
        { requesterId: currentUserId, recipientId: pendingRequestId }
      ]));

      // Mock User.findOne to return null for first lookup (force sync)
      (User.findOne as any).mockResolvedValue(null);

      // Mock User.create to return new synced user
      const syncedMongoId = new mongoose.Types.ObjectId();
      (User.create as any).mockResolvedValue({
        _id: syncedMongoId,
        email: "sync@example.com",
        fullName: "Synced User",
      });

      // Mock fetch
      const mockFetchResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([
          {
            id: 123,
            email: "sync@example.com",
            fullName: "Synced User",
            avatarUrl: "http://avatar.com",
            code: "123",
          }
        ]),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

      const result = await ChatService.searchUsers("sync", currentUserId, "token");

      console.log("✅ [searchUsers_Success] - Expected Length: 1 | Actual Length: " + result.length);
      expect(result.length).toBe(1);

      console.log("✅ [searchUsers_Success] - Expected ID: " + syncedMongoId.toString() + " | Actual ID: " + result[0].id);
      expect(result[0].id).toBe(syncedMongoId.toString());

      console.log("✅ [searchUsers_Success] - Expected friendStatus: none | Actual friendStatus: " + result[0].friendStatus);
      expect(result[0].friendStatus).toBe("none");
    });

    it("should fallback to MongoDB when core service fetch fails (Sad Path)", async () => {
      const currentUserId = new mongoose.Types.ObjectId().toString();

      // Mock User.findById and FriendRequest.find
      (User.findById as any).mockReturnValue(mockQuery({ friends: [] }));
      (FriendRequest.find as any).mockReturnValue(mockQuery([]));

      // Mock fetch to throw network error
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network Failure"));

      // Mock fallback User.find
      const fallbackUserId = new mongoose.Types.ObjectId();
      (User.find as any).mockReturnValue(mockQuery([
        {
          _id: fallbackUserId,
          fullName: "Fallback User",
          email: "fallback@example.com",
          code: "fallback",
        }
      ]));

      const result = await ChatService.searchUsers("fallback", currentUserId);

      console.log("✅ [searchUsers_Failure] - Expected Fallback Length: 1 | Actual Fallback Length: " + result.length);
      expect(result.length).toBe(1);

      console.log("✅ [searchUsers_Failure] - Expected Name: Fallback User | Actual Name: " + result[0].fullName);
      expect(result[0].fullName).toBe("Fallback User");

      console.log("✅ [searchUsers_Failure] - Expected ID: " + fallbackUserId.toString() + " | Actual ID: " + result[0].id);
      expect(result[0].id).toBe(fallbackUserId.toString());
    });
  });

  // ==========================================
  // 2. sendFriendRequest
  // ==========================================
  describe("sendFriendRequest", () => {
    it("should successfully send a new friend request (Happy Path)", async () => {
      const requesterId = new mongoose.Types.ObjectId().toString();
      const targetUserId = new mongoose.Types.ObjectId();
      const mockTargetUser = {
        _id: targetUserId,
        email: "target@example.com",
        fullName: "Target User",
      };

      // Mock syncAndResolveUser behavior: User.findOne returns mockTargetUser
      (User.findOne as any).mockResolvedValue(mockTargetUser);

      // Mock User.findById for requester (check friends)
      (User.findById as any).mockReturnValue(mockQuery({
        _id: requesterId,
        friends: []
      }));

      // Mock FriendRequest.findOne (check existing request)
      (FriendRequest.findOne as any).mockResolvedValue(null);

      // Mock FriendRequest.create
      const newRequestId = new mongoose.Types.ObjectId();
      (FriendRequest.create as any).mockResolvedValue({
        _id: newRequestId,
        requesterId,
        recipientId: targetUserId.toString(),
        status: "pending",
      });

      const result = await ChatService.sendFriendRequest(requesterId, undefined, targetUserId.toString(), "token");

      console.log("✅ [sendFriendRequest_Success] - Expected Status: pending | Actual Status: " + result.status);
      expect(result.status).toBe("pending");

      console.log("✅ [sendFriendRequest_Success] - Expected Request ID: " + newRequestId.toString() + " | Actual Request ID: " + result._id.toString());
      expect(result._id.toString()).toBe(newRequestId.toString());

      console.log("✅ [sendFriendRequest_Success] - Expected socketManager emitToUserTarget to be called 2 times");
      expect(socketManager.emitToUserTarget).toHaveBeenCalledTimes(2);
    });

    it("should throw error if already friends (Sad Path)", async () => {
      const requesterId = new mongoose.Types.ObjectId().toString();
      const targetUserId = new mongoose.Types.ObjectId();
      const mockTargetUser = {
        _id: targetUserId,
        email: "target@example.com",
        fullName: "Target User",
      };

      // Mock syncAndResolveUser behavior
      (User.findOne as any).mockResolvedValue(mockTargetUser);

      // Mock User.findById for requester (already friends)
      (User.findById as any).mockReturnValue(mockQuery({
        _id: requesterId,
        friends: [targetUserId.toString()]
      }));

      let errorThrown: any = null;
      try {
        await ChatService.sendFriendRequest(requesterId, undefined, targetUserId.toString());
      } catch (err) {
        errorThrown = err;
      }

      console.log("✅ [sendFriendRequest_Failure] - Expected Error Message: Hai người đã là bạn bè rồi! | Actual Error Message: " + (errorThrown ? errorThrown.message : "None"));
      expect(errorThrown).toBeDefined();
      expect(errorThrown.message).toBe("Hai người đã là bạn bè rồi!");
    });
  });

  // ==========================================
  // 3. acceptFriendRequest
  // ==========================================
  describe("acceptFriendRequest", () => {
    it("should accept friend request and create a private conversation (Happy Path)", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const requesterId = new mongoose.Types.ObjectId().toString();
      const mockRequest = {
        requesterId,
        recipientId: userId,
        status: "accepted"
      };

      // Mock FriendRequest.findOneAndUpdate to return the request
      (FriendRequest.findOneAndUpdate as any).mockResolvedValue(mockRequest);

      // Mock User.findByIdAndUpdate
      (User.findByIdAndUpdate as any).mockResolvedValue({});

      // Mock Conversation.findOne (no existing private conversation)
      (Conversation.findOne as any).mockResolvedValue(null);

      // Mock Conversation.create
      const newConvId = new mongoose.Types.ObjectId();
      (Conversation.create as any).mockResolvedValue({
        _id: newConvId,
        type: "private",
        participants: [userId, requesterId]
      });

      const result = await ChatService.acceptFriendRequest(userId, requesterId);

      console.log("✅ [acceptFriendRequest_Success] - Expected Conv ID: " + newConvId.toString() + " | Actual Conv ID: " + result._id.toString());
      expect(result._id.toString()).toBe(newConvId.toString());

      console.log("✅ [acceptFriendRequest_Success] - Expected Conv Type: private | Actual Conv Type: " + result.type);
      expect(result.type).toBe("private");

      console.log("✅ [acceptFriendRequest_Success] - Expected socketManager emitToUserTarget to be called 2 times");
      expect(socketManager.emitToUserTarget).toHaveBeenCalledTimes(2);
    });

    it("should throw error if friend request does not exist or has been processed (Sad Path)", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const requesterId = new mongoose.Types.ObjectId().toString();

      // Mock FriendRequest.findOneAndUpdate to return null
      (FriendRequest.findOneAndUpdate as any).mockResolvedValue(null);

      let errorThrown: any = null;
      try {
        await ChatService.acceptFriendRequest(userId, requesterId);
      } catch (err) {
        errorThrown = err;
      }

      console.log("✅ [acceptFriendRequest_Failure] - Expected Status Code: 404 | Actual Status Code: " + (errorThrown ? errorThrown.statusCode : "None"));
      expect(errorThrown).toBeDefined();
      expect(errorThrown.statusCode).toBe(404);

      console.log("✅ [acceptFriendRequest_Failure] - Expected Error Message: Lời mời không tồn tại hoặc đã xử lý | Actual Error Message: " + (errorThrown ? errorThrown.message : "None"));
      expect(errorThrown.message).toBe("Lời mời không tồn tại hoặc đã xử lý");
    });
  });

  // ==========================================
  // 4. rejectFriendRequest
  // ==========================================
  describe("rejectFriendRequest", () => {
    it("should reject friend request successfully (Happy Path)", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const requesterId = new mongoose.Types.ObjectId().toString();
      const mockRequest = {
        requesterId,
        recipientId: userId,
        status: "rejected"
      };

      (FriendRequest.findOneAndUpdate as any).mockResolvedValue(mockRequest);

      const result = await ChatService.rejectFriendRequest(userId, requesterId);

      console.log("✅ [rejectFriendRequest_Success] - Expected success: true | Actual success: " + result.success);
      expect(result.success).toBe(true);

      console.log("✅ [rejectFriendRequest_Success] - Expected socketManager emitToUserTarget to be called 2 times");
      expect(socketManager.emitToUserTarget).toHaveBeenCalledTimes(2);
    });

    it("should throw 404 error if friend request to reject is not found (Sad Path)", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const requesterId = new mongoose.Types.ObjectId().toString();

      (FriendRequest.findOneAndUpdate as any).mockResolvedValue(null);

      let errorThrown: any = null;
      try {
        await ChatService.rejectFriendRequest(userId, requesterId);
      } catch (err) {
        errorThrown = err;
      }

      console.log("✅ [rejectFriendRequest_Failure] - Expected Status Code: 404 | Actual Status Code: " + (errorThrown ? errorThrown.statusCode : "None"));
      expect(errorThrown).toBeDefined();
      expect(errorThrown.statusCode).toBe(404);

      console.log("✅ [rejectFriendRequest_Failure] - Expected Error Message: Lời mời không tồn tại hoặc đã xử lý | Actual Error Message: " + (errorThrown ? errorThrown.message : "None"));
      expect(errorThrown.message).toBe("Lời mời không tồn tại hoặc đã xử lý");
    });
  });

  // ==========================================
  // 5. unfriend
  // ==========================================
  describe("unfriend", () => {
    it("should pull friends and delete friend requests between users (Happy Path)", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const targetId = new mongoose.Types.ObjectId().toString();

      (User.findByIdAndUpdate as any).mockResolvedValue({});
      (FriendRequest.deleteMany as any).mockResolvedValue({ deletedCount: 1 });

      const result = await ChatService.unfriend(userId, targetId);

      console.log("✅ [unfriend_Success] - Expected success: true | Actual success: " + result.success);
      expect(result.success).toBe(true);

      console.log("✅ [unfriend_Success] - Expected User.findByIdAndUpdate to be called 2 times");
      expect(User.findByIdAndUpdate).toHaveBeenCalledTimes(2);

      console.log("✅ [unfriend_Success] - Expected socketManager emitToUserTarget to be called 2 times");
      expect(socketManager.emitToUserTarget).toHaveBeenCalledTimes(2);
    });

    it("should throw error if db fails during unfriend (Sad Path)", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const targetId = new mongoose.Types.ObjectId().toString();

      // Mock first update to throw DB error
      (User.findByIdAndUpdate as any).mockRejectedValue(new Error("Database connection lost"));

      let errorThrown: any = null;
      try {
        await ChatService.unfriend(userId, targetId);
      } catch (err) {
        errorThrown = err;
      }

      console.log("✅ [unfriend_Failure] - Expected Error Message: Database connection lost | Actual Error Message: " + (errorThrown ? errorThrown.message : "None"));
      expect(errorThrown).toBeDefined();
      expect(errorThrown.message).toBe("Database connection lost");
    });
  });

  // ==========================================
  // 6. createGroupConversation
  // ==========================================
  describe("createGroupConversation", () => {
    it("should successfully create a class conversation (Happy Path)", async () => {
      const creatorId = new mongoose.Types.ObjectId().toString();
      const p1Id = new mongoose.Types.ObjectId();
      const mockP1 = {
        _id: p1Id,
        email: "p1@example.com",
        fullName: "Participant 1",
      };

      // Mock User.findOne to resolve to mockP1
      (User.findOne as any).mockResolvedValue(mockP1);

      // Mock Conversation.create
      const newConvId = new mongoose.Types.ObjectId();
      (Conversation.create as any).mockResolvedValue({
        _id: newConvId,
        type: "class",
        name: "Test Group",
        participants: [creatorId, p1Id.toString()],
        ownerId: creatorId,
      });

      const result = await ChatService.createGroupConversation(
        creatorId,
        "Test Group",
        [p1Id.toString()],
        "http://avatar.com",
        { desc: "test" },
        "open",
        "token"
      );

      console.log("✅ [createGroupConversation_Success] - Expected Group Name: Test Group | Actual Group Name: " + result.name);
      expect(result.name).toBe("Test Group");

      console.log("✅ [createGroupConversation_Success] - Expected participants length to be 2");
      expect(result.participants.length).toBe(2);

      console.log("✅ [createGroupConversation_Success] - Expected socketManager emitToUserTarget to be called 2 times");
      expect(socketManager.emitToUserTarget).toHaveBeenCalledTimes(2);
    });

    it("should throw error if a participant fails to sync (Sad Path)", async () => {
      const creatorId = new mongoose.Types.ObjectId().toString();
      const p1Id = new mongoose.Types.ObjectId().toString();

      // Mock User.findOne to return null and fetch mock resolved value null to simulate sync failure
      (User.findOne as any).mockResolvedValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("User not found in Core")
      });

      let errorThrown: any = null;
      try {
        await ChatService.createGroupConversation(
          creatorId,
          "Test Group",
          [p1Id],
        );
      } catch (err) {
        errorThrown = err;
      }

      console.log("✅ [createGroupConversation_Failure] - Expected Status Code: 400 | Actual Status Code: " + (errorThrown ? errorThrown.statusCode : "None"));
      expect(errorThrown).toBeDefined();
      expect(errorThrown.statusCode).toBe(400);

      console.log("✅ [createGroupConversation_Failure] - Expected Error Message to contain 'Không thể đồng bộ người dùng ID' | Actual Error Message: " + (errorThrown ? errorThrown.message : "None"));
      expect(errorThrown.message).toContain("Không thể đồng bộ người dùng ID");
    });
  });

  // ==========================================
  // 7. requestOrAddGroupMember
  // ==========================================
  describe("requestOrAddGroupMember", () => {
    it("should add target user directly if requester is owner (Happy Path)", async () => {
      const requesterId = new mongoose.Types.ObjectId().toString();
      const targetUserId = new mongoose.Types.ObjectId().toString();
      const conversationId = new mongoose.Types.ObjectId().toString();

      // Mock Conversation.findById
      const mockConv = {
        _id: conversationId,
        type: "class",
        ownerId: requesterId,
        participants: [new mongoose.Types.ObjectId(requesterId)],
        pendingMemberRequests: [],
        joinPolicy: "open",
        save: jest.fn().mockResolvedValue(true),
      };
      (Conversation.findById as any).mockResolvedValue(mockConv);

      // Mock User.findById with implementation to resolve names for different IDs
      (User.findById as any).mockImplementation((id: any) => {
        if (id.toString() === requesterId) {
          return mockQuery({
            _id: requesterId,
            fullName: "Owner User",
            email: "owner@example.com",
            friends: [],
          });
        } else {
          return mockQuery({
            _id: targetUserId,
            fullName: "Target User",
            email: "target@example.com",
            friends: [],
          });
        }
      });

      const result = await ChatService.requestOrAddGroupMember(
        requesterId,
        conversationId,
        undefined,
        targetUserId
      );

      console.log("✅ [requestOrAddGroupMember_Success] - Expected Mode: added | Actual Mode: " + result.mode);
      expect(result.mode).toBe("added");

      console.log("✅ [requestOrAddGroupMember_Success] - Expected Conversation Save to be called");
      expect(mockConv.save).toHaveBeenCalled();

      console.log("✅ [requestOrAddGroupMember_Success] - Expected socketManager emitToUserTarget to be called 2 times");
      expect(socketManager.emitToUserTarget).toHaveBeenCalledTimes(2);
    });

    it("should throw error if conversation is not found (Sad Path)", async () => {
      const requesterId = new mongoose.Types.ObjectId().toString();
      const conversationId = new mongoose.Types.ObjectId().toString();

      (Conversation.findById as any).mockResolvedValue(null);

      let errorThrown: any = null;
      try {
        await ChatService.requestOrAddGroupMember(
          requesterId,
          conversationId,
          "test@example.com"
        );
      } catch (err) {
        errorThrown = err;
      }

      console.log("✅ [requestOrAddGroupMember_Failure] - Expected Error Message: Conversation not found | Actual Error Message: " + (errorThrown ? errorThrown.message : "None"));
      expect(errorThrown).toBeDefined();
      expect(errorThrown.message).toBe("Conversation not found");
    });
  });
});
