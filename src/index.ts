// Components
export { ChatModal } from './components/ChatModal';

// Context and Providers
export { ChatProvider, useChat } from './contexts/ChatContext';

// Hooks
export { useChatModal } from './hooks/useChatModal';

// Types
export type { 
  ChatUser, 
  ChatCommunity, 
  ChatModalProps, 
  ChatContextType 
} from './types';

// Utils (in case consumers need them)
export { cn } from './utils/cn';