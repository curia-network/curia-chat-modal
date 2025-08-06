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
  ChatContextType,
  IrcCredentials,
  ApiChatChannel,
  ChatChannelSettings
} from './types';

// Utils (in case consumers need them)
export { cn } from './utils/cn';
export { buildLoungeUrl } from './utils/api-client';
// NOTE: provisionIrcUser moved to curia app for better architecture

// IRC Authentication Utilities
export { 
  generateIrcUsername, 
  generateIrcNickname,
  generateSecurePassword, 
  hashIrcPassword,
  verifyIrcPassword,
  type IrcProvisioningUtils 
} from './utils/irc-auth';