import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { io, type Socket } from "socket.io-client";
import { useAuth } from '../../../src/modules/auth/AuthProvider';
import { CHAT_SERVICE_URL } from '../../../src/modules/chat/chat.config';
// 🚀 Nhớ thêm hàm fetchMessages vào phần import từ chat.service của ông nhé
import { ChatWindow } from '../../../src/modules/chat/components/ChatWindow';
import { Conversation, Message } from '../../../src/modules/chat/types';
import { fetchConversations, fetchMessages, sendMessageViaApi } from '../../../src/modules/chat/chat.service';

export default function ChatRoomRoute() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  // --- State quản lý dữ liệu ---
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  // 🛡️ Lấy Identity xịn (ID MongoDB 24 ký tự) tránh lỗi 400/500
  const identity = useMemo(() => {
    if (!user) return null;
    return {
      email: user.email || "",
      code: user.code ?? undefined,
      id: (user as any)?._id || (user as any)?.mongoId || (user as any)?.id || ""
    };
  }, [user]);

  // 📥 Load dữ liệu thông tin phòng và lịch sử tin nhắn cũ
  const loadChatData = useCallback(async (silent = false) => {
    if (!identity || !conversationId) return;

    if (!silent) setIsLoading(true);
    try {
      const allConversations = await fetchConversations(identity.id, identity as any);
      
      const currentConv = allConversations.find(
        c => c.id === conversationId || (c as any)._id === conversationId
      );
      
      if (currentConv) {
        setConversation(currentConv as any);
        
        if (!silent) {
          const msgHistory = await fetchMessages(conversationId, identity as any);
          if (msgHistory) {
            setMessages(msgHistory);
          }
        }
      } else {
        console.warn("⚠️ Không tìm thấy phòng chat trùng khớp trong danh sách.");
      }
    } catch (error) {
      console.error("❌ Lỗi load dữ liệu phòng chat:", error);
      if (!silent) Alert.alert("Lỗi", "Không thể tải nội dung cuộc trò chuyện");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [identity, conversationId]);

  const loadChatDataRef = useRef(loadChatData);
  useEffect(() => {
    loadChatDataRef.current = loadChatData;
  }, [loadChatData]);

  // 🔌 Khởi tạo Socket và xử lý Realtime
  useEffect(() => {
    if (!identity?.id || identity.id.length !== 24 || !conversationId) return;

    // Khởi tạo kết nối tới Node.js Gateway
    const nextSocket = io(CHAT_SERVICE_URL, {
      auth: { userId: identity.id },
      query: { userId: identity.id },
      transports: ["websocket"],
    });

    const typingTimeoutsRef = {} as Record<string, any>;

    // 🚀 BÙA REALTIME 1: Báo với Backend là tôi tham gia vào phòng chat này
    nextSocket.on("connect", () => {
      console.log(`🔌 Socket Connected! Joining room: ${conversationId}`);
      // Nhớ check xem Backend của ông đặt tên sự kiện là "joinRoom" hay "join_room" nhé!
      nextSocket.emit("joinRoom", conversationId); 
    });

    // 🚀 BÙA REALTIME 2: Lắng nghe tin nhắn từ các thành viên khác gửi tới phòng này
    nextSocket.on("newMessage", (newMessage: Message) => {
      console.log("🔔 Nhận tin nhắn Realtime mới:", newMessage);
      if (newMessage.conversationId === conversationId) {
        setMessages((prev) => {
          // Tránh trùng tin nhắn nếu Backend echo lại cả người gửi
          if (prev.some(msg => msg.id === newMessage.id || (msg as any)._id === (newMessage as any)._id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    });

    // 🚀 BÙA REALTIME 3: Lắng nghe cập nhật cài đặt nhóm (chặn/mở chat)
    nextSocket.on("conversation_settings_updated", (data: { conversationId: string; onlyAdminCanMessage: boolean }) => {
      console.log("🔔 Nhận cập nhật settings Realtime:", data);
      if (data.conversationId === conversationId) {
        setConversation((prev) => {
          if (!prev) return null;
          return { ...prev, onlyAdminCanMessage: data.onlyAdminCanMessage };
        });
      }
    });

    // 🚀 BÙA REALTIME 4: Lắng nghe trạng thái soạn tin nhắn
    const handleTypingStart = (data: { conversationId: string; userId: string; userName: string }) => {
      if (data.conversationId === conversationId && data.userId !== identity.id) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.userName || "Người dùng",
        }));

        if (typingTimeoutsRef[data.userId]) {
          clearTimeout(typingTimeoutsRef[data.userId]);
        }

        // Tự động ẩn typing sau 4 giây không hoạt động
        typingTimeoutsRef[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => {
            if (!prev[data.userId]) return prev;
            const next = { ...prev };
            delete next[data.userId];
            return next;
          });
          delete typingTimeoutsRef[data.userId];
        }, 4000);
      }
    };

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId) {
        if (typingTimeoutsRef[data.userId]) {
          clearTimeout(typingTimeoutsRef[data.userId]);
          delete typingTimeoutsRef[data.userId];
        }
        setTypingUsers((prev) => {
          if (!prev[data.userId]) return prev;
          const next = { ...prev };
          delete next[data.userId];
          return next;
        });
      }
    };

    nextSocket.on("userTyping", handleTypingStart);
    nextSocket.on("typing", handleTypingStart);
    nextSocket.on("user_typing", handleTypingStart);
    nextSocket.on("user-typing", handleTypingStart);

    nextSocket.on("userStoppedTyping", handleTypingStop);
    nextSocket.on("userStopTyping", handleTypingStop);
    nextSocket.on("stopTyping", handleTypingStop);
    nextSocket.on("user_stop_typing", handleTypingStop);
    nextSocket.on("user-stop-typing", handleTypingStop);

    // 🚀 BÙA REALTIME 5: Lắng nghe cập nhật nhóm (thay đổi vai trò, thành viên)
    nextSocket.on("group_updated", () => {
      console.log("🔔 [Socket] Nhóm được cập nhật (thay đổi thành viên/vai trò)!");
      void loadChatDataRef.current(true); // reload im lặng để lấy role mới
    });

    setSocket(nextSocket);

    // Dọn dẹp luồng khi thoát khỏi phòng chat
    return () => {
      console.log(`🧹 Leaving room: ${conversationId} and disconnecting socket...`);
      Object.values(typingTimeoutsRef).forEach(clearTimeout);
      nextSocket.off("conversation_settings_updated");
      nextSocket.off("group_updated");
      nextSocket.off("userTyping");
      nextSocket.off("typing");
      nextSocket.off("user_typing");
      nextSocket.off("user-typing");
      nextSocket.off("userStoppedTyping");
      nextSocket.off("userStopTyping");
      nextSocket.off("stopTyping");
      nextSocket.off("user_stop_typing");
      nextSocket.off("user-stop-typing");
      nextSocket.emit("leaveRoom", conversationId); // Báo Backend cho rời phòng
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [identity?.id, conversationId]);

  // 📥 Load dữ liệu thông tin phòng và lịch sử tin nhắn cũ
  useEffect(() => {
    void loadChatData();
  }, [loadChatData]);

  // 📤 Xử lý bắn tin nhắn đi lên Node.js Backend
  const handleSendMessage = async (content: string, attachments?: any[], replyToId?: string) => {
    if (!identity || !content.trim()) return;

    setIsSending(true);
    try {
      // Bỏ dùng socket.emit("sendMessage"), chuyển sang gọi API
      await sendMessageViaApi(conversationId as string, identity as any, {
        content: content.trim(),
        attachments: attachments || [],
        replyToId
      });

      // GỌI API XONG LÀ NGỒI CHƠI XƠI NƯỚC! 
      // Không cần tự add tin nhắn vào state, Backend lưu xong sẽ tự động 
      // bắn sự kiện "newMessage" qua Socket. Mobile nghe thấy sẽ tự hiện lên!

    } catch (error) {
      console.error("❌ Lỗi gửi tin nhắn:", error);
      Alert.alert("Lỗi", "Gửi tin nhắn thất bại");
    } finally {
      setIsSending(false);
    }
  };

  // ✍️ Phát tín hiệu đang soạn tin nhắn lên Socket
  const handleTyping = useCallback((isTyping: boolean) => {
    if (!socket || !identity?.id || !conversationId) return;
    if (isTyping) {
      socket.emit("userTyping", {
        conversationId,
        userId: identity.id,
        userName: (user as any)?.fullName || (user as any)?.name || "Người dùng",
      });
    } else {
      socket.emit("userStoppedTyping", {
        conversationId,
        userId: identity.id,
      });
    }
  }, [socket, identity?.id, conversationId, user]);

  if (!user || !identity) return null;

  return (
    <View style={styles.container}>
      {/* Ẩn Header gốc để nhường sân diễn cho Header custom trong ChatWindow */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <ChatWindow 
        conversation={conversation}
        messages={messages}
        currentUser={{ ...user, id: identity.id } as any}
        isLoadingMessages={isLoading}
        isSending={isSending}
        onSendMessage={handleSendMessage}
        onBack={() => router.back()}
        socket={socket}
        onOpenGroupManage={() => {
           // router.push(`/chat/manage/${conversationId}`);
        }}
        typingUsers={typingUsers}
        onTyping={handleTyping}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});