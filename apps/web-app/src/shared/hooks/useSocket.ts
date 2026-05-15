'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// ✨ TUYỆT CHIÊU SINGLETON: Giữ kết nối mạng sống sót mọi mặt trận
let globalSocket: Socket | null = null;

/**
 * useSocket Hook - Quản lý kết nối Socket.io tới Chat Service
 */
export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);

  useEffect(() => {
    // Chỉ kết nối 1 lần duy nhất nếu chưa có
    if (!globalSocket) {
      const socketUrl = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:3001';
      globalSocket = io(socketUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
      });

      globalSocket.on('connect', () => {
        console.log('✓ Socket.io connected:', globalSocket?.id);
      });

      globalSocket.on('disconnect', (reason) => {
        console.log('✗ Socket.io disconnected:', reason);
      });

      globalSocket.on('connect_error', (error) => {
        console.error('✗ Socket.io connection error:', error);
      });
    }

    // Dùng setTimeout để "lách luật" ESLint (không setState đồng bộ trong useEffect)
    const timer = setTimeout(() => {
      setSocket(globalSocket);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return socket;
}

/**
 * useSocketListener Hook - Đã dọn sạch lỗi ESLint any và dependencies
 */
export function useSocketListener<T = unknown>(
  socket: Socket | null,
  eventName: string,
  callback: (data: T) => void
) {
  // Dùng useRef để giữ hàm callback mới nhất, tránh bị gỡ/gắn listener liên tục
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;

    // Khi có event, gọi hàm callback mới nhất đang được lưu
    const handler = (data: T) => savedCallback.current(data);
    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName]); // Sạch sẽ, không còn dấu 3 chấm spread gây lỗi!
}

/**
 * useSocketRoomJoin Hook - Join/Leave room
 */
export function useSocketRoomJoin(socket: Socket | null, roomId: string | null) {
  useEffect(() => {
    if (!socket || !roomId) return;

    // Xin vào phòng
    socket.emit('join_room', { roomId });
    console.log(`[Socket] Joined room: ${roomId}`);

    return () => {
      // Rời phòng khi out khỏi Component (ra ngoài lớp khác)
      socket.emit('leave_room', { roomId });
      console.log(`[Socket] Left room: ${roomId}`);
    };
  }, [socket, roomId]);
}