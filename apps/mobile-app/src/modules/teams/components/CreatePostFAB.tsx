import React, { useRef } from 'react';
import { StyleSheet, Animated, Pressable, Platform, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CreatePostFABProps {
  onPress: () => void;
}

export default function CreatePostFAB({ onPress }: CreatePostFABProps) {
  // Tạo giá trị Animated để làm hiệu ứng scale (co giãn) khi nhấn
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Hiệu ứng khi nhấn giữ: Nút sẽ thu nhỏ lại nhẹ nhàng (scale về 0.9)
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  // Hiệu ứng khi buông tay: Nút nảy lại kích thước cũ kèm độ đàn hồi (spring)
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.fabContainer, { transform: [{ scale: scaleValue }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
        // Hiệu ứng sóng nước lan tỏa cho các máy Android
        android_ripple={{ color: 'rgba(255, 255, 255, 0.25)', borderless: true }}
      >
        <MaterialCommunityIcons
          name="pencil-plus"
          size={26}
          color="#ffffff"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1868f0',
    // Đổ bóng chuẩn cho iOS
    shadowColor: '#1868f0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 5,
    // Đổ bóng chuẩn cho Android
    elevation: 6,
    // Đảm bảo hiệu ứng gợn sóng của Android không bị tràn ra ngoài góc bo tròn
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  pressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});