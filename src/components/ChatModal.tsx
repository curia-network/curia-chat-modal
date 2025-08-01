'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './Button';
import type { ChatModalProps } from '../types';

// Hook to detect desktop (reuse from GlobalSearchModal pattern)
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768 && !('ontouchstart' in window));
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isDesktop;
};

export function ChatModal({ 
  user, 
  community, 
  theme = 'light', 
  chatBaseUrl, 
  onClose 
}: ChatModalProps) {
  const isDesktop = useIsDesktop();

  // Construct The Lounge URL with community-specific channel
  const getChatUrl = () => {
    const baseUrl = chatBaseUrl || 'https://chat.curia.network';
    
    // Create a safe channel name from community name
    const channelName = community.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const userNick = `${user.name.replace(/[^a-zA-Z0-9]/g, '')}${user.id.slice(-4)}`;
    
    return `${baseUrl}?autoconnect&nick=${userNick}&join=%23${channelName}&lockchannel&nofocus`;
  };

  // Body scroll lock and focus management when modal is open
  useEffect(() => {
    // Store original overflow style
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    // Lock scroll
    document.body.style.overflow = 'hidden';
    
    // Focus the modal container for screen readers
    const modalContainer = document.querySelector('[role="dialog"]');
    if (modalContainer instanceof HTMLElement) {
      modalContainer.focus();
    }
    
    // Cleanup function to restore scroll
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Keyboard handling (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <>
      {/* Backdrop - Same pattern as GlobalSearchModal */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        onWheel={(e) => e.preventDefault()}
      />
      
      {/* Modal Content - Responsive Design */}
      <div 
        className={cn(
          "fixed z-50 bg-background shadow-2xl border overscroll-contain flex flex-col focus:outline-none",
          theme === 'dark' ? 'dark' : '',
          isDesktop
            ? // Desktop: Left sidebar (384px = w-96)
              "left-0 top-0 bottom-0 w-96 rounded-r-2xl animate-in slide-in-from-left-5 fade-in-0 duration-300"
            : // Mobile: Bottom drawer
              "left-0 right-0 bottom-0 max-h-[80vh] rounded-t-2xl animate-in slide-in-from-bottom-4 fade-in-0 duration-300"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-primary/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageSquare size={18} />
              </div>
              <div>
                <h2 id="chat-title" className="text-lg font-semibold">Chat</h2>
                <p className="text-sm text-muted-foreground">#{community.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted rounded-full"
              aria-label="Close chat"
            >
              <X size={16} />
              <span className="sr-only">Close chat</span>
            </Button>
          </div>
        </div>

        {/* Chat Content Area - The Lounge iframe */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={getChatUrl()}
            className="w-full h-full border-0"
            title={`Chat for ${community.name}`}
            allow="camera; microphone; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>
    </>,
    document.body
  );
}