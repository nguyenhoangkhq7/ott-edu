import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import axiosClient from '@/modules/api/axios';
import { getAccessToken } from '@/modules/api/token-store';
import { apiClient } from '@/modules/api';
import { useSocket, useSocketListener, useSocketRoomJoin } from './useSocket';

export interface ClassFile {
  id: string;
  name: string;
  size: number | string;
  type: string;
  fileUrl: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export function useFileRealtime(classId: string | null) {
  const [files, setFiles] = useState<ClassFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const socket = useSocket();

  // 1. TẢI DANH SÁCH FILE TỪ SERVER (Khớp API: GET /attachments/class/{classId})
  const fetchFiles = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      console.log('[useFileRealtime] 🔁 fetchFiles() -> GET /attachments/class/' + classId);
      const rawResponse: any = await axiosClient.get(`/attachments/class/${classId}`);
      console.log('[useFileRealtime] 🔁 fetchFiles response.headers:', rawResponse.headers);
      console.log('[useFileRealtime] 🔁 fetchFiles response.data:', rawResponse.data);
      const data = rawResponse?.data ?? rawResponse;
      // Backend might return { attachments: [...] } or the array directly
      const normalized = Array.isArray(data) ? data : Array.isArray(data?.attachments) ? data.attachments : [];
      console.log('[useFileRealtime] 🔁 Normalized files count:', normalized.length);
      // Deduplicate by id to avoid duplicate keys in FlatList
      const uniqueById = Array.from(new Map(normalized.filter(Boolean).map((f: any) => [String(f.id), f])).values()) as ClassFile[];
      setFiles(uniqueById);
    } catch (err) {
      console.error('[useFileRealtime] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // 2. LẮNG NGHE SOCKET THỜI GIAN THỰC (Nếu có update từ user khác)
  // Join socket room for this class so server broadcasts reach this client
  useSocketRoomJoin(socket, classId);

  useSocketListener(
    socket,
    'file_updated',
    (data: { classId?: string; action?: string; id?: string; file?: ClassFile }) => {
      // Server payload may not include classId (room scoped), so only filter when provided
      if (data.classId && data.classId !== classId) return;

      // Handle uploaded/created events
      if ((data.action === 'created' || data.action === 'uploaded') && data.file) {
        const file = data.file as ClassFile;
        setFiles((prev) => {
          if (!file?.id) return [file, ...prev];
          if (prev.some((p) => String(p.id) === String(file.id))) return prev;
          return [file, ...prev];
        });
        return;
      }

      // Handle deletion
      if ((data.action === 'deleted' || data.action === 'removed') && data.id) {
        setFiles((prev) => prev.filter((f) => f.id !== data.id));
        return;
      }
    }
  );

  // 3. UPLOAD FILE LÊN SERVER (Khớp API: POST /attachments/class/{classId})
  const uploadFile = useCallback(async (selectedFile: any) => {
    console.log('[useFileRealtime] 🚀 HÀM UPLOAD ĐÃ ĐƯỢC GỌI!!!');
    if (!classId) {
      console.log('[useFileRealtime] ❌ classId bị null, aborting!');
      return null;
    }
    
    try {
      setIsUploading(true);
      console.log('[useFileRealtime] 🔍 Bắt đầu tạo FormData...');
      const formData = new FormData();

      const fileName = selectedFile.name || 'file.pdf';
      const fileType = selectedFile.mimeType || selectedFile.type || 'application/octet-stream';

      console.log('[useFileRealtime] 🔍 File info:', { fileName, fileType, uri: selectedFile.uri });

      // 1. CHUẨN BỊ DỮ LIỆU
      const fileUri = selectedFile.uri;
      
      // For Android content:// URIs, using blob in FormData can cause RN network errors.
      // Prefer appending the RN file object { uri, name, type } for Android/content URIs.
      const isAndroidContentUri = Platform.OS === 'android' && fileUri?.startsWith?.('content://');
      if (isAndroidContentUri) {
        console.log('[useFileRealtime] ⚙️ Detected Android content:// URI — using fallback object append');
        (formData as any).append('file', { uri: fileUri, name: fileName, type: fileType });
      } else {
        // Try fetch->blob for iOS or file:// URIs
        try {
          console.log('[useFileRealtime] 🔍 Đang thử fetch blob...');
          const fetched = await fetch(fileUri);
          const blob = await fetched.blob();
          console.log('[useFileRealtime] 🔍 Blob thành công:', blob.size, 'bytes');
          (formData as any).append('file', blob, fileName);
        } catch (fetchErr) {
          console.warn('[useFileRealtime] ⚠️ Blob thất bại, dùng fallback object...', (fetchErr as any)?.message ?? fetchErr);
          (formData as any).append('file', { uri: fileUri, name: fileName, type: fileType });
        }
      }

      // 2. CẤU HÌNH HEADERS — không set Content-Type (let axios handle boundary)
      const headers: any = {
        Accept: 'application/json',
      };

      console.log('[useFileRealtime] 🔁 Headers gửi đi (no Content-Type):', headers);
      console.log('[useFileRealtime] 🔁 URL gọi API:', `/attachments/class/${classId}`);

      // 3. GỌI API — prefer fetch in React Native to let the native XHR set multipart boundary correctly
      const baseURL = (axiosClient as any).defaults?.baseURL ?? '';
      const uploadUrl = `${baseURL}/attachments/class/${classId}`;
      console.log('[useFileRealtime] 🔁 Đang gọi fetch POST ->', uploadUrl);

      const token = await getAccessToken();
      const fetchHeaders: any = { Accept: 'application/json' };
      if (token) fetchHeaders.Authorization = `Bearer ${token}`;

      // Do NOT set Content-Type; let fetch/XHR set it with boundary
      let fetchResponse: Response;
      try {
        fetchResponse = await fetch(uploadUrl, { method: 'POST', headers: fetchHeaders, body: formData });
        console.log('[useFileRealtime] ✅ fetch upload status:', fetchResponse.status);
      } catch (netErr) {
        console.error('[useFileRealtime] ❌ fetch POST network error:', (netErr as any)?.message ?? netErr);
        throw netErr;
      }
      try {
        // response.headers is a Headers object; log its entries
        const headersObj: any = {};
        fetchResponse.headers.forEach((value: string, key: string) => (headersObj[key] = value));
        console.log('[useFileRealtime] ✅ fetch upload response.headers:', headersObj);
      } catch (hErr) {
        console.warn('[useFileRealtime] ⚠️ could not read fetch response headers', hErr);
      }

      const rawText = await fetchResponse.text();
      let parsedData: any = rawText;
      try {
        parsedData = JSON.parse(rawText);
      } catch {}
      console.log('[useFileRealtime] ✅ fetch upload response.body:', parsedData);

      if (!fetchResponse.ok) {
        const err = new Error('Upload failed via fetch');
        (err as any).status = fetchResponse.status;
        (err as any).body = parsedData;
        throw err;
      }

      // unwrap possible envelope
      const newFile = parsedData?.data ?? parsedData?.attachment ?? parsedData;
      if (newFile) {
        setFiles((prev) => {
          if (!newFile?.id) return [newFile, ...prev];
          if (prev.some((p) => String(p.id) === String(newFile.id))) return prev;
          return [newFile, ...prev];
        });
        return newFile;
      }
      return null;

    } catch (err: any) {
      console.log('[useFileRealtime] ❌ CÓ LỖI XẢY RA TRONG CATCH!!!');
      if (err.response) {
        console.log('❌ Lỗi từ Backend:', err.response.data);
        console.log('❌ Status Code:', err.response.status);
      } else {
        console.log('❌ Lỗi Network/Client:', err.message);
      }
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [classId]);

  // 4. XÓA FILE
  const deleteFile = useCallback(async (attachmentId: string) => {
    if (!attachmentId) return false;
    try {
      console.log('[useFileRealtime] 🔥 deleteFile called:', attachmentId);
      await axiosClient.delete(`/attachments/${attachmentId}`);
      // Optimistically remove from state
      setFiles((prev) => prev.filter((f) => String(f.id) !== String(attachmentId)));
      console.log('[useFileRealtime] ✅ deleteFile success:', attachmentId);
      return true;
    } catch (err: any) {
      console.error('[useFileRealtime] ❌ deleteFile error:', err?.response?.data ?? err?.message ?? err);
      return false;
    }
  }, []);

  return { files, loading, isUploading, fetchFiles, uploadFile, deleteFile };
}