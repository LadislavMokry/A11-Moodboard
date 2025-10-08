import { useState } from 'react';
import { Share2, Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/clipboard';
import { isMobileDevice, isWebShareSupported } from '@/lib/shareUtils';

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

  const useNativeShare = isMobileDevice() && isWebShareSupported();

  const handleShare = async () => {
    if (useNativeShare) {
      try {
        setIsSharing(true);
        await navigator.share({
          title,
          text,
          url,
        });
        // Native share sheet provides its own feedback on mobile
        return;
      } catch (error) {
        // User cancelled the share or an error occurred
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Web Share API failed:', error);
          await handleCopyLink();
        }
        return;
      } finally {
        setIsSharing(false);
      }
    }

    // Desktop (or fallback when share sheet unavailable)
    await handleCopyLink();
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
          {useNativeShare ? <Share2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          {useNativeShare ? 'Share' : 'Copy Link'}
        </>
      )}
    </Button>
  );
}
