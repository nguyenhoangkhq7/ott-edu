# 🚀 Realtime Mobile Implementation Guide
## IP: 10.247.126.125:3001

### Tổng Quan
Hệ thống triển khai các tính năng real-time trên mobile:
- ✅ **Socket Singleton**: 1 kết nối duy nhất cho toàn bộ app (tiết kiệm pin)
- ✅ **Friend System**: Kết bạn, nhận lời mời, thay đổi trạng thái
- ✅ **Group Chat**: Tạo nhóm, thêm thành viên, gửi tin nhắn realtime
- ✅ **Member Management**: Quản lý thành viên, thay đổi role

---

## 📦 File Structure

```
src/
├── shared/
│   ├── constants/
│   │   └── socket.config.ts          # ⚙️ Socket.IO cấu hình
│   └── hooks/
│       ├── useSocket.ts              # 🔌 Socket Singleton Hook
│       └── useRealtimeServices.ts    # 🪝 Combined Services Hook
├── modules/
│   ├── friends/
│   │   ├── types.ts                  # 👥 Friend System Types
│   │   ├── friends.api.ts            # 📡 Friend API Client
│   │   ├── friends.service.ts        # 🎯 Friend Service (API + Events)
│   │   └── index.ts                  # 📤 Exports
│   └── chat/
│       ├── group.types.ts            # 💬 Group Chat Types
│       ├── group.api.ts              # 📡 Group Chat API Client
│       ├── group.service.ts          # 🎯 Group Chat Service
│       └── existing files...
```

---

## 🔌 1. Socket Configuration (socket.config.ts)

**Server URL**: `http://10.247.126.125:3001`
**Transports**: `['websocket']` - Tốc độ cao nhất, không dùng HTTP polling
**Singleton Pattern**: Chỉ 1 kết nối cho toàn bộ app

```typescript
import { SOCKET_SERVER_URL, SOCKET_IO_CONFIG, SOCKET_EVENTS } from '@/shared/constants/socket.config';

// Tất cả constants đã được định nghĩa:
console.log(SOCKET_SERVER_URL); // http://10.247.126.125:3001
console.log(SOCKET_IO_CONFIG); // { transports: ['websocket'], reconnection: true, ... }
```

---

## 🪝 2. Socket Hook (useSocket.ts)

**Tính năng**:
- Tạo singleton socket connection
- Auto-reconnect khi mất mạng
- Auth headers: `x-user-id`, `x-user-email`
- Helper methods: `emit`, `on`, `joinRoom`, `leaveRoom`

**Cách sử dụng**:

```typescript
import { useSocket } from '@/shared/hooks/useSocket';

export function ChatScreen() {
  const user = useAuth(); // Lấy user từ auth context
  
  // Khởi tạo socket
  const socket = useSocket(user?.id || null, user?.email || null);
  
  // Lắng nghe events
  useEffect(() => {
    if (!socket.socket) return;
    
    const unsubscribe = socket.on('newMessage', (message) => {
      console.log('Tin nhắn mới:', message);
      setMessages(prev => [...prev, message]);
    });
    
    return unsubscribe;
  }, [socket.socket]);
  
  // Emit events
  const sendMessage = (content: string) => {
    socket.emit('sendMessage', {
      roomId: groupId,
      content,
    });
  };
  
  return (
    <View>
      {socket.isConnected() ? (
        <Text>✅ Connected</Text>
      ) : (
        <Text>⏳ Connecting...</Text>
      )}
    </View>
  );
}
```

---

## 👥 3. Friend System

### 3.1 Types (friends/types.ts)
```typescript
type FriendRequest = {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
};

type Friend = {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: 'online' | 'offline' | 'away';
  isFriend: boolean;
};
```

### 3.2 API Functions (friends/friends.api.ts)
```typescript
// Gửi lời mời
await sendFriendRequest(receiverId);

// Chấp nhận
await acceptFriendRequest(requestId);

// Từ chối
await rejectFriendRequest(requestId);

// Lấy danh sách pending requests
await getPendingFriendRequests();

// Lấy danh sách bạn bè
await getFriendsList();

// Tìm kiếm người dùng
await searchUsers(query);

// Xóa bạn bè
await removeFriend(friendId);
```

### 3.3 Service (friends/friends.service.ts)
```typescript
import { useFriendService } from '@/shared/hooks/useRealtimeServices';

export function FriendListScreen() {
  const user = useAuth();
  const socket = useSocket(user?.id, user?.email);
  const friendService = useFriendService(socket.socket);
  
  useEffect(() => {
    // Lắng nghe sự kiện friend request
    const unsub = friendService?.subscribe(
      'friendRequestReceived',
      (data) => {
        console.log('🔔 Có người gửi lời mời:', data.senderName);
        // Cập nhật badge thông báo
        setBadgeCount(prev => prev + 1);
        // Refresh pending requests
        loadPendingRequests();
      }
    );
    
    return unsub;
  }, [friendService]);
  
  const handleSendFriendRequest = async (receiverId: string) => {
    try {
      await friendService?.sendFriendRequest(receiverId);
      alert('Đã gửi lời mời kết bạn');
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };
  
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendService?.acceptFriendRequest(requestId);
      // Danh sách bạn bè sẽ được cập nhật ngay lập tức
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };
  
  return (
    <View>
      {/* Badge thông báo */}
      {badgeCount > 0 && (
        <Badge count={badgeCount} />
      )}
      
      {/* Danh sách lời mời pending */}
      <FlatList
        data={pendingRequests}
        renderItem={({ item }) => (
          <View>
            <Text>{item.senderName}</Text>
            <Button
              title="Chấp nhận"
              onPress={() => handleAcceptRequest(item.id)}
            />
            <Button
              title="Từ chối"
              onPress={() => handleRejectRequest(item.id)}
            />
          </View>
        )}
      />
    </View>
  );
}
```

---

## 💬 4. Group Chat

### 4.1 Tạo Nhóm (Create Group)

**Luồng thực hiện**:
1. ✅ Gọi API `POST /api/chat/conversations/group`
2. ✅ Nhận `groupId` từ API
3. ✅ **Ngay lập tức**: `socket.emit('join_room', { roomId: groupId })`
4. ✅ Bây giờ app sẽ nhận real-time messages

**Code ví dụ**:
```typescript
import { useRealtimeServices } from '@/shared/hooks/useRealtimeServices';

export function CreateGroupScreen() {
  const user = useAuth();
  const socket = useSocket(user?.id, user?.email);
  const { groups } = useRealtimeServices(socket.socket);
  
  const handleCreateGroup = async () => {
    try {
      // Step 1-3: API gọi + socket join (được xử lý bên trong service)
      const newGroup = await groups?.createGroup({
        name: 'Team A',
        description: 'Project team',
        memberIds: [userId1, userId2, userId3],
      });
      
      console.log('✅ Nhóm được tạo và joined:', newGroup.id);
      
      // Chuyển sang màn hình chat nhóm
      navigation.navigate('GroupChat', {
        groupId: newGroup.id,
      });
    } catch (error) {
      alert('Lỗi tạo nhóm: ' + error.message);
    }
  };
  
  return (
    <View>
      <Button title="Tạo Nhóm" onPress={handleCreateGroup} />
    </View>
  );
}
```

### 4.2 Gửi & Nhận Tin Nhắn Realtime

**Đảm bảo**:
- Khi gửi tin nhắn, event `newMessage` được cập nhật **ngay lập tức** vào danh sách UI
- Không cần chờ server response

```typescript
export function GroupChatScreen({ groupId }) {
  const user = useAuth();
  const socket = useSocket(user?.id, user?.email);
  const { groups } = useRealtimeServices(socket.socket);
  const [messages, setMessages] = useState([]);
  
  // Join room khi component mount
  useEffect(() => {
    socket.joinRoom(groupId);
    return () => {
      socket.leaveRoom(groupId);
    };
  }, [groupId, socket]);
  
  // Lắng nghe tin nhắn mới
  useEffect(() => {
    const unsubscribe = groups?.subscribe('newMessage', (message) => {
      // Cập nhật ngay lập tức
      setMessages(prev => [...prev, message]);
    });
    
    return unsubscribe;
  }, [groups]);
  
  // Gửi tin nhắn
  const handleSendMessage = (content: string) => {
    // Emit event
    groups?.sendMessage(groupId, content);
    
    // Cập nhật UI ngay lập tức (optimistic update)
    setMessages(prev => [...prev, {
      id: generateId(),
      groupId,
      senderId: user.id,
      content,
      createdAt: new Date().toISOString(),
      status: 'sending',
    }]);
  };
  
  // Typing indicator
  const handleTextChange = (text) => {
    if (text.length === 1) {
      groups?.notifyTyping(groupId);
    }
  };
  
  const handleTextEnd = () => {
    groups?.notifyStoppedTyping(groupId);
  };
  
  // Lắng nghe typing events
  useEffect(() => {
    const unsubTyping = groups?.subscribe('userTyping', (data) => {
      console.log(`${data.userId} is typing...`);
    });
    
    return unsubTyping;
  }, [groups]);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            isOwn={item.senderId === user.id}
          />
        )}
      />
      
      <TextInput
        placeholder="Nhập tin nhắn..."
        onChangeText={handleTextChange}
        onEndEditing={handleTextEnd}
        onSubmitEditing={(e) => {
          handleSendMessage(e.nativeEvent.text);
        }}
      />
    </KeyboardAvoidingView>
  );
}
```

---

## 👥 5. Member Management

### 5.1 Thêm Thành Viên (Add Members)

**Luồng thực hiện**:
1. Gọi API `POST /api/chat/conversations/:id/members`
2. Thành viên được cập nhật ngay lập tức qua socket event `group_member_added`

```typescript
export function ManageGroupScreen({ groupId }) {
  const user = useAuth();
  const socket = useSocket(user?.id, user?.email);
  const { groups } = useRealtimeServices(socket.socket);
  const [members, setMembers] = useState([]);
  
  // Lắng nghe sự kiện thành viên được thêm
  useEffect(() => {
    const unsubscribe = groups?.subscribe('memberAdded', (event) => {
      console.log(`👤 ${event.memberName} được thêm vào nhóm`);
      
      // Cập nhật danh sách thành viên
      setMembers(prev => [...prev, {
        id: event.memberId,
        name: event.memberName,
        avatarUrl: event.memberAvatarUrl,
        role: 'member',
        joinedAt: event.addedAt,
      }]);
    });
    
    return unsubscribe;
  }, [groups]);
  
  // Lắng nghe sự kiện thành viên bị xóa
  useEffect(() => {
    const unsubscribe = groups?.subscribe('memberRemoved', (event) => {
      console.log(`🗑️ ${event.memberName} bị xóa khỏi nhóm`);
      
      setMembers(prev => prev.filter(m => m.id !== event.memberId));
    });
    
    return unsubscribe;
  }, [groups]);
  
  const handleAddMembers = async (selectedUserIds: string[]) => {
    try {
      await groups?.addMembers(groupId, {
        memberIds: selectedUserIds,
      });
      alert('Đã thêm thành viên');
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };
  
  const handleRemoveMember = async (memberId: string) => {
    try {
      await groups?.removeMember(groupId, memberId);
      // Danh sách sẽ tự động cập nhật qua event listener
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };
  
  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      await groups?.changeRole(groupId, memberId, newRole);
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };
  
  return (
    <ScrollView>
      <Button
        title="➕ Thêm Thành Viên"
        onPress={() => openUserSelector(handleAddMembers)}
      />
      
      <FlatList
        data={members}
        renderItem={({ item }) => (
          <View style={styles.memberItem}>
            <Image source={{ uri: item.avatarUrl }} />
            <View>
              <Text>{item.name}</Text>
              <Text>Role: {item.role}</Text>
            </View>
            <Menu>
              <MenuItem
                title="Thành viên"
                onPress={() => handleChangeRole(item.id, 'member')}
              />
              <MenuItem
                title="Admin"
                onPress={() => handleChangeRole(item.id, 'admin')}
              />
              <MenuItem
                title="Xóa"
                onPress={() => handleRemoveMember(item.id)}
                destructive
              />
            </Menu>
          </View>
        )}
      />
    </ScrollView>
  );
}
```

---

## 🔑 6. Authentication Headers

**Bắt buộc**:
- Tất cả API requests phải có header:
  - `Authorization: Bearer <token>`
  - `x-user-id: <userId>`
  - `x-user-email: <userEmail>`

- Socket connection cũng phải có:
  ```typescript
  auth: {
    'x-user-id': userId,
    'x-user-email': userEmail,
  }
  ```

---

## ⌨️ 7. KeyboardAvoidingView (Chat Screen)

**Lý do**: Bàn phím không che mất nội dung khi gõ tin nhắn

```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

export function ChatScreen() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      {/* Messages list */}
      <FlatList data={messages} ... />
      
      {/* Input field - sẽ được đẩy lên khi bàn phím hiện */}
      <TextInput placeholder="Nhập tin nhắn..." />
    </KeyboardAvoidingView>
  );
}
```

---

## 🚀 8. Setup Steps

### Step 1: Environment Variables (.env)
```
EXPO_PUBLIC_API_URL=http://10.247.126.125:8088
EXPO_PUBLIC_SOCKET_URL=http://10.247.126.125:3001
```

### Step 2: App Setup (App.tsx)
```typescript
import { useSocket } from '@/shared/hooks/useSocket';
import { resetSocket, resetFriendService, resetGroupChatService } from '@/services';

export default function App() {
  const user = useAuth();
  const socket = useSocket(user?.id, user?.email);
  
  // Cleanup on logout
  const handleLogout = () => {
    resetSocket();
    resetFriendService();
    resetGroupChatService();
    // ... logout logic
  };
  
  return (
    <AppContext.Provider value={{ socket }}>
      {/* Navigation */}
    </AppContext.Provider>
  );
}
```

### Step 3: Use in Screens
```typescript
import { useSocket } from '@/shared/hooks/useSocket';
import { useRealtimeServices } from '@/shared/hooks/useRealtimeServices';

export function YourScreen() {
  const user = useAuth();
  const socket = useSocket(user?.id, user?.email);
  const { friends, groups } = useRealtimeServices(socket.socket);
  
  // Use friends and groups services
}
```

---

## 📋 Checklist

- ✅ Socket configuration với IP 10.247.126.125:3001
- ✅ Singleton pattern (1 connection cho toàn app)
- ✅ Transports: ['websocket']
- ✅ Friend system (send, accept, reject, search)
- ✅ Real-time friend notifications (badge)
- ✅ Group creation & join room
- ✅ Group chat messages (real-time)
- ✅ Member management (add, remove, change role)
- ✅ Typing indicators
- ✅ KeyboardAvoidingView
- ✅ Auth headers (x-user-id, x-user-email)

---

## 🔗 Socket Events Reference

**Connection**:
- `connect` - Socket kết nối
- `disconnect` - Socket ngắt kết nối
- `connect_error` - Lỗi kết nối

**Chat**:
- `join_room` - Tham gia room
- `leave_room` - Rời room
- `newMessage` - Tin nhắn mới
- `typing` - Người đang gõ
- `stop_typing` - Dừng gõ

**Friend**:
- `friend_request_received` - Nhận lời mời
- `friend_request_accepted` - Lời mời được chấp nhận
- `friend_request_rejected` - Lời mời bị từ chối

**Group**:
- `group_member_added` - Thành viên được thêm
- `group_member_removed` - Thành viên bị xóa
- `group_member_left` - Thành viên rời
- `group_updated` - Nhóm được cập nhật

**User Status**:
- `user_online` - Người dùng online
- `user_offline` - Người dùng offline
- `user_status_changed` - Trạng thái thay đổi

---

## 🎯 Performance Tips

1. **Singleton Socket**: Đã tối ưu - 1 connection duy nhất
2. **Event Unsubscribe**: Luôn gọi unsubscribe khi component unmount
3. **Optimistic Updates**: Cập nhật UI trước khi server response
4. **Lazy Loading**: Load tin nhắn theo pages
5. **Memory Cleanup**: Reset services khi logout

---

Tài liệu này cung cấp đầy đủ hướng dẫn để triển khai real-time features trên mobile! 🎉
