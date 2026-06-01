import { useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import {
  GroupChatService,
  getGroupChatService,
} from "../../modules/chat/group.service";
import { FriendService, getFriendService } from "../../modules/friends/friends.service";
/**
 * 🪝 Hook for Group Chat Service
 * Usage in components:
 * const groupChat = useGroupChatService(socket);
 * await groupChat.createGroup({ name: "Team A", memberIds: [...] });
 */
export const useGroupChatService = (socket: Socket | null) => {
  const serviceRef = useRef<GroupChatService | null>(null);

  useEffect(() => {
    if (socket) {
      serviceRef.current = getGroupChatService(socket, null as any);
    }
    return () => {
      // Keep service for reuse (don't destroy on unmount)
    };
  }, [socket]);

  return serviceRef.current;
};

/**
 * 🪝 Hook for Friend Service
 * Usage in components:
 * const friendService = useFriendService(socket);
 * await friendService.sendFriendRequest(userId);
 */
export const useFriendService = (socket: Socket | null) => {
  const serviceRef = useRef<FriendService | null>(null);
  useEffect(() => {
    if (socket) {
      serviceRef.current = getFriendService(socket, null as any);
    }
    return () => {
      // Keep service for reuse (don't destroy on unmount)
    };
  }, [socket]);

  return serviceRef.current;
};

/**
 * 🪝 Combined Hook for Real-time Features
 * Sử dụng khi cần cả Friend System + Group Chat
 * Usage:
 * const realtime = useRealtimeServices(socket);
 * await realtime.groups.createGroup(...);
 * await realtime.friends.sendFriendRequest(...);
 */
export const useRealtimeServices = (socket: Socket | null) => {
  const groupService = useGroupChatService(socket);
  const friendService = useFriendService(socket);

  return {
    groups: groupService,
    friends: friendService,
    socket,
  };
};
