'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Loader } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { provisionIrcUser, buildLoungeUrl } from '../utils/api-client';
import type { ChatModalProps, ChatModalState } from '../types';

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
  curiaBaseUrl,
  authToken,
  onClose 
}: ChatModalProps) {
  const isDesktop = useIsDesktop();
  const [modalState, setModalState] = useState<ChatModalState>({ status: 'loading' });
  const isProvisioningRef = useRef(false);

  // Provision IRC user and construct The Lounge URL
  useEffect(() => {
    const setupIrcUser = async () => {
      try {
        // Prevent duplicate API calls in React Strict Mode
        if (isProvisioningRef.current) {
          console.log('[ChatModal] Already provisioning, skipping...');
          return;
        }
        isProvisioningRef.current = true;
        
        setModalState({ status: 'loading' });

        // Call our IRC provisioning endpoint  
        const credentials = await provisionIrcUser(chatBaseUrl, authToken, curiaBaseUrl);

        console.log('[ChatModal] IRC user provisioned successfully');
        setModalState({ 
          status: 'ready', 
          credentials 
        });

      } catch (error) {
        console.error('[ChatModal] Setup error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to setup IRC user';
        setModalState({ 
          status: 'error', 
          error: errorMessage 
        });
      } finally {
        isProvisioningRef.current = false;
      }
    };

    setupIrcUser();
  }, []);

  const getChatUrl = () => {
    if (modalState.status !== 'ready' || !modalState.credentials) {
      return null;
    }

    const baseUrl = chatBaseUrl || 'https://chat.curia.network';
    
    // Create a safe channel name from community name
    const channelName = community.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // 🚀 DYNAMIC AUTO-LOGIN: Using provisioned IRC credentials
    return buildLoungeUrl({
      baseUrl,
      ircUsername: modalState.credentials.ircUsername,
      ircPassword: modalState.credentials.ircPassword,
      networkName: modalState.credentials.networkName,
      userNick: modalState.credentials.ircUsername, // Use ircUsername for nick consistency
      channelName,
      nofocus: true
    });
  };

  // Cache the chat URL to prevent multiple buildLoungeUrl calls
  const chatUrl = getChatUrl();

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

        {/* Chat Content Area - Dynamic based on modal state */}
        <div className="flex-1 overflow-hidden">
          {modalState.status === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Loader className="w-8 h-8 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Setting up your chat...</h3>
              <p className="text-sm text-muted-foreground">
                Connecting you to {community.name} chat room
              </p>
            </div>
          )}

          {modalState.status === 'error' && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                <X size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-destructive">Chat unavailable</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {modalState.error || 'Failed to connect to chat. Please try again later.'}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="default" 
                size="sm"
              >
                Try again
              </Button>
            </div>
          )}

          {modalState.status === 'ready' && chatUrl && (
            <iframe
              src={chatUrl}
              className="w-full h-full border-0"
              title={`Chat for ${community.name}`}
              allow="camera; microphone; fullscreen"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              onLoad={() => console.log('[ChatModal] Iframe loaded successfully')}
              onError={(e) => console.error('[ChatModal] Iframe load error:', e)}
            />
          )}

          {modalState.status === 'ready' && !chatUrl && (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-destructive">⚠️ Chat URL Generation Failed</h3>
                <p className="text-muted-foreground">
                  Unable to construct The Lounge URL. Please try again or contact support.
                </p>
                <Button onClick={() => window.location.reload()} variant="default">
                  Refresh Page
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}