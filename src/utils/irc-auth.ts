import bcrypt from 'bcryptjs';

/**
 * Generate IRC-compliant username from a user's display name
 * @param name User's display name
 * @param userId User's unique ID (unused for now, kept for future flexibility)
 * @returns Clean IRC username (forbidden characters replaced with underscores)
 */
export function generateIrcUsername(name: string, userId: string): string {
  // Clean name: convert IRC-prohibited characters to underscores (preserve structure)
  // IRC RFC 2812 prohibits: spaces, @, and control characters
  const cleanName = name.replace(/[\s@\x00-\x1F\x7F]/g, '_').toLowerCase();
  
  // Return cleaned name as-is - collision handling is NOT this function's job
  return cleanName.slice(0, 32);
}

/**
 * Generate a secure random password for IRC authentication
 * Uses only alphanumeric characters to avoid URL encoding issues
 * @returns 20-character secure password (alphanumeric only)
 */
export function generateSecurePassword(): string {
  // Use only URL-safe characters: 0-9, A-Z, a-z (no special chars)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let password = '';
  
  // Generate 20 characters for better security
  for (let i = 0; i < 20; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
}

/**
 * Hash a password using bcrypt for secure storage in Soju database
 * @param password Plain text password to hash
 * @returns Promise resolving to bcrypt hash
 */
export async function hashIrcPassword(password: string): Promise<string> {
  // Use cost factor 10 (same as existing Soju admin user)
  return await bcrypt.hash(password, 10);
}

/**
 * Verify a password against a bcrypt hash
 * @param password Plain text password
 * @param hash Bcrypt hash from database
 * @returns Promise resolving to boolean indicating match
 */
export async function verifyIrcPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Interface for IRC provisioning utilities
 * Useful for type checking when importing in other modules
 */
export interface IrcProvisioningUtils {
  generateIrcUsername: typeof generateIrcUsername;
  generateSecurePassword: typeof generateSecurePassword;
  hashIrcPassword: typeof hashIrcPassword;
  verifyIrcPassword: typeof verifyIrcPassword;
}