import { useEffect, useRef } from 'react';

type UseClipboardPasteOptions = {
  enabled?: boolean;
  onPaste: (files: File[]) => void;
};

function extractImageFilesFromClipboard(event: ClipboardEvent): File[] {
  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return [];
  }

  const files: File[] = [];

  const items = clipboardData.items ? Array.from(clipboardData.items) : [];
  items.forEach((item) => {
    if (item.kind === 'file') {
      const file = item.getAsFile?.();
      if (file && file.type.startsWith('image/')) {
        files.push(file);
      }
    }
  });

  if (files.length === 0 && clipboardData.files) {
    Array.from(clipboardData.files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        files.push(file);
      }
    });
  }

  return files;
}

export function useClipboardPaste({ enabled = true, onPaste }: UseClipboardPasteOptions) {
  const callbackRef = useRef(onPaste);

  useEffect(() => {
    callbackRef.current = onPaste;
  }, [onPaste]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const handlePaste = (event: ClipboardEvent) => {
      if (typeof document.hasFocus === 'function' && !document.hasFocus()) {
        return;
      }

      const files = extractImageFilesFromClipboard(event);
      if (files.length === 0) {
        return;
      }

      callbackRef.current(files);
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [enabled]);
}
