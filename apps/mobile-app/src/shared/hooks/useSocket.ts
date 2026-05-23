import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

// Global singleton to maintain single socket connection across app lifecycle
let globalSocket: Socket | null = null;

/**
 * Determines the Chat Service URL for socket connection
 */
function getChatServiceUrl(): string {
  const ENV_CHAT_SERVICE_URL = process.env.EXPO_PUBLIC_CHAT_SERVICE_URL;
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localHost = debuggerHost?.split(':')?.[0];

  if (ENV_CHAT_SERVICE_URL) {
    return ENV_CHAT_SERVICE_URL.replace(/\/$/, '');
  }

  if (localHost) {
    return `http://${localHost}:3001`;
  }

  return 'http://localhost:3001';
}

/**
 * useSocket Hook - Manages Socket.io connection for real-time updates
 * Returns a singleton socket instance that persists across component mounts
 */
export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);

  useEffect(() => {
    // Initialize socket only once
    if (!globalSocket) {
      const socketUrl = getChatServiceUrl();
      
      globalSocket = io(socketUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
      });

      globalSocket.on('connect', () => {
        console.log('[Socket] Connected:', globalSocket?.id);
      });

      globalSocket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });

      globalSocket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error);
      });
    }

    // Defer state update to avoid synchronous setState warning
    const timer = setTimeout(() => {
      setSocket(globalSocket);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return socket;
}

/**
 * useSocketListener Hook - Registers event listener on socket
 * Automatically handles cleanup and uses latest callback reference
 */
export function useSocketListener<T = unknown>(
  socket: Socket | null,
  eventName: string,
  callback: (data: T) => void
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: T) => savedCallback.current(data);
    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName]);
}

/**
 * useSocketRoomJoin Hook - Joins/leaves socket room when component mounts/unmounts
 * Useful for receiving room-specific real-time updates
 */
export function useSocketRoomJoin(socket: Socket | null, roomId: string | null): void {
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('join_room', { roomId });
    console.log(`[Socket] Joined room: ${roomId}`);

    return () => {
      socket.emit('leave_room', { roomId });
      console.log(`[Socket] Left room: ${roomId}`);
    };
  }, [socket, roomId]);
}
