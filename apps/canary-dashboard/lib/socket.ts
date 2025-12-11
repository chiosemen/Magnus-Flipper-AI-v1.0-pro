'use client';

import { useEffect, useRef, useState } from 'react';

export function useWebSocket() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/events`;
    
    const connect = () => {
      try {
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          console.log('WebSocket connected');
          setWs(socket);
        };

        socket.onclose = () => {
          console.log('WebSocket disconnected, reconnecting...');
          setWs(null);
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        return socket;
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        return null;
      }
    };

    const socket = connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return ws;
}
