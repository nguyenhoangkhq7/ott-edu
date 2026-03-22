import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // 1. CẬP NHẬT MẢNG SẮP XẾP: Thay 'assignments' thành 'calendar'
  const orderedRoutes = ['activity', 'chat', 'teams', 'calendar', 'more'];

  const sortedRoutes = state.routes.slice().sort((a, b) => {
    const nameA = a.name.split('/')[0];
    const nameB = b.name.split('/')[0];
    return orderedRoutes.indexOf(nameA) - orderedRoutes.indexOf(nameB);
  });

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        {sortedRoutes.map((route) => {
          const originalIndex = state.routes.findIndex(r => r.key === route.key);
          const isFocused = state.index === originalIndex;
          const baseRouteName = route.name.split('/')[0];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName = 'ellipse-outline';
          let label = 'Tab';

          if (baseRouteName === 'activity') {
            iconName = isFocused ? 'pulse' : 'pulse-outline';
            label = 'Activity';
          } else if (baseRouteName === 'chat') {
            iconName = isFocused ? 'chatbubble' : 'chatbubble-outline';
            label = 'Chat';
          } else if (baseRouteName === 'teams') {
            iconName = isFocused ? 'people' : 'people-outline'; 
            label = 'Teams';
          } 
          // 2. CẬP NHẬT Ở ĐÂY: Bắt route 'calendar' và đổi Icon thành hình quyển lịch
          else if (baseRouteName === 'calendar') {
            iconName = isFocused ? 'calendar' : 'calendar-outline';
            label = 'Calendar';
          } 
          else if (baseRouteName === 'more') {
            iconName = isFocused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline';
            label = 'More';
          } else {
              return null; 
          }

          const activeColor = '#1f67f0'; 
          const inactiveColor = '#64748b'; 

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7} 
            >
              <Ionicons 
                name={iconName as any} 
                size={26} 
                color={isFocused ? activeColor : inactiveColor} 
              />
              <Text style={[
                  styles.tabLabel, 
                  { 
                      color: isFocused ? activeColor : inactiveColor,
                      fontWeight: isFocused ? '600' : '400' 
                  }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#ffffff' },
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    height: Platform.OS === 'ios' ? 60 : 65,
    paddingBottom: Platform.OS === 'ios' ? 0 : 5, 
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11, 
    marginTop: 4,
  }
});