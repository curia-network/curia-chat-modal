# Curia Chat Modal

A React package for embedding The Lounge IRC client in a responsive modal interface.

## Installation

```bash
yarn add file:../curia-chat-modal
```

## Usage

```typescript
import { ChatProvider, ChatModal, useChatModal } from 'curia-chat-modal';

// Wrap your app with ChatProvider
function App() {
  return (
    <ChatProvider>
      <YourApp />
    </ChatProvider>
  );
}

// Use in your components
function YourComponent() {
  const { isChatOpen, openChat, closeChat } = useChatModal();
  
  const user = { id: 'user123', name: 'John Doe' };
  const community = { id: 'comm456', name: 'General Discussion' };

  return (
    <>
      <button onClick={openChat}>Open Chat</button>
      
      {isChatOpen && (
        <ChatModal
          user={user}
          community={community}
          theme="light"
          onClose={closeChat}
        />
      )}
    </>
  );
}
```

## Props

### ChatModal

- `user: { id: string; name: string }` - User information
- `community: { id: string; name: string }` - Community information  
- `theme?: 'light' | 'dark'` - Theme mode (optional)
- `chatBaseUrl?: string` - Base URL for The Lounge (optional, defaults to https://chat.curia.network)
- `onClose: () => void` - Close handler

## Environment Variables

The parent application should pass the chat URL via props:

```typescript
// In your app
const chatBaseUrl = process.env.NEXT_PUBLIC_CHAT_BASE_URL || 'https://chat.curia.network';

<ChatModal
  user={user}
  community={community}
  chatBaseUrl={chatBaseUrl}
  onClose={closeChat}
/>
```

## Features

- 📱 Responsive design (desktop sidebar, mobile drawer)
- 🎨 Theme support (light/dark)
- ⌨️ Keyboard navigation (ESC to close)
- 🔒 Secure iframe with sandbox
- 🌐 Configurable IRC server URL
- 👥 Community-specific channels