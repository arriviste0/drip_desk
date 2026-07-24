import { useEffect, useRef } from 'react';

export function useWebSocket(url: string, onMessage: (data: unknown) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!url) return;
    wsRef.current = new WebSocket(url);
    wsRef.current.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {}
    };
    return () => {
      wsRef.current?.close();
    };
  }, [url]);

  const send = (data: unknown) => {
    wsRef.current?.send(JSON.stringify(data));
  };

  return { send };
}
