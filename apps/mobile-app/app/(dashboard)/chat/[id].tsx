import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

  // 🛡️ Lấy Identity xịn (ID MongoDB 24 ký tự) tránh lỗi 400/500
  const identity = useMemo(() => {
    if (!user) return null;
    return {
      email: user.email || "",
      code: user.code ?? undefined,
      id: (user as any)?._id || (user as any)?.mongoId || (user as any)?.id || ""
    };
  }, [user]);

  // 🔌 Khởi tạo Socket và xử lý Realtime
  useEffect(() => {
    if (!identity?.id || identity.id.length !== 24 || !conversationId) return;

    // Khởi tạo kết nối tới Node.js Gateway
    const nextSocket = io(CHAT_SERVICE_URL, {
      auth: { userId: identity.id },
      query: { userId: identity.id },
      transports: ["websocket"],
    });

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

    setSocket(nextSocket);

    // Dọn dẹp luồng khi thoát khỏi phòng chat
    return () => {
      console.log(`🧹 Leaving room: ${conversationId} and disconnecting socket...`);
      nextSocket.emit("leaveRoom", conversationId); // Báo Backend cho rời phòng
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [identity?.id, conversationId]);

  // 📥 Load dữ liệu thông tin phòng và lịch sử tin nhắn cũ
  useEffect(() => {
    if (!identity || !conversationId) return;

    const loadChatData = async () => {
      setIsLoading(true);
      try {
        // 1. Lấy danh sách hội thoại để tìm thông tin cấu hình phòng
        const allConversations = await fetchConversations(identity.id, identity as any);
        
        // Chốt chặn thông minh: Tìm kiếm quét cả trường id lẫn _id MongoDB phòng hờ lệch kiểu dữ liệu
        const currentConv = allConversations.find(
          c => c.id === conversationId || (c as any)._id === conversationId
        );
        
        if (currentConv) {
          setConversation(currentConv as any);
          
          // 2. Kích hoạt tính năng tải lịch sử tin nhắn cũ từ database
          const msgHistory = await fetchMessages(conversationId, identity as any);
          if (msgHistory) {
            setMessages(msgHistory);
          }
        } else {
          console.warn("⚠️ Không tìm thấy phòng chat trùng khớp trong danh sách.");
        }
      } catch (error) {
        console.error("❌ Lỗi load dữ liệu phòng chat:", error);
        Alert.alert("Lỗi", "Không thể tải nội dung cuộc trò chuyện");
      } finally {
        setIsLoading(false);
      }
    };

    void loadChatData();
  }, [identity, conversationId]);

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