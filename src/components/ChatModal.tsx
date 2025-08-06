'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Loader } from 'lucide-react';
import { cn } from '../utils/cn';
import { buildLoungeUrl } from '../utils/api-client';
import type { ChatModalProps } from '../types';
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
  ircCredentials, 
  channel,
  chatBaseUrl,
  theme = 'light',
  mode,
  onClose 
}: ChatModalProps) {
  const isDesktop = useIsDesktop();
  const [isLoading, setIsLoading] = useState(true);

  // NO MORE API CALLS! Use pre-provisioned data instantly
  const chatUrl = useMemo(() => {
    return buildLoungeUrl({
      baseUrl: chatBaseUrl || 'https://chat.curia.network', // Use prop or fallback
      ircUsername: ircCredentials.ircUsername,
      ircPassword: ircCredentials.ircPassword,
      networkName: ircCredentials.networkName,
      userNick: ircCredentials.ircUsername,
      channelName: channel.irc_channel_name, // Use proper IRC channel name
      nofocus: channel.settings?.irc?.nofocus ?? true,
      theme,
      mode: mode || (channel.is_single_mode ? 'single' : 'normal')
    });
  }, [ircCredentials, channel, chatBaseUrl, theme, mode]);

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

  // INSTANT load - no provisioning delay!
  return createPortal(
    <>
      {/* Backdrop */}
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
          styles.modalResponsive,
          isDesktop
            ? "rounded-r-2xl animate-in slide-in-from-left-5 fade-in-0 duration-300"
            : "animate-in slide-in-from-bottom-4 fade-in-0 duration-300"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={`Chat: ${channel.name}`}
        tabIndex={-1}
      >
        {/* Chat Content Area */}
        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          )}
          <iframe
            src={chatUrl}
            className="w-full h-full border-0"
            title={`Chat: ${channel.name}`}
            allow="camera; microphone; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            onLoad={() => setIsLoading(false)}
            onError={(e) => {
              console.error('[ChatModal] Iframe load error:', e);
              setIsLoading(false);
            }}
            style={{ display: isLoading ? 'none' : 'block' }}
          />
        </div>
      </div>
    </>,
    document.body
  );
}