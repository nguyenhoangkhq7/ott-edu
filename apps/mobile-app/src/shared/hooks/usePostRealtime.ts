import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/modules/api";
import { useSocket, useSocketListener, useSocketRoomJoin } from "./useSocket";

/**
 * Data Types & Interfaces
 */
export interface PostAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  size: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
  attachments: PostAttachment[];
  reactionCount: number;
  commentCount: number;
  userReaction?: string | null;
}

export interface CreatePostPayload {
  classId: string;
  content: string;
  type?: string;
}

export interface EditPostPayload {
  content: string;
}

/**
 * Hook: usePostRealtime
 * Manages fetching, creating, editing, and deleting posts with real-time socket updates
 */
export function usePostRealtime(classId: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socket = useSocket();
  useSocketRoomJoin(socket, classId);

  /**
   * Fetch all posts for a class from API
   */
  const fetchPosts = useCallback(async () => {
    if (!classId) {
      setError('Class ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const responseData: any = await apiClient.get(`/posts/class/${classId}`);
      
      // Đồng bộ theo cách bóc vỏ bọc Envelope của Web
      const actualPosts = responseData?.data ? responseData.data : responseData;
      
      setPosts(Array.isArray(actualPosts) ? actualPosts : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch posts';
      setError(errorMessage);
      console.error('[usePostRealtime] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  /**
   * Fetch posts on component mount and when classId changes
   */
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /**
   * Listen for real-time post updates via socket
   */
  useSocketListener(
    socket,
    "post_updated",
    (data: { classId?: string; action?: string; id?: string; post?: Post }) => {
      console.log("[usePostRealtime] post_updated event:", data);

      if (data.classId && data.classId.toString() !== classId?.toString()) return;

      if (data.action === "created") {
        if (data.post) {
          setPosts((prev) => [data.post as Post, ...prev]);
        } else {
          fetchPosts().catch(console.error);
        }
      } else if (data.action === "updated" && data.id) {
        if (data.post) {
          setPosts((prev) =>
            prev.map((p) => (p.id === data.id ? { ...p, ...data.post } : p)),
          );
        } else {
          fetchPosts().catch(console.error);
        }
      } else if (data.action === "deleted" && data.id) {
        setPosts((prev) => prev.filter((p) => p.id !== data.id));
      }
    },
  );

  /**
   * ✅ FIXED createPost: Properly construct FormData for Spring Boot (React Native Compatible)
   * 
   * ISSUE FIXED:
   * - Old: formData.append('post', { string: JSON.stringify(...) }) ❌
   *   Problem: FormData doesn't support object with 'string' property
   *   Result: Spring got undefined instead of JSON string
   * 
   * - New: Append JSON string directly ✅
   *   Solution: React Native FormData accepts string values natively
   *   Result: Spring correctly receives JSON string in form part
   */
  const createPost = useCallback(
    async (payload: CreatePostPayload, files?: any[]): Promise<Post | null> => {
      try {
        const formData = new FormData();

        // 🔑 STEP 1: Construct JSON string
        const postData = {
          classId: payload.classId,
          content: payload.content,
          type: payload.type || 'DISCUSSION',
        };

        const postJsonString = JSON.stringify(postData);
        // Appending JSON string as a part named 'post'
        formData.append('post', postJsonString);

        // 🔑 STEP 2: Append files with correct structure for React Native
        if (files && files.length > 0) {
          files.forEach((file, index) => {
            // Kiểm tra kỹ cấu trúc file
            formData.append('files', {
              uri: file.uri,
              name: file.name || `file_${index}.jpg`,
              type: file.type || 'image/jpeg',
            } as any);
          });
        }

        // 🔑 STEP 3: Send Request
        // QUAN TRỌNG: Để trống Content-Type để Axios tự sinh 'boundary' chuẩn
        // Nếu ông ép Content-Type: 'multipart/form-data', Axios sẽ mất boundary -> LỖI 500
        const response = await apiClient.post('/posts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // Lưu ý: Nếu apiClient của ông dùng axios, đôi khi việc để headers trống 
          // và để FormData tự xử lý là cách an toàn nhất.
        });
        
        return (response as any)?.data ?? response;

      } catch (err: any) {
        console.error('\n❌ [createPost] ERROR:', err.response?.data || err.message);
        throw err;
      }
    },
    [],
  );
  /**
   * 🔍 Helper: Log FormData contents for debugging
   * Note: FormData entries are not directly enumerable in React Native
   * So we'll log what we know we appended
   */
  const logFormDataContents = (formData: FormData) => {
    console.log('[logFormDataContents] FormData object created');
    // React Native FormData doesn't expose entries(), so we can't inspect it directly
    // But the server RequestLoggingInterceptor will log everything
  };
 const editPost = useCallback(
    async (postId: string, payload: EditPostPayload): Promise<Post | null> => {
      try {
        console.log(`[editPost] Đang gửi PUT đến /posts/${postId} với payload:`, payload);

        // QUAN TRỌNG: Không dùng FormData, gửi thẳng payload object
        // Axios mặc định sẽ tự thêm header 'Content-Type: application/json'
        const response = await apiClient.update(`/posts/${postId}`, payload);

        const updatedPost = (response as any)?.data ?? response;
        
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, ...updatedPost } : p)),
        );

        return updatedPost;
      } catch (err: any) {
        // Log lỗi chi tiết từ Axios
        console.error('\n❌ [editPost] ERROR:', err.response?.data || err.message);
        throw err;
      }
    },
    [],
  );
  /**
   * Delete a post
   */
  const deletePost = useCallback(async (postId: string): Promise<void> => {
    try {
      await apiClient.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete post";
      console.error("[usePostRealtime] Delete error:", err);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    editPost,
    deletePost,
  };
}