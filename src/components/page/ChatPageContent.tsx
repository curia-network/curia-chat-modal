import React from 'react';
import { cn } from '../../utils/cn';

interface ChatPageContentProps {
  children: React.ReactNode;
  className?: string;
  theme?: 'light' | 'dark';
}

export function ChatPageContent({ 
  children, 
  className = "w-full h-full flex flex-col",
  theme
}: ChatPageContentProps) {
  return (
    <div 
      className={cn(
        // Base fullpage styling - no shadows, borders, or modal-specific styling
        "bg-background overscroll-contain focus:outline-none",
        theme === 'dark' ? 'dark' : '',
        className
      )}
      role="main"
      aria-label="Chat Page"
    >
      {children}
    </div>
  );
}