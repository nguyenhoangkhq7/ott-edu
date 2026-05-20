import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  SOCKET_SERVER_URL,
  SOCKET_IO_CONFIG,
  SOCKET_EVENTS,
} from "../constants/socket.config";

/**
 * 🔌 Socket Singleton Instance
 * Lưu giữ 1 kết nối duy nhất cho toàn bộ ứng dụng
 * Tiết kiệm pin và tránh lag
 */
let socketInstance: Socket | null = null;

/**
 * Hook để kết nối Socket.IO với header xác thực
 * ✅ Singleton pattern: Chỉ tạo 1 connection
 * ✅ Auto-reconnect khi mất mạng
 * ✅ Header: x-user-id, x-user-email
 */
export const useSocket = (userId: string | null, userEmail: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const isInitializingRef = useRef(false);

  /**
   * Khởi tạo hoặc lấy Socket instance hiện tại
   */
  const initializeSocket = useCallback(async () => {
    // Nếu đã có instance và đã connect, trả về ngay
    if (socketInstance && socketInstance.connected) {
      socketRef.current = socketInstance;
      return socketInstance;
    }

    // Nếu đang khởi tạo, đợi
    if (isInitializingRef.current) {
      return socketInstance;
    }

    // Bắt đầu khởi tạo
    isInitializingRef.current = true;

    try {
      // Tạo Socket với auth headers
      socketInstance = io(
        SOCKET_SERVER_URL as string,
        {
          ...SOCKET_IO_CONFIG,
          auth: {
            "x-user-id": userId || "",
            "x-user-email": userEmail || "",
          },
          extraHeaders: {
            "x-user-id": userId || "",
            "x-user-email": userEmail || "",
          },
        } as any,
      ); // Thêm chữ 'as any' ở cuối để đè mọi cảnh báo thừa của Socket.io config

      // Connection event handlers
      socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
        console.log("✅ Socket connected:", socketInstance?.id);
      });

      socketInstance.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.log("❌ Socket disconnected:", reason);
      });

      socketInstance.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
        console.error("🔴 Socket connection error:", error);
      });

      socketRef.current = socketInstance;
      await new Promise<void>((resolve) => {
        socketInstance?.once(SOCKET_EVENTS.CONNECT, () => {
          resolve();
        });
        socketInstance?.connect();
      });

      return socketInstance;
    } catch (error) {
      console.error("❌ Failed to initialize socket:", error);
      isInitializingRef.current = false;
      throw error;
    } finally {
      isInitializingRef.current = false;
    }
  }, [userId, userEmail]);

  /**
   * Connect socket khi userId và userEmail thay đổi
   */
  useEffect(() => {
    if (!userId || !userEmail) {
      return;
    }

    // Disconnect and recreate if credentials changed
    if (socketInstance && socketInstance.connected) {
      const currentAuth = socketInstance.auth as any;
      if (
        currentAuth?.["x-user-id"] !== userId ||
        currentAuth?.["x-user-email"] !== userEmail
      ) {
        socketInstance.disconnect();
        socketInstance = null;
      }
    }

    initializeSocket().catch(console.error);

    return () => {
      // Optional: disconnect on unmount (comment out để keep connection)
      // if (socketInstance) {
      //   socketInstance.disconnect();
      //   socketInstance = null;
      // }
    };
  }, [userId, userEmail, initializeSocket]);

  /**
   * Hàm helper để emit event
   */
  const emit = useCallback(
    (eventName: string, data?: any, callback?: (ack: any) => void) => {
      if (socketInstance && socketInstance.connected) {
        socketInstance.emit(eventName, data, callback);
      } else {
        console.warn("⚠️ Socket not connected, cannot emit:", eventName);
      }
    },
    [],
  );

  /**
   * Hàm helper để lắng nghe event
   */
  const on = useCallback(
    (eventName: string, listener: (...args: any[]) => void) => {
      if (!socketInstance) {
        console.warn("⚠️ Socket not initialized yet");
        return;
      }
      socketInstance.on(eventName, listener);

      // Return cleanup function
      return () => {
        socketInstance?.off(eventName, listener);
      };
    },
    [],
  );

  /**
   * Hàm helper để lắng nghe event một lần
   */
  const once = useCallback(
    (eventName: string, listener: (...args: any[]) => void) => {
      if (!socketInstance) {
        console.warn("⚠️ Socket not initialized yet");
        return;
      }
      socketInstance.once(eventName, listener);
    },
    [],
  );

  /**
   * Hàm helper để dừng lắng nghe event
   */
  const off = useCallback(
    (eventName: string, listener?: (...args: any[]) => void) => {
      if (!socketInstance) {
        return;
      }
      socketInstance.off(eventName, listener);
    },
    [],
  );

  /**
   * Join room cho group chat
   */
  const joinRoom = useCallback((roomId: string) => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });
      console.log("✅ Joined room:", roomId);
    } else {
      console.warn("⚠️ Cannot join room, socket not connected");
    }
  }, []);

  /**
   * Leave room khỏi group chat
   */
  const leaveRoom = useCallback((roomId: string) => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
      console.log("✅ Left room:", roomId);
    }
  }, []);

  /**
   * Get socket instance (nếu cần)
   */
  const getSocket = useCallback(() => {
    return socketInstance;
  }, []);

  /**
   * Check connection status
   */
  const isConnected = useCallback(() => {
    return socketInstance?.connected ?? false;
  }, []);

  return {
    socket: socketRef.current,
    emit,
    on,
    once,
    off,
    joinRoom,
    leaveRoom,
    getSocket,
    isConnected,
  };
};

/**
 * Export Singleton getter (trong trường hợp cần direct access)
 */
export const getSocketInstance = (): Socket | null => {
  return socketInstance;
};

/**
 * Export Singleton reset (for logout)
 */
export const resetSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
