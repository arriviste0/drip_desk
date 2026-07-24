import { useEffect, useRef } from 'react';

export function useSSE(url: string, onMessage: (data: unknown) => void) {
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url) return;
    sourceRef.current = new EventSource(url);
    sourceRef.current.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {}
    };
    return () => {
      sourceRef.current?.close();
    };
  }, [url]);
}
