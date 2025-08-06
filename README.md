# Curia Chat Modal

A React package for embedding The Lounge IRC client in a responsive modal interface with session-aware architecture.

## Overview

This package provides a **session-aware chat modal system** designed for integration with IRC-based chat systems. It requires the parent application to handle IRC provisioning, channel management, and session state, while the modal focuses purely on UI presentation.

## Architecture

### Session-Aware Pattern

The chat modal uses a **two-phase initialization pattern**:

1. **Session Initialization (Parent App)**: IRC provisioning + channel fetching happens once per user session
2. **Modal Invocation (This Package)**: Pre-provisioned data is passed as props for instant display

This eliminates the 2-3 second delay on each modal open while providing better error handling and retry capabilities.

## Installation

```bash
yarn add @curia_/curia-chat-modal
```

## Integration Guide

### 1. Parent App Setup

#### A. Install Dependencies

```bash
yarn add sonner  # For toast notifications
```

#### B. IRC Provisioning API

Create an IRC user provisioning endpoint in your app:

```typescript
// /api/irc-user-provision
export async function POST(req: NextRequest) {
  const user = req.user; // From your auth middleware
  
  try {
    // Generate IRC credentials
    const ircUsername = generateIrcUsername(user.name, user.id);
    const ircPassword = generateSecurePassword();
    
    // Provision user in your IRC bouncer (e.g., Soju)
    await sojuAdminService.provisionUser({
      ircUsername,
      ircPassword,
      nickname: generateIrcNickname(user.name),
      realname: user.name || ircUsername
    });

    return NextResponse.json({
      success: true,
      ircUsername,
      ircPassword,
      networkName: 'your-network-name'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### C. Chat Channels API

Create a chat channels endpoint:

```typescript
// /api/communities/[communityId]/chat-channels
export async function GET(req: AuthenticatedRequest, context: RouteContext) {
  const { communityId } = await context.params;
  
  try {
    // Get channels from database
    let channels = await ChatChannelQueries.getChannelsByCommunity(communityId);
    
    // AUTO-CREATE DEFAULT CHANNEL if none exist
    if (channels.length === 0) {
      const communityResult = await query(
        'SELECT name FROM communities WHERE id = $1',
        [communityId]
      );
      
      const communityName = communityResult.rows[0]?.name;
      
      const defaultChannel = await ChatChannelQueries.createChannel({
        community_id: communityId,
        name: communityName,
        description: `Main chat for ${communityName}`,
        irc_channel_name: generateIrcChannelName(communityName),
        is_single_mode: true,
        is_default: true,
        settings: {
          irc: { autoconnect: true, lockchannel: true, nofocus: true },
          ui: { defaultTheme: 'auto', allowThemeSwitch: true }
        }
      });
      
      channels = [defaultChannel];
    }
    
    return NextResponse.json(channels);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}
```

#### D. Chat Session Hook

Create a session management hook in your app:

```typescript
// hooks/useChatSession.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export function useChatSession() {
  const { user, token } = useAuth();
  const [sessionData, setSessionData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Retry logic with exponential backoff (3 attempts total)
  const initializeSessionWithRetry = useCallback(async (attemptNumber = 1) => {
    try {
      setIsLoading(attemptNumber === 1);
      setIsRetrying(attemptNumber > 1);
      setRetryCount(attemptNumber);
      setInitError(null);
      
      // 1. Provision IRC credentials
      const ircCredentials = await provisionIrcUser(
        token,
        process.env.NEXT_PUBLIC_CHAT_BASE_URL || '',
        process.env.NEXT_PUBLIC_CURIA_BASE_URL || ''
      );
      
      // 2. Fetch available channels
      const channels = await authFetchJson(
        `/api/communities/${user.cid}/chat-channels`,
        { token }
      );
      
      // 3. Identify default channel
      const defaultChannel = channels.find(ch => ch.is_default) || channels[0];
      
      if (!defaultChannel) {
        throw new Error('No chat channels available for community');
      }

      setSessionData({ ircCredentials, channels, defaultChannel });
      setIsInitialized(true);
      
      // Success toast
      toast.success("Chat connected! 💬");
      
    } catch (error) {
      if (attemptNumber < 3) {
        // Retry with exponential backoff: 1s, 2s delays
        const delay = Math.pow(2, attemptNumber - 1) * 1000;
        setTimeout(() => initializeSessionWithRetry(attemptNumber + 1), delay);
      } else {
        // Final failure
        setInitError(error.message);
        setIsInitialized(false);
        toast.error("Chat connection failed. Please refresh the page to retry.", {
          duration: 10000,
        });
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [user?.cid, token]);

  useEffect(() => {
    if (user && token && user.cid) {
      initializeSessionWithRetry(1);
    }
  }, [user?.userId, user?.cid, user, token, initializeSessionWithRetry]);

  const retryInitialization = useCallback(() => {
    setRetryCount(0);
    setInitError(null);
    setIsRetrying(false);
    setIsInitialized(false);
    setSessionData(null);
    
    if (user && token && user.cid) {
      initializeSessionWithRetry(1);
    }
  }, [user, token, initializeSessionWithRetry]);

  return {
    sessionData,
    isInitialized,
    isLoading,
    initError,
    retryCount,
    isRetrying,
    retryInitialization,
    getChannelById: (channelId) => sessionData?.channels.find(ch => ch.id === channelId)
  };
}
```

#### E. Chat Modal Wrapper

Create a wrapper component that handles all states:

```typescript
// components/ChatModalWrapper.tsx
import React from 'react';
import { ChatModal, useChatModal } from '@curia_/curia-chat-modal';
import { useChatSession } from '@/hooks/useChatSession';
import { ChatLoadingModal } from '@/components/chat/ChatLoadingModal';
import { ChatErrorModal } from '@/components/chat/ChatErrorModal';

export function ChatModalWrapper() {
  const { isChatOpen, selectedChannelId, closeChat } = useChatModal();
  const { 
    sessionData, 
    isInitialized, 
    isLoading, 
    initError, 
    retryCount, 
    isRetrying, 
    retryInitialization 
  } = useChatSession();
  const theme = useEffectiveTheme();
  
  if (!isChatOpen) return null;

  // Show loading during initialization/retries
  if (isLoading || isRetrying) {
    const message = isRetrying 
      ? `Retrying connection (${retryCount}/3)...`
      : "Connecting to chat...";
    
    return <ChatLoadingModal message={message} onClose={closeChat} />;
  }

  // Show error after all retries failed
  if (initError && !isRetrying && retryCount >= 3) {
    return (
      <ChatErrorModal 
        error={initError}
        retryCount={retryCount}
        onRetry={retryInitialization}
        onClose={closeChat}
      />
    );
  }

  if (!isInitialized || !sessionData) return null;

  // Determine target channel
  const targetChannel = selectedChannelId 
    ? sessionData.channels.find(ch => ch.id === selectedChannelId)
    : sessionData.defaultChannel;

  if (!targetChannel) {
    return (
      <ChatErrorModal 
        error="Selected chat channel not found."
        onRetry={() => closeChat()}
        onClose={closeChat}
      />
    );
  }

  return (
    <ChatModal
      ircCredentials={sessionData.ircCredentials}
      channel={targetChannel}
      chatBaseUrl={process.env.NEXT_PUBLIC_CHAT_BASE_URL}
      theme={theme}
      mode={targetChannel.is_single_mode ? 'single' : 'normal'}
      onClose={closeChat}
    />
  );
}
```

### 2. Sidebar Action Listener (Optional)

For parent app integration (e.g., iframe communication):

```typescript
// components/SidebarActionListener.tsx
'use client';

import { useEffect } from 'react';
import { useChatModal } from '@curia_/curia-chat-modal';

export function SidebarActionListener() {
  const { openChat, closeChat } = useChatModal();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'sidebar_action') {
        const { action, data } = event.data;
        
        if (action === 'messages') {
          console.log('[SidebarActionListener] Opening chat modal');
          openChat(data?.channelId); // Optional channel selection
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [openChat, closeChat]);

  return null; // This component only listens for events
}
```

### 3. App Integration

```typescript
// app/layout.tsx or app/providers.tsx
import { ChatProvider } from '@curia_/curia-chat-modal';
import { ChatModalWrapper } from '@/components/ChatModalWrapper';
import { SidebarActionListener } from '@/components/SidebarActionListener';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ChatProvider>
          {/* Your app content */}
          {children}
          
          {/* Chat integration components */}
          <SidebarActionListener />
          <ChatModalWrapper />
        </ChatProvider>
      </body>
    </html>
  );
}
```

## API Reference

### ChatModal Props

```typescript
interface ChatModalProps {
  ircCredentials: IrcCredentials;     // Pre-provisioned IRC credentials
  channel: ApiChatChannel;            // Pre-selected channel data
  chatBaseUrl?: string;               // Base URL for The Lounge IRC client
  theme?: 'light' | 'dark';          // Current app theme
  mode?: 'single' | 'normal';        // Channel display mode
  onClose: () => void;                // Close handler
}

interface IrcCredentials {
  success: boolean;
  ircUsername: string;
  ircPassword: string;
  networkName: string;
}

interface ApiChatChannel {
  id: number;
  community_id: string;
  name: string;
  description: string | null;
  irc_channel_name: string;
  is_single_mode: boolean;
  is_default: boolean;
  settings: ChatChannelSettings;
  created_at: string;
  updated_at: string;
}
```

### Context API

```typescript
// Chat context for modal state management
interface ChatContextType {
  isChatOpen: boolean;
  selectedChannelId: number | null;
  openChat: (channelId?: number) => void;
  closeChat: () => void;
}

// Usage
const { isChatOpen, openChat, closeChat } = useChatModal();
```

## Environment Variables

```bash
# Required for local development
NEXT_PUBLIC_CHAT_BASE_URL=http://localhost:9000
NEXT_PUBLIC_CURIA_BASE_URL=http://localhost:3000
```

## Features

- 📱 **Responsive Design**: Desktop sidebar (25rem width), mobile full-screen
- 🔄 **Retry Logic**: 3 attempts with exponential backoff (1s, 2s delays)
- 🎨 **Theme Support**: Light/dark mode with CSS custom properties
- ⌨️ **Keyboard Navigation**: ESC to close, proper focus management
- 🔒 **Secure Iframe**: Sandboxed with necessary permissions
- 🌐 **Configurable URLs**: Support for local development and production
- 👥 **Multi-Channel**: Channel selection and single-channel mode
- 🎯 **Session-Aware**: Pre-provisioned credentials for instant loading
- 📢 **Toast Notifications**: Success/failure feedback via Sonner
- 🔧 **Error Recovery**: Manual retry with comprehensive error handling

## IRC Stack Requirements

This package is designed to work with:

- **IRC Server**: Ergo IRCd or compatible
- **IRC Bouncer**: Soju with admin interface enabled
- **Web Client**: The Lounge with auto-login support
- **Backend API**: IRC user provisioning endpoint
- **Database**: Chat channels management system

## Migration from Legacy Patterns

If migrating from a direct API-calling chat modal:

1. **Move IRC provisioning** from modal to parent app session hook
2. **Implement channel management** API endpoints
3. **Add retry logic** with exponential backoff
4. **Update modal props** to accept pre-provisioned data
5. **Add error handling** modals and toast notifications
6. **Configure environment variables** for local development

This architecture provides better performance, reliability, and user experience compared to per-modal-open provisioning patterns.