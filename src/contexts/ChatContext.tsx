'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ChatContextType {
  isChatOpen: boolean;
  selectedChannelId: number | null; // Which channel to show
  openChat: (channelId?: number) => void; // Optional channel selection
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

  const openChat = useCallback((channelId?: number) => {
    setSelectedChannelId(channelId || null); // null = use default channel
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    // Keep selectedChannelId for potential re-opening
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        selectedChannelId,
        openChat,
        closeChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}