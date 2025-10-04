/**
 * Constructs a fully qualified public board URL from a share token.
 * @param shareToken - The board's share token (UUID)
 * @returns Full URL to the public board page
 */
export function getPublicBoardUrl(shareToken: string): string {
  const origin = window.location.origin;
  return `${origin}/b/${shareToken}`;
}

/**
 * Detects if the Web Share API is available (typically on mobile devices).
 * @returns True if navigator.share is supported
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}
