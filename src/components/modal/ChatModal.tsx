'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { ChatCore } from '../core/ChatCore';
import { ChatBackdrop } from './ChatBackdrop';
import type { ChatModalProps } from '../../types';
import styles from '../../styles/ChatModal.module.css';

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768); // Tailwind's 'md' breakpoint
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

  // Modal content structure
  const modalContent = (
    <>
      {/* Backdrop */}
      <ChatBackdrop onClose={onClose} />
      
      {/* Modal Container */}
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
        {/* Chat Content using ChatCore */}
        <div className="flex-1 overflow-hidden">
          <ChatCore
            ircCredentials={ircCredentials}
            channel={channel}
            chatBaseUrl={chatBaseUrl}
            theme={theme}
            mode={mode}
            className="w-full h-full"
            onClose={onClose}
          />
        </div>
      </div>
    </>
  );

  // Always use portal for modal
  return createPortal(modalContent, document.body);
}