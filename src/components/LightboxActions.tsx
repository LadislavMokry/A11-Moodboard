import { copyToClipboard } from "@/lib/clipboard";
import { downloadImage } from "@/lib/download";
import { Download, Link2, Share2, Trash2, PanelRightOpen, PanelRightClose, Pencil } from "lucide-react";
import { toast } from "sonner";

interface LightboxActionsProps {
  imageUrl: string;
  filename: string;
  onCopyUrl?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
  isCaptionPanelOpen?: boolean;
  onToggleCaptionPanel?: () => void;
  onEditCaption?: () => void;
}

export function LightboxActions({ imageUrl, filename, onCopyUrl, onDelete, isOwner = false, isCaptionPanelOpen, onToggleCaptionPanel, onEditCaption }: LightboxActionsProps) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const handleDownload = async () => {
    try {
      // Check if we're on iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      await downloadImage(imageUrl, filename);

      if (isIOS && isSafari) {
        toast.success("Image opened in new tab - long press to save to gallery");
      } else {
        toast.success("Download started");
      }
    } catch (error) {
      toast.error("Failed to download image");
      console.error("Download failed:", error);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await copyToClipboard(imageUrl);
      toast.success("URL copied to clipboard");
      onCopyUrl?.();
    } catch (error) {
      toast.error("Failed to copy URL");
      console.error("Copy failed:", error);
    }
  };

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({
          title: filename,
          url: imageUrl
        });
      } catch (error) {
        // User cancelled or share failed, fall back to copy
        if ((error as Error).name !== "AbortError") {
          await handleCopyUrl();
        }
      }
    } else {
      // Fallback to copy URL
      await handleCopyUrl();
    }
  };

  return (
    <div
      className="absolute top-4 right-4 flex gap-2"
      style={{ zIndex: 30 }}
    >
      {/* Caption panel toggle button (desktop only) */}
      {!isMobile && onToggleCaptionPanel && (
        <button
          onClick={onToggleCaptionPanel}
          className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg transition-colors"
          aria-label={isCaptionPanelOpen ? "Hide caption panel" : "Show caption panel"}
          title={isCaptionPanelOpen ? "Hide caption panel" : "Show caption panel"}
        >
          {isCaptionPanelOpen ? (
            <PanelRightClose className="w-5 h-5 text-white" />
          ) : (
            <PanelRightOpen className="w-5 h-5 text-white" />
          )}
        </button>
      )}

      {/* Edit caption button (owner only, desktop) */}
      {isOwner && !isMobile && onEditCaption && (
        <button
          onClick={onEditCaption}
          className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg transition-colors"
          aria-label="Edit caption"
          title="Edit caption"
        >
          <Pencil className="w-5 h-5 text-white" />
        </button>
      )}

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

      {/* Delete button (owner only) */}
      {isOwner && onDelete && (
        <button
          onClick={onDelete}
          className="p-2 bg-red-600/80 hover:bg-red-700/90 backdrop-blur-sm rounded-lg transition-colors"
          aria-label="Delete image"
          title="Delete image"
        >
          <Trash2 className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
