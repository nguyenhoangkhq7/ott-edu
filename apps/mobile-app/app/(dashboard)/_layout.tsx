import { Tabs } from 'expo-router';
import React from 'react';

// Nhớ kiểm tra lại đường dẫn này xem đã trỏ đúng đến file BottomTabBar của bạn chưa nhé
import BottomTabBar from '../../src/shared/components/BottomTabBar';

export default function DashboardLayout() {
  return (
    <Tabs
      // Dùng component BottomTabBar custom của nhóm bạn
      tabBar={(props) => <BottomTabBar {...props} />}
      
      // Ẩn Header mặc định của Expo Router cho đẹp
      screenOptions={{ headerShown: false }}
    >
      {/* Các thẻ Tabs.Screen này sẽ tự động map (khớp) với các THƯ MỤC 
        mà bạn đã tạo trong (dashboard).
        Thuộc tính 'name' phải viết y hệt tên thư mục!
      */}
      <Tabs.Screen name="teams/index" options={{ title: 'Teams' /* các option khác giữ nguyên */ }} />
      <Tabs.Screen name="activity/index" options={{ title: 'Activity' }} />
      <Tabs.Screen name="chat/index" options={{ title: 'Chat' }} />
      <Tabs.Screen name="calendar/index" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="more/index" options={{ title: 'More' }} />
    </Tabs>
  );
}