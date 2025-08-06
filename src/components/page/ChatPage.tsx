'use client';

import React from 'react';
import { ChatCore } from '../core/ChatCore';
import { ChatPageContent } from './ChatPageContent';
import type { IrcCredentials, ApiChatChannel } from '../../types';

interface ChatPageProps {
  ircCredentials: IrcCredentials;
  channel: ApiChatChannel;
  chatBaseUrl?: string;
  theme?: 'light' | 'dark';
  mode?: 'single' | 'normal';
  onClose: () => void;
}

export function ChatPage(props: ChatPageProps) {
  const { 
    ircCredentials, 
    channel, 
    chatBaseUrl, 
    theme = 'light', 
    mode, 
    onClose 
  } = props;

  return (
    <ChatPageContent theme={theme}>
      <ChatCore
        ircCredentials={ircCredentials}
        channel={channel}
        chatBaseUrl={chatBaseUrl}
        theme={theme}
        mode={mode}
        className="w-full h-full border-0 shadow-none rounded-none"
        onClose={onClose}
      />
    </ChatPageContent>
  );
}