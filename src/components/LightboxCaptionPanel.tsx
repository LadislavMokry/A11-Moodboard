import { useState } from 'react';
import { ChevronRight, Pencil } from 'lucide-react';

interface LightboxCaptionPanelProps {
  caption: string | null;
  onEditClick?: () => void;
  isOwner?: boolean;
}

export function LightboxCaptionPanel({ caption, onEditClick, isOwner = false }: LightboxCaptionPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!caption && !isOwner) return null;

  return (
    <div
      className={`absolute top-0 right-0 h-full bg-black/80 backdrop-blur-sm transition-transform duration-300 ease-in-out hidden md:flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: '320px' }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 bg-black/80 backdrop-blur-sm p-2 rounded-l-lg hover:bg-black/90 transition-colors"
        aria-label={isOpen ? 'Hide caption' : 'Show caption'}
      >
        <ChevronRight
          className={`w-5 h-5 text-white transition-transform duration-300 ${
            isOpen ? 'rotate-0' : 'rotate-180'
          }`}
        />
      </button>

      {/* Caption content */}
      <div className="flex-1 overflow-y-auto p-6">
        {caption ? (
          <p className="text-white text-sm leading-relaxed">
            "{caption}"
          </p>
        ) : (
          <p className="text-neutral-400 text-sm italic">
            No caption
          </p>
        )}

        {/* Edit button */}
        {isOwner && onEditClick && (
          <button
            onClick={onEditClick}
            className="mt-4 flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
            aria-label="Edit caption"
          >
            <Pencil className="w-4 h-4" />
            Edit caption
          </button>
        )}
      </div>
    </div>
  );
}
