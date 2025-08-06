'use client';

import React from 'react';
import { cn } from '../../utils/cn';

interface ChatLayoutProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  className?: string;
}

export function ChatLayout({ 
  children, 
  theme,
  className = "h-screen w-full overflow-hidden"
}: ChatLayoutProps) {
  return (
    <div 
      className={cn(
        // Clean, full-viewport layout with negative margins to counteract MainLayoutWithSidebar padding
        // MainLayoutWithSidebar uses: p-4 md:p-6 lg:p-8
        // So we use: -m-4 md:-m-6 lg:-m-8 to counteract it
        "bg-background -m-4 md:-m-6 lg:-m-8",
        theme === 'dark' ? 'dark' : '',
        className
      )}
      data-chat-layout="true"
    >
      {children}
    </div>
  );
}