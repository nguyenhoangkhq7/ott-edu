import { Tabs } from "expo-router";
import React from "react";

// Nhớ kiểm tra lại đường dẫn này xem đã trỏ đúng đến file BottomTabBar của bạn chưa nhé
import BottomTabBar from "../../src/shared/components/BottomTabBar";

export default function DashboardLayout() {
  return (
    <Tabs
      // Dùng component BottomTabBar custom của nhóm bạn
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* 1. Trang Activity (Trang chủ) */}
      <Tabs.Screen name="activity/index" options={{ title: "Activity" }} />

      {/* 2. Trang Teams */}
      <Tabs.Screen name="teams/index" options={{ title: "Teams" }} />

      {/* 3. Trang Danh sách Chat (Đây là nút Chat chính) */}
      <Tabs.Screen name="chat/index" options={{ title: "Chat" }} />

      {/* 🚀 4. TRANG CHI TIẾT CHAT (QUAN TRỌNG)
          CHỈ GIỮ LẠI href: null để Expo Router không bắt bẻ gây sập App nữa
      */}
      <Tabs.Screen
        name="chat/[id]"
        options={{
          title: "Chat Room",
          href: null, // 🛡️ Chỉ cần giữ một mình bùa chú này là đủ!
        }}
      />

      {/* 5. Trang Lịch */}
      <Tabs.Screen name="calendar/index" options={{ title: "Calendar" }} />

      {/* 6. Trang Thêm (More) */}
      <Tabs.Screen name="more/index" options={{ title: "More" }} />

      {/* --- CÁC TRANG TÀI KHOẢN (CHỈ DÙNG href: null) --- */}
      <Tabs.Screen name="account/index" options={{ href: null }} />
      <Tabs.Screen name="account/profile" options={{ href: null }} />
      <Tabs.Screen name="account/edit" options={{ href: null }} />
      <Tabs.Screen name="account/change-password/index" options={{ href: null }} />
      <Tabs.Screen name="account/change-password/verify" options={{ href: null }} />
      <Tabs.Screen name="account/change-password/form" options={{ href: null }} />
    </Tabs>
  );
}