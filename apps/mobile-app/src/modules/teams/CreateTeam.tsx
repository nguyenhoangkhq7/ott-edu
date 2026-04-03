import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CreateClassForm from './CreateClassForm';

interface CreateTeamProps {
  onBack: () => void;
}

export default function CreateTeam({ onBack }: CreateTeamProps) {
  const [teamCode, setTeamCode] = useState('');
  const [showForm, setShowForm] = useState(false);

  // The form is shown as a modal overlay, not replacing this screen
  return (
    <>
      {/* SafeAreaView giúp đẩy nội dung xuống dưới tai thỏ và thanh pin */}
      <SafeAreaView style={styles.safeArea}>
      {/* Cấu hình thanh trạng thái (pin, sóng) màu tối cho nền trắng */}
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header: Đã được căn chỉnh để không bị che */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create or Join a Team</Text>
          <TouchableOpacity onPress={onBack} style={styles.closeBtn} activeOpacity={0.6}>
            <Ionicons name="close" size={26} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Create a team */}
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#1868f0' }]}>
              <Ionicons name="add" size={32} color="white" />
            </View>
            <Text style={styles.cardTitle}>Create a team</Text>
            <Text style={styles.cardDesc}>
              Start a new space for your class or project and invite participants.
            </Text>
            <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => setShowForm(true)} // 4. KHI BẤM NÚT XANH THÌ HIỆN FORM
          >
            <Text style={styles.primaryBtnText}>Create Team</Text>
          </TouchableOpacity>
          </View>

          {/* Card 2: Join a team */}
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
              <Ionicons name="person-add-outline" size={26} color="#1868f0" />
            </View>
            <Text style={styles.cardTitle}>Join a team with a code</Text>
            <Text style={styles.cardDesc}>
              Already have a code? Enter it below to join an existing group.
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="ENTER CODE"
              placeholderTextColor="#94a3b8"
              value={teamCode}
              onChangeText={setTeamCode}
              autoCapitalize="characters"
              maxLength={10}
            />
            
            <TouchableOpacity 
              disabled={teamCode.length === 0}
              style={[
                styles.secondaryBtn, 
                teamCode.length > 0 && styles.activeJoinBtn
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.secondaryBtnText, 
                teamCode.length > 0 && styles.activeJoinText
              ]}>
                Join Team
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer các nút hỗ trợ */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
            <Text style={styles.cancelText}>Cancel and go back</Text>
          </TouchableOpacity>
          
          <View style={styles.helpLink}>
            <Ionicons name="help-circle-outline" size={16} color="#94a3b8" />
            <Text style={styles.helpText}>Need help setting up?</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Create Class Form Modal */}
      <CreateClassForm 
        visible={showForm}
        onClose={() => setShowForm(false)}
        onCreated={(name) => {
          console.log('Class created:', name);
          setShowForm(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#ffffff',
    // Xử lý khoảng cách StatusBar cho Android
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1e293b' 
  },
  closeBtn: { 
    padding: 4 
  },
  container: { 
    padding: 10, 
    alignItems: 'center',
    paddingBottom: 40, 
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    // Hiệu ứng đổ bóng chuẩn UI
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconBox: {
    width: 60, 
    height: 60, 
    borderRadius: 15,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15,
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 8 
  },
  cardDesc: { 
    fontSize: 14, 
    color: '#64748b', 
    textAlign: 'center', 
    marginBottom: 20, 
    lineHeight: 20 
  },
  primaryBtn: {
    backgroundColor: '#1868f0', 
    width: '100%', 
    paddingVertical: 14,
    borderRadius: 12, 
    alignItems: 'center',
  },
  primaryBtnText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  input: {
    width: '100%', 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    paddingVertical: 12, 
    borderRadius: 12, 
    textAlign: 'center',
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    color: '#1e293b'
  },
  secondaryBtn: {
    backgroundColor: '#f1f5f9', 
    width: '100%', 
    paddingVertical: 14,
    borderRadius: 12, 
    alignItems: 'center',
  },
  activeJoinBtn: { 
    backgroundColor: '#e0f2fe' 
  },
  secondaryBtnText: { 
    color: '#94a3b8', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  activeJoinText: { 
    color: '#1868f0' 
  },
  cancelBtn: { 
    marginTop: 10, 
    marginBottom: 15 
  },
  cancelText: { 
    color: '#64748b', 
    fontWeight: '600', 
    fontSize: 15 
  },
  helpLink: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 30 
  },
  helpText: { 
    color: '#94a3b8', 
    fontSize: 13, 
    marginLeft: 5 
  },
});