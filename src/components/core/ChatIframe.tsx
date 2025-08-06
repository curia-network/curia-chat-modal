import React, { useState } from 'react';

interface ChatIframeProps {
  src: string;
  title: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export function ChatIframe({ 
  src, 
  title, 
  className = "w-full h-full border-0",
  onLoad,
  onError 
}: ChatIframeProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    console.error('[ChatIframe] Load error:', e);
    setIsLoading(false);
    onError?.('Failed to load chat');
  };

  return (
    <>
      <iframe
        src={src}
        className={className}
        title={title}
        allow="camera; microphone; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </>
  );
}