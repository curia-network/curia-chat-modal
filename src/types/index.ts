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
  chatBaseUrl?: string;
  onClose: () => void;
}

export interface ChatContextType {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}