import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { isAllowedMimeType, MAX_IMAGE_SIZE_BYTES } from '@/lib/imageValidation';

interface ImageDropZoneProps {
  children: ReactNode;
  onDropFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function ImageDropZone({ children, onDropFiles, disabled = false }: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);

  const resetDragState = useCallback(() => {
    dragDepthRef.current = 0;
    setIsDragging(false);
  }, []);

  const allowedForDrop = useCallback(
    (event: DragEvent | React.DragEvent) => {
      if (disabled) {
        return false;
      }
      const types = event.dataTransfer?.types;
      return Boolean(types && Array.from(types).includes('Files'));
    },
    [disabled],
  );

  const extractFiles = useCallback((event: DragEvent | React.DragEvent): File[] => {
    const fileList = event.dataTransfer?.files;
    if (!fileList) {
      return [];
    }

    return Array.from(fileList).filter(
      (file) => isAllowedMimeType(file.type) && file.size <= MAX_IMAGE_SIZE_BYTES,
    );
  }, []);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const handleDragEnter = (event: DragEvent) => {
      if (!allowedForDrop(event)) {
        return;
      }
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsDragging(true);
    };

    const handleDragOver = (event: DragEvent) => {
      if (!allowedForDrop(event)) {
        return;
      }
      event.preventDefault();
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!allowedForDrop(event)) {
        return;
      }
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDrop = (event: DragEvent) => {
      if (!allowedForDrop(event)) {
        return;
      }
      event.preventDefault();
      const files = extractFiles(event);
      if (files.length > 0) {
        onDropFiles(files);
      }
      resetDragState();
    };

    global.addEventListener('dragenter', handleDragEnter);
    global.addEventListener('dragover', handleDragOver);
    global.addEventListener('dragleave', handleDragLeave);
    global.addEventListener('drop', handleDrop);

    return () => {
      global.removeEventListener('dragenter', handleDragEnter);
      global.removeEventListener('dragover', handleDragOver);
      global.removeEventListener('dragleave', handleDragLeave);
      global.removeEventListener('drop', handleDrop);
    };
  }, [allowedForDrop, disabled, extractFiles, onDropFiles, resetDragState]);

  const overlay = useMemo(() => {
    if (!isDragging || disabled) {
      return null;
    }

    return (
      <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm">
        <div className="pointer-events-none flex min-w-[280px] max-w-[420px] flex-col items-center gap-2 rounded-3xl border border-dashed border-violet-400/70 bg-white/90 px-8 py-10 text-center shadow-xl dark:border-violet-300/40 dark:bg-neutral-900/90">
          <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Drop images here</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            JPG, PNG, WebP, GIF up to 10MB
          </p>
        </div>
      </div>
    );
  }, [disabled, isDragging]);

  return (
    <div className="relative">
      {children}
      {overlay}
    </div>
  );
}
