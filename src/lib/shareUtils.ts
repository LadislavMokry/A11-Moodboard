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

/**
 * Rough mobile device detection used to decide when to invoke the native share sheet.
 * Prefers the User-Agent Client Hints API when available, falling back to UA sniffing.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (uaData && typeof uaData.mobile === 'boolean') {
    return uaData.mobile;
  }

  // Fallback: basic UA check
  const ua = navigator.userAgent || '';
  return /android|avantgo|blackberry|iemobile|ipad|iphone|ipod|opera mini|palm|webos/i.test(ua);
}
