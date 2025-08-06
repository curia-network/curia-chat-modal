'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader } from 'lucide-react';
import { cn } from '../utils/cn';
import { provisionIrcUser, buildLoungeUrl } from '../utils/api-client';
import type { ChatModalProps, ChatModalState } from '../types';
import styles from '../styles/ChatModal.module.css';

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
  mode = 'single', 
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
      nofocus: true,
      theme, // Pass theme prop through to IRC client
      mode // Pass mode prop through to IRC client
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
          // Responsive sizing via CSS module (no more Tailwind compilation issues!)
          styles.modalResponsive,
          isDesktop
            ? // Desktop: Animation and border radius
              "rounded-r-2xl animate-in slide-in-from-left-5 fade-in-0 duration-300"
            : // Mobile: Animation only
              "animate-in slide-in-from-bottom-4 fade-in-0 duration-300"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Chat modal"
        tabIndex={-1}
      >
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
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4 text-2xl">
                ⚠️
              </div>
              <h3 className="text-lg font-semibold mb-2 text-destructive">Chat unavailable</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {modalState.error || 'Failed to connect to chat. Please try again later.'}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Try again
              </button>
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
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}