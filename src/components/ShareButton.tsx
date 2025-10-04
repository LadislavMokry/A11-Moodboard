import { useState } from 'react';
import { Share2, Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/clipboard';
import { isWebShareSupported } from '@/lib/shareUtils';

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ShareButton({
  url,
  title,
  text,
  variant = 'outline',
  size = 'sm',
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    // Check if Web Share API is available (mobile)
    if (isWebShareSupported()) {
      try {
        setIsSharing(true);
        await navigator.share({
          title,
          text,
          url,
        });
        // Note: No success toast for Web Share API as the native dialog provides feedback
      } catch (error) {
        // User cancelled the share or an error occurred
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Web Share API failed:', error);
          // Fall back to copy on error
          await handleCopyLink();
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      // Desktop: copy to clipboard
      await handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const isMobile = isWebShareSupported();

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      className={className}
      disabled={isSharing}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          {isMobile ? <Share2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          {isMobile ? 'Share' : 'Copy Link'}
        </>
      )}
    </Button>
  );
}
