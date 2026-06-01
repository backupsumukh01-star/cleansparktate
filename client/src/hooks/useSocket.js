import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../../../shared/constants.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function useSocket(enabled) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!enabled) return;

    const socket = io(SOCKET_URL || window.location.origin, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      console.error('Socket connection failed:', err.message);
      setConnected(false);
    });

    listenersRef.current.forEach((handler, event) => {
      socket.on(event, handler);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  const on = useCallback((event, handler) => {
    listenersRef.current.set(event, handler);
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
    return () => {
      listenersRef.current.delete(event);
      socketRef.current?.off(event, handler);
    };
  }, []);

  const emit = useCallback((event, data, callback) => {
    socketRef.current?.emit(event, data, callback);
  }, []);

  return { socket: socketRef.current, connected, on, emit, SOCKET_EVENTS };
}
