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
      <Tabs.Screen name="teams" options={{ title: 'Teams' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}