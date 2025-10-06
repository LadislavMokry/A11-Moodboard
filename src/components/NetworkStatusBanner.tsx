// ABOUTME: Banner component that displays when user goes offline
// ABOUTME: Uses useNetworkStatus hook to detect connectivity changes and shows dismissible warning.

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";

export function NetworkStatusBanner() {
  const { isOffline } = useNetworkStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when coming back online
  useEffect(() => {
    if (!isOffline && isDismissed) {
      setIsDismissed(false);
    }
  }, [isOffline, isDismissed]);

  if (!isOffline || isDismissed) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 backdrop-blur-sm text-amber-950 px-4 py-3 shadow-lg"
      role="alert"
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <WifiOff className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">You're offline. Some features may not work until you reconnect.</p>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 rounded-md p-1 hover:bg-amber-600/20 transition-colors"
          aria-label="Dismiss offline banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
