import React from 'react';

interface ChatBackdropProps {
  onClose: () => void;
  className?: string;
}

export function ChatBackdrop({ 
  onClose, 
  className = "fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200" 
}: ChatBackdropProps) {
  return (
    <div 
      className={className}
      onClick={onClose}
      onTouchMove={(e) => e.preventDefault()}
      onWheel={(e) => e.preventDefault()}
    />
  );
}