import React, { useMemo, useState } from 'react';
import { buildLoungeUrl } from '../../utils/api-client';
import { ChatIframe } from './ChatIframe';
import { LoadingState, ErrorState } from './LoadingStates';
import type { IrcCredentials, ApiChatChannel } from '../../types';

interface ChatCoreProps {
  ircCredentials: IrcCredentials;
  channel: ApiChatChannel;
  chatBaseUrl?: string;
  theme?: 'light' | 'dark';
  mode?: 'single' | 'normal';
  className?: string;
  onClose: () => void;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export function ChatCore({ 
  ircCredentials, 
  channel, 
  chatBaseUrl, 
  theme = 'light',
  mode,
  className = "w-full h-full",
  onClose,
  onLoad,
  onError 
}: ChatCoreProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build IRC client URL with all necessary parameters
  const chatUrl = useMemo(() => {
    return buildLoungeUrl({
      baseUrl: chatBaseUrl || 'https://chat.curia.network',
      ircUsername: ircCredentials.ircUsername,
      ircPassword: ircCredentials.ircPassword,
      networkName: ircCredentials.networkName,
      userNick: ircCredentials.ircUsername,
      channelName: channel.irc_channel_name,
      nofocus: channel.settings?.irc?.nofocus ?? true,
      theme,
      mode: mode || (channel.is_single_mode ? 'single' : 'normal')
    });
  }, [ircCredentials, channel, chatBaseUrl, theme, mode]);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
    onLoad?.();
  };

  const handleError = (errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
    onError?.(errorMessage);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    // The iframe will automatically retry when we reset the loading state
  };

  return (
    <div className={className}>
      {/* Loading State */}
      {isLoading && !error && (
        <LoadingState />
      )}
      
      {/* Error State */}
      {error && (
        <ErrorState 
          error={error}
          onRetry={handleRetry}
        />
      )}
      
      {/* Chat Iframe */}
      <ChatIframe
        src={chatUrl}
        title={`Chat: ${channel.name}`}
        className="w-full h-full border-0"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}