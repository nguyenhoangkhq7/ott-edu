import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

// Nhớ kiểm tra đường dẫn import Hook cho đúng với cấu trúc dự án của bạn
import { useFileRealtime, ClassFile } from '@/shared/hooks/useFileRealtime';

interface FilesTabProps {
  classId: string;
}

// Hàm lấy icon theo loại file
const getFileIcon = (fileType: string): { icon: string; color: string } => {
  const type = fileType?.toLowerCase() || '';
  if (type.includes('pdf')) return { icon: 'file-pdf-box', color: '#ef4444' };
  if (type.includes('doc') || type.includes('word')) return { icon: 'file-word-box', color: '#3b82f6' };
  if (type.includes('xls') || type.includes('csv') || type.includes('excel')) return { icon: 'file-excel-box', color: '#22c55e' };
  if (type.includes('ppt') || type.includes('powerpoint')) return { icon: 'file-powerpoint-box', color: '#f97316' };
  if (type.includes('jpg') || type.includes('png') || type.includes('image')) return { icon: 'file-image-box', color: '#ec4899' };
  if (type.includes('mp4') || type.includes('video')) return { icon: 'file-video-box', color: '#8b5cf6' };
  if (type.includes('zip') || type.includes('rar')) return { icon: 'file-zip-box', color: '#6b7280' };
  return { icon: 'file-document', color: '#64748b' };
};

export default function FilesTab({ classId }: FilesTabProps) {
  const { files, loading, isUploading, uploadFile, deleteFile } = useFileRealtime(classId);

  // Sắp xếp file mới nhất lên đầu
  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      const dateA = new Date(a.uploadedAt || 0).getTime();
      const dateB = new Date(b.uploadedAt || 0).getTime();
      return dateB - dateA;
    });
  }, [files]);

  // XỬ LÝ CHỌN FILE VÀ UPLOAD
  const handlePickAndUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const uploadedFile = await uploadFile(file);

        if (uploadedFile) {
          Alert.alert('Thành công', 'Đã tải tài liệu lên lớp học!');
        } else {
          Alert.alert('Thông báo', 'Upload hoàn tất nhưng dữ liệu trả về bị thiếu thông tin.');
        }
      }
    } catch (err) {
      console.error("[FilesTab] ❌ Lỗi catch được ở UI:", err);
      Alert.alert("Lỗi Upload", "Không thể kết nối hoặc Server từ chối file.");
    }
  };

  // TẢI FILE XUỐNG MÁY (Đã tắt tính năng để chạy mượt trên Expo Go)
  const handleFileDownload = async (file: ClassFile) => {
    Alert.alert(
      'Thông báo', 
      'Chức năng tải xuống đang được tạm ẩn để chạy trên Expo Go. Tính năng này sẽ được mở lại khi build App chính thức.'
    );
  };

  const renderFileItem = ({ item }: { item: ClassFile }) => {
    // Đảm bảo lấy đúng trường dữ liệu theo tên mà Backend trả về
    const fileType = item.type || item.name || '';
    const { icon, color } = getFileIcon(fileType);
    
    // Nếu Backend trả về tên file là fileName thay vì name, ta sẽ hiển thị item.fileName
    const displayName = item.name || (item as any).fileName || 'Tài liệu không tên';

    const onLongPress = () => {
      Alert.alert(
        'Xác nhận',
        'Bạn có chắc muốn xóa tài liệu này?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xóa', style: 'destructive', onPress: async () => {
              try {
                console.log('[FilesTab] Long press delete:', item.id);
                const ok = await deleteFile(String(item.id));
                if (ok) Alert.alert('Đã xóa', 'Tài liệu đã được xóa.');
                else Alert.alert('Lỗi', 'Không thể xóa tài liệu.');
              } catch (e) {
                console.error('[FilesTab] delete error', e);
                Alert.alert('Lỗi', 'Xảy ra lỗi khi xóa tài liệu.');
              }
            }
          }
        ]
      );
    };

    return (
      <TouchableOpacity style={styles.fileItemContainer} onLongPress={onLongPress} activeOpacity={0.8}>
        <View style={styles.fileIconWrapper}>
          <MaterialCommunityIcons name={icon as any} size={32} color={color} />
        </View>

        <View style={styles.fileDetailsWrapper}>
          <Text style={styles.fileName} numberOfLines={2}>{displayName}</Text>
          <View style={styles.fileMetadata}>
            <Text style={styles.fileSize}>
              {typeof item.size === 'number' ? (item.size / 1024).toFixed(1) + ' KB' : (item.size || 'Unknown size')}
            </Text>
            {item.uploadedAt && (
              <>
                <Text style={styles.fileSeparator}>•</Text>
                <Text style={styles.fileDate}>{new Date(item.uploadedAt).toLocaleDateString()}</Text>
              </>
            )}
          </View>
          {item.uploadedBy && <Text style={styles.uploadedBy}>by {item.uploadedBy}</Text>}
        </View>

        <TouchableOpacity style={styles.downloadButton} onPress={() => handleFileDownload(item)}>
          <MaterialCommunityIcons name="download" size={20} color="#1868f0" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialCommunityIcons name="file-document-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyStateTitle}>Chưa có tài liệu nào</Text>
      <Text style={styles.emptyStateMessage}>Tài liệu được tải lên lớp học sẽ xuất hiện ở đây.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && files.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#1868f0" />
      ) : (
        <FlatList
          data={sortedFiles}
          renderItem={renderFileItem}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        />
      )}

      {/* NÚT UPLOAD NỔI (FAB) GÓC DƯỚI */}
      <TouchableOpacity 
        style={styles.fabUpload} 
        onPress={() => {
            console.log('[FilesTab] Nút upload đã được nhấn!');
            handlePickAndUploadFile();
        }}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="cloud-upload" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  listContent: { flexGrow: 1, paddingBottom: 80, paddingTop: 10 },
  fileItemContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    marginHorizontal: 12, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9'
  },
  fileIconWrapper: {
    width: 48, height: 48, borderRadius: 8, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  fileDetailsWrapper: { flex: 1, justifyContent: 'center' },
  fileName: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  fileMetadata: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  fileSize: { fontSize: 12, color: '#64748b' },
  fileSeparator: { fontSize: 11, color: '#cbd5e1', marginHorizontal: 6 },
  fileDate: { fontSize: 12, color: '#94a3b8' },
  uploadedBy: { fontSize: 11, color: '#94a3b8' },
  downloadButton: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0fdf4',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, marginTop: 50 },
  emptyStateTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginTop: 16, textAlign: 'center' },
  emptyStateMessage: { fontSize: 13, color: '#64748b', marginTop: 8, textAlign: 'center' },
  
  fabUpload: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1868f0',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1868f0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});