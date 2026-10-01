import React, { useEffect, useRef } from 'react';

interface LiveRenderPreviewProps {
  visible: boolean;
  onReadyChange: (ready: boolean) => void;
  onIframeMount?: (el: HTMLIFrameElement | null) => void;
}

export const LiveRenderPreview: React.FC<LiveRenderPreviewProps> = ({ visible, onReadyChange, onIframeMount }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!event.data || event.data.type !== 'hats:ready') return;
      onReadyChange(true);
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onReadyChange]);

  function handleLoad() {
    try {
      const pathname = iframeRef.current?.contentWindow?.location.pathname;
      if (pathname !== undefined && !pathname.includes('/mock-frontend-bootstrap/')) {
        console.warn(`LiveRenderPreview: iframe loaded unexpected path "${pathname}", not the bootstrap page`);
      }
    } catch {
    }
  }

  return (
    <iframe
      ref={(el) => {
        iframeRef.current = el;
        onIframeMount?.(el);
      }}
      title="Live theme preview"
      src="./mock-frontend-bootstrap/index.html"
      style={{ display: visible ? 'block' : 'none', width: '100%', height: '100%', border: 'none' }}
      onLoad={handleLoad}
    />
  );
};

export function isLiveRenderPreviewAvailable(): boolean {
  return true;
}
