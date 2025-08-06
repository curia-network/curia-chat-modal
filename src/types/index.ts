export interface ChatUser {
  id: string;
  name: string;
}

export interface ChatCommunity {
  id: string;
  name: string;
}

export interface ChatModalProps {
  user: ChatUser;
  community: ChatCommunity;
  theme?: 'light' | 'dark';
  mode?: 'normal' | 'single';
  chatBaseUrl?: string;
  curiaBaseUrl?: string;
  authToken?: string | null;
  onClose: () => void;
}

export interface ChatContextType {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}

// IRC Provisioning Types
export interface IrcCredentials {
  success: boolean;
  ircUsername: string;
  ircPassword: string;
  networkName: string;
}

export interface ChatModalState {
  status: 'loading' | 'ready' | 'error';
  credentials?: IrcCredentials;
  error?: string;
}