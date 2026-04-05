import { Conversation, Message, User } from './types';

export const currentUser: User = {
  id: 'u1',
  name: 'Hoàng Nguyễn',
  avatarUrl: 'https://i.pravatar.cc/150?u=u1',
  isOnline: true,
};

export const mockUsers: Record<string, User> = {
  u2: {
    id: 'u2',
    name: 'Thùy Linh',
    avatarUrl: 'https://i.pravatar.cc/150?u=u2',
    isOnline: true,
  },
  u3: {
    id: 'u3',
    name: 'Minh Quân',
    avatarUrl: 'https://i.pravatar.cc/150?u=u3',
    isOnline: false,
  },
  u4: {
    id: 'u4',
    name: 'Nhóm Toán A1',
    avatarUrl: 'https://i.pravatar.cc/150?u=g1',
    isOnline: true,
  },
};

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    name: null,
    type: 'direct',
    participants: [currentUser, mockUsers.u2],
    avatarUrl: null,
    unreadCount: 2,
    lastMessage: {
      id: 'm2',
      conversationId: 'c1',
      senderId: 'u2',
      content: 'Mai bạn có đi học không?',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
      status: 'delivered',
    },
  },
  {
    id: 'c2',
    name: null,
    type: 'direct',
    participants: [currentUser, mockUsers.u3],
    avatarUrl: null,
    unreadCount: 0,
    lastMessage: {
      id: 'm3',
      conversationId: 'c2',
      senderId: 'u1',
      content: 'Cảm ơn bạn nhé!',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      status: 'read',
    },
  },
  {
    id: 'c3',
    name: 'Nhóm Học Tập',
    type: 'group',
    participants: [currentUser, mockUsers.u2, mockUsers.u3],
    avatarUrl: 'https://i.pravatar.cc/150?img=33',
    unreadCount: 5,
    lastMessage: {
      id: 'm4',
      conversationId: 'c3',
      senderId: 'u3',
      content: 'Mọi người làm bài tập chưa?',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'read',
    },
  },
];

export const mockMessages: Record<string, Message[]> = {
  c1: [
    {
      id: 'm1',
      conversationId: 'c1',
      senderId: 'u1',
      content: 'Chào Linh, bạn khỏe không?',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      status: 'read',
    },
    {
      id: 'm2',
      conversationId: 'c1',
      senderId: 'u2',
      content: 'Mai bạn có đi học không?',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: 'delivered',
    },
  ],
  c3: [
    {
      id: 'm5',
      conversationId: 'c3',
      senderId: 'u1',
      content: 'Xin chào mọi người!',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      status: 'read',
    },
    {
      id: 'm4',
      conversationId: 'c3',
      senderId: 'u3',
      content: 'Mọi người làm bài tập chưa?',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: 'read',
    },
  ]
};
