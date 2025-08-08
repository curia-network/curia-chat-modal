/**
 * API client utilities for chat modal
 * IRC provisioning moved to curia app for better architecture
 */

export interface IrcCredentials {
  success: boolean;
  ircUsername: string;
  ircPassword: string;
  networkName: string;
}

// NOTE: provisionIrcUser function moved to curia app (src/utils/chat-api-client.ts)
// This improves architecture by keeping backend calls in the main app

/**
 * Construct The Lounge auto-login URL with dynamic IRC credentials
 */
export function buildLoungeUrl({
  baseUrl,
  ircUsername,
  ircPassword,
  networkName,
  userNick,
  channelName,
  nofocus = true,
  theme,
  mode
}: {
  baseUrl: string;
  ircUsername: string;
  ircPassword: string;
  networkName: string;
  userNick: string;
  channelName: string;
  nofocus?: boolean;
  theme?: 'light' | 'dark';
  mode?: 'normal' | 'single';
}): string {
  const params = new URLSearchParams({
    password: ircPassword,
    autoconnect: 'true',
    nick: userNick,
    username: `${ircUsername}/${networkName}`,
    realname: userNick,
    join: `#${channelName}`,
    ...(theme && { theme }),
    ...(mode && { mode })
  });

  const finalUrl = `${baseUrl}?${params.toString()}`;
  
  console.log('[Chat Modal] Built Lounge URL for user:', ircUsername, theme ? `with theme: ${theme}` : '', mode ? `with mode: ${mode}` : '');

  return finalUrl;
}