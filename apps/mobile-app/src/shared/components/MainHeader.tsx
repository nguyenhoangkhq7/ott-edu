import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface MainHeaderProps {
  title: string;
}

export default function MainHeader({ title }: MainHeaderProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View 
        style={[
          styles.container, 
          { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 10 }
        ]}
      >
        <View style={styles.leftSection}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?img=68' }} 
            style={styles.avatar}
          />
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search-outline" size={24} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
    marginLeft: 12,
  },
});