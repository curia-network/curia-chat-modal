/**
 * API client for IRC user provisioning
 * Calls the curia backend to create/update IRC users for seamless chat integration
 */

export interface IrcCredentials {
  success: boolean;
  ircUsername: string;
  ircPassword: string;
  networkName: string;
}

export interface ProvisionError {
  error: string;
  details?: string;
}

/**
 * Call the IRC user provisioning endpoint to get credentials for The Lounge
 * This endpoint validates JWT, creates/updates Soju IRC user, and returns login credentials
 */
export async function provisionIrcUser(
  chatBaseUrl?: string,
  authToken?: string | null,
  curiaBaseUrl?: string
): Promise<IrcCredentials> {
  // Use curiaBaseUrl for API calls, fallback to relative path for same-origin
  const endpoint = curiaBaseUrl ? `${curiaBaseUrl}/api/irc-user-provision` : '/api/irc-user-provision';
  
  try {
    console.log('[Chat Modal] Starting IRC user provisioning...');
    
    // Prepare headers with optional Authorization
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Include Authorization header if token is provided
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
    });

    console.log('[Chat Modal] IRC provisioning response:', response.status);

    if (!response.ok) {
      let errorData: ProvisionError;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('[Chat Modal] IRC provisioning failed:', errorData.error);
      
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const credentials: IrcCredentials = await response.json();
    
    console.log('[Chat Modal] IRC provisioning successful');
    
    if (!credentials.success) {
      throw new Error('IRC provisioning failed: Invalid response format');
    }

    return credentials;
  } catch (error) {
    console.error('[Chat Modal] IRC provisioning error:', error instanceof Error ? error.message : error);
    
    // Re-throw with more context for better error handling
    if (error instanceof Error) {
      throw new Error(`IRC provisioning failed: ${error.message}`);
    }
    throw new Error('IRC provisioning failed: Unknown error');
  }
}

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
  nofocus = true
}: {
  baseUrl: string;
  ircUsername: string;
  ircPassword: string;
  networkName: string;
  userNick: string;
  channelName: string;
  nofocus?: boolean;
}): string {
  const params = new URLSearchParams({
    autologin: 'true',
    user: ircUsername,
    'al-password': ircPassword,
    autoconnect: 'true',
    nick: userNick,
    username: `${ircUsername}/${networkName}`,
    realname: userNick,
    join: `#${channelName}`,
    lockchannel: 'true',
    ...(nofocus && { nofocus: 'true' })
  });

  const finalUrl = `${baseUrl}?${params.toString()}`;
  
  console.log('[Chat Modal] Built Lounge URL for user:', ircUsername);

  return finalUrl;
}