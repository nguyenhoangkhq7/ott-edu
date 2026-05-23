import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/modules/api';
import { useSocket, useSocketListener } from './useSocket';
import type { PostAttachment } from './usePostRealtime';

/**
 * Data Types & Interfaces
 */
export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
  attachments: PostAttachment[];
  reactionCount: number;
  replyToCommentId?: string | null;
  userReaction?: string | null;
}

export interface CreateCommentPayload {
  postId: string;
  content: string;
  replyToCommentId?: string | null;
}

export interface EditCommentPayload {
  content: string;
}

/**
 * Hook: useCommentRealtime
 * Manages fetching, creating, editing, and deleting comments for a specific post
 * with real-time socket updates
 */
export function useCommentRealtime(postId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socket = useSocket();

  /**
   * Fetch all comments for a specific post from API
   */
  const fetchComments = useCallback(async () => {
    if (!postId) {
      setError('Post ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<Comment[]>(
        `/interact/comments/post/${postId}`
      );
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch comments';
      setError(errorMessage);
      console.error('[useCommentRealtime] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  /**
   * Fetch comments on component mount and when postId changes
   */
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  /**
   * Listen for real-time comment updates via socket
   */
  /**
   * Listen for real-time comment updates via socket
   */
  useSocketListener(
    socket,
    'comment_updated',
    (data: { postId?: string; action?: string; id?: string; comment?: Comment }) => {
      console.log('[useCommentRealtime] comment_updated event:', data);

      if (data.postId === postId) {
        if (data.action === 'created') {
          if (data.comment) {
            const newComment = data.comment; // Lưu ra biến local để TS không báo lỗi
            setComments((prev) => {
              const exists = prev.find((c) => c.id === newComment.id);
              if (exists) {
                return prev.map((c) =>
                  c.id === newComment.id
                    ? {
                        ...c,
                        ...newComment,
                        attachments: (newComment.attachments && newComment.attachments.length > 0)
                          ? newComment.attachments
                          : c.attachments
                      }
                    : c
                );
              }
              return [newComment as Comment, ...prev];
            });
          } else {
            fetchComments().catch(console.error);
          }
        } else if (data.action === 'updated' && data.id) {
          if (data.comment) {
            const updatedComment = data.comment; // Lưu ra biến local để TS không báo lỗi
            setComments((prev) =>
              prev.map((c) =>
                c.id === data.id
                  ? {
                      ...c,
                      ...updatedComment,
                      attachments: (updatedComment.attachments && updatedComment.attachments.length > 0)
                        ? updatedComment.attachments
                        : c.attachments
                    }
                  : c
              )
            );
          } else {
            fetchComments().catch(console.error);
          }
        } else if (data.action === 'deleted' && data.id) {
          setComments((prev) => prev.filter((c) => c.id !== data.id));
        }
      }
    }
  );

  /**
   * Create a new comment or reply
   */
  const createComment = useCallback(
    async (
      payload: CreateCommentPayload,
      files?: any[]
    ): Promise<Comment | null> => {
      try {
        const formData = new FormData();
        
        // 1. Ép chuỗi JSON cho payload
        formData.append('comment', JSON.stringify(payload));

        // 2. Format file đúng chuẩn React Native
        if (files && files.length > 0) {
          files.forEach((file, index) => {
            formData.append('files', {
              uri: file.uri,
              name: file.name || `file_${index}.jpg`,
              type: file.mimeType || file.type || 'application/octet-stream',
            } as any);
          });
        }

        // 3. Gửi Request
        const response: any = await apiClient.post(
          '/interact/comments',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }, 
          }
        );

        // 4. Lấy dữ liệu trả về từ server
        let newComment = response?.data ?? response;

        if (newComment) {
          // BÙ ĐẮP DỮ LIỆU LOCAL (TUYỆT CHIÊU HIỂN THỊ TỨC THÌ)
          // Nếu Backend trả về thiếu mảng attachments nhưng ta thực tế CÓ gửi file đi
          if ((!newComment.attachments || newComment.attachments.length === 0) && files && files.length > 0) {
            newComment.attachments = files.map((f, i) => ({
              id: `local_temp_${Date.now()}_${i}`,
              fileName: f.name || `file_${i}`,
              fileType: f.mimeType || f.type || 'image/jpeg',
              fileUrl: f.uri, // Dùng luôn đường dẫn ảnh gốc trên máy để hiện ra ngay lập tức
              size: f.size || 0
            }));
          }

          // Cập nhật State
          setComments((prev) => {
            const exists = prev.some((c) => c.id === newComment.id);
            if (exists) {
              // Cập nhật comment nếu đã tồn tại (giữ nguyên file local vừa chèn)
              return prev.map((c) => c.id === newComment.id ? { ...c, ...newComment } : c);
            }
            return [newComment, ...prev];
          });
        }

        return newComment;
      } catch (err) {
        console.error('[useCommentRealtime] Create error:', err);
        throw err;
      }
    },
    [] 
  );

  /**
   * Edit an existing comment
   */
  const editComment = useCallback(
    async (commentId: string, payload: EditCommentPayload): Promise<Comment | null> => {
      try {
        const response = await apiClient.update<Comment>(
          `/interact/comments/${commentId}`,
          payload
        );

        // Update local state optimistically
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, content: payload.content } : c
          )
        );

        return response as any;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to edit comment';
        console.error('[useCommentRealtime] Edit error:', err);
        throw new Error(errorMessage);
      }
    },
    []
  );

  /**
   * Delete a comment
   */
  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
    try {
      await apiClient.delete(`/interact/comments/${commentId}`);

      // Update local state immediately
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment';
      console.error('[useCommentRealtime] Delete error:', err);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Get only top-level comments (not replies to other comments)
   * Useful for displaying comment thread structure
   */
  const getTopLevelComments = useCallback((): Comment[] => {
    return comments.filter((c) => !c.replyToCommentId);
  }, [comments]);

  /**
   * Get replies to a specific comment
   */
  const getRepliesForComment = useCallback(
    (commentId: string): Comment[] => {
      return comments.filter((c) => c.replyToCommentId === commentId);
    },
    [comments]
  );

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
    editComment,
    deleteComment,
    getTopLevelComments,
    getRepliesForComment,
  };
}