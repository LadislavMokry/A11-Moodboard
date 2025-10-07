import { type ReactNode } from 'react';
import { Pencil } from 'lucide-react';

interface LightboxCaptionPanelProps {
  caption: string | null;
  onEditClick?: () => void;
  isOwner?: boolean;
  thumbnails?: ReactNode;
  isOpen?: boolean;
}

export function LightboxCaptionPanel({ caption, onEditClick, isOwner = false, thumbnails, isOpen = true }: LightboxCaptionPanelProps) {
  const hasContent = caption || isOwner || thumbnails;
  if (!hasContent) return null;

  return (
    <div
      className={`absolute top-0 right-0 h-full bg-black/80 backdrop-blur-sm transition-transform duration-300 ease-in-out hidden md:flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: '320px' }}
    >
      {/* Main content area */}
      <div className="flex-1 p-6 flex flex-col h-full">
        {/* Caption section (40% height, centered) */}
        <div className="flex-shrink-0 flex items-center justify-center" style={{ height: '40%' }}>
          {caption ? (
            <p className="text-white text-lg leading-relaxed text-center">
              "{caption}"
            </p>
          ) : (
            <p className="text-neutral-400 text-sm italic">
              No caption
            </p>
          )}
        </div>

        {/* Thumbnails section (60% height, scrollable) */}
        {isOpen && thumbnails && (
          <div className="flex-1 border-t border-neutral-700 min-h-0" style={{ height: '60%' }}>
            {thumbnails}
          </div>
        )}
      </div>
    </div>
  );
}
