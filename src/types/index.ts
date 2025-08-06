// Legacy interfaces (keep for backward compatibility during transition)
export interface ChatUser {
  id: string;
  name: string;
}

export interface ChatCommunity {
  id: string;
  name: string;
}

// New session-aware interfaces
export interface ApiChatChannel {
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

export interface ChatChannelSettings {
  irc?: {
    autoconnect?: boolean;
    lockchannel?: boolean;
    nofocus?: boolean;
    welcomeMessage?: string;
    topic?: string;
  };
  ui?: {
    defaultTheme?: 'auto' | 'light' | 'dark';
    allowThemeSwitch?: boolean;
    showUserList?: boolean;
    allowMentions?: boolean;
  };
  permissions?: {
    allowedRoles?: string[];
    locks?: {
      lockIds?: number[];
      fulfillment?: 'any' | 'all';
      verificationDuration?: number;
    };
  };
}

// New ChatModal props interface - session-aware
export interface ChatModalProps {
  ircCredentials: IrcCredentials; // Pre-provisioned from curia app
  channel: ApiChatChannel;        // Pre-selected channel from curia app
  chatBaseUrl?: string;           // Base URL for The Lounge (for local dev)
  theme?: 'light' | 'dark';      // Current app theme
  mode?: 'single' | 'normal';    // Channel mode or override
  displayMode?: 'modal' | 'fullpage'; // NEW: How to render the component
  onClose: () => void;
}

// Updated ChatContext interface with channel selection
export interface ChatContextType {
  isChatOpen: boolean;
  selectedChannelId: number | null; // Which channel to show
  openChat: (channelId?: number) => void; // Optional channel selection
  closeChat: () => void;
}

// IRC Provisioning Types
export interface IrcCredentials {
  success: boolean;
  ircUsername: string;
  ircPassword: string;
  networkName: string;
}

// ChatModalState removed - no longer needed with session-aware pattern