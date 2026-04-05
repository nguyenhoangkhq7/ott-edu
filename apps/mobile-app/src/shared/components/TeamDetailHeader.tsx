import React from 'react';
import { View, Text, TouchableOpacity, ScrollView,  Platform, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface TeamDetailHeaderProps {
  teamName: string;
  subtitle: string;
  activeTab: string;
  onTabPress: (tab: string) => void;
  onBackPress: () => void;
}

const TABS = ['Posts', 'Files', 'Members', 'Assignments', 'Grades', 'Settings'];

export default function TeamDetailHeader({ teamName, subtitle, activeTab, onTabPress, onBackPress }: TeamDetailHeaderProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 10 }}>
        
        <View style={styles.headerTop}>
          <View style={styles.teamInfoContainer}>
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1868f0" />
            </TouchableOpacity>
            
            <View style={styles.teamIconBox}>
              <Text style={styles.teamIconText}>Σ</Text>
            </View>
            
            <View style={styles.teamTextContainer}>
              <Text style={styles.teamName} numberOfLines={1}>{teamName}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search-outline" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity 
                  key={tab} 
                  onPress={() => onTabPress(tab)}
                  style={[styles.tabButton, isActive ? styles.tabButtonActive : styles.tabButtonInactive]}
                >
                  <Text style={[styles.tabText, isActive ? styles.tabTextActive : styles.tabTextInactive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  teamInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  teamIconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  teamIconText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 18,
  },
  teamTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  searchButton: {
    padding: 8,
    marginRight: 8,
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  tabButtonActive: {
    borderBottomColor: '#1868f0',
  },
  tabButtonInactive: {
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#1868f0',
  },
  tabTextInactive: {
    color: '#64748b',
  },
});