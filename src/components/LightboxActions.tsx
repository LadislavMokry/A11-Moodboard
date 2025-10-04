import { Download, Link2, Share2 } from 'lucide-react';
import { downloadImage } from '@/lib/download';
import { copyToClipboard } from '@/lib/clipboard';
import { toast } from 'sonner';

interface LightboxActionsProps {
  imageUrl: string;
  filename: string;
  onCopyUrl?: () => void;
}

export function LightboxActions({
  imageUrl,
  filename,
  onCopyUrl,
}: LightboxActionsProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleDownload = async () => {
    try {
      await downloadImage(imageUrl, filename);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download image');
      console.error('Download failed:', error);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await copyToClipboard(imageUrl);
      toast.success('URL copied to clipboard');
      onCopyUrl?.();
    } catch (error) {
      toast.error('Failed to copy URL');
      console.error('Copy failed:', error);
    }
  };

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({
          title: filename,
          url: imageUrl,
        });
      } catch (error) {
        // User cancelled or share failed, fall back to copy
        if ((error as Error).name !== 'AbortError') {
          await handleCopyUrl();
        }
      }
    } else {
      // Fallback to copy URL
      await handleCopyUrl();
    }
  };

  return (
    <div className="absolute top-4 right-4 flex gap-2" style={{ zIndex: 30 }}>
      {/* Download button */}
      <button
        onClick={handleDownload}
        className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg transition-colors"
        aria-label="Download image"
        title="Download image"
      >
        <Download className="w-5 h-5 text-white" />
      </button>

      {/* Copy URL or Share button */}
      {isMobile && canShare ? (
        <button
          onClick={handleShare}
          className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg transition-colors"
          aria-label="Share image"
          title="Share image"
        >
          <Share2 className="w-5 h-5 text-white" />
        </button>
      ) : (
        <button
          onClick={handleCopyUrl}
          className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg transition-colors"
          aria-label="Copy image URL"
          title="Copy image URL"
        >
          <Link2 className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
