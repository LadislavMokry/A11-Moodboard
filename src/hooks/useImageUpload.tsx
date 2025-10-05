import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast as hotToast } from 'react-hot-toast';
import { uploadImage, addImageToBoard } from '@/services/images';
import type { ImageCreate } from '@/schemas/image';
import { UploadProgressToast, type UploadToastItem } from '@/components/UploadProgressToast';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  getAcceptString,
  validateImageFile,
} from '@/lib/imageValidation';

const MAX_CONCURRENT_UPLOADS = 4;
const RLS_ERROR_TEXT = 'You do not have permission to upload to this board.';

export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'success' | 'error' | 'cancelled';

interface UploadEntry {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
}

interface UploadMap {
  [id: string]: UploadEntry;
}

interface UploadTask {
  id: string;
  file: File;
}

export interface UseImageUploadResult {
  uploadImages: (files: File[] | FileList) => void;
  handlePaste: (clipboardItems: ClipboardItem[] | File[]) => void;
  uploading: boolean;
  progress: Record<string, number>;
  errors: Record<string, string>;
  cancelUpload: (id: string) => void;
  allowedMimeTypes: readonly string[];
  maxFileSize: number;
  accept: string;
}

function normalizeErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    const message = (error as any).message as string;
    if (message.toLowerCase().includes('row-level security')) {
      return RLS_ERROR_TEXT;
    }
    return message;
  }
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('row-level security')) {
      return RLS_ERROR_TEXT;
    }
    return error.message;
  }
  return 'Failed to upload image';
}

export function useImageUpload(boardId: string | undefined): UseImageUploadResult {
  const queryClient = useQueryClient();
  const [uploadMap, setUploadMap] = useState<UploadMap>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const queueRef = useRef<UploadTask[]>([]);
  const activeUploadsRef = useRef(0);
  const cancelledRef = useRef(new Set<string>());
  const toastIdRef = useRef<string | null>(null);
  const idCounterRef = useRef(0);

  const updateUploadingState = useCallback(() => {
    const hasWork = activeUploadsRef.current > 0 || queueRef.current.length > 0;
    setUploading(hasWork);
  }, []);

  const setEntryProgress = useCallback((id: string, value: number) => {
    setUploadMap((prev) => {
      const entry = prev[id];
      if (!entry) {
        return prev;
      }
      return {
        ...prev,
        [id]: {
          ...entry,
          progress: value,
        },
      };
    });
    setProgress((prev) => ({ ...prev, [id]: value }));
  }, []);

  const setEntryStatus = useCallback((id: string, status: UploadStatus, error?: string) => {
    setUploadMap((prev) => {
      const entry = prev[id];
      if (!entry) {
        return prev;
      }
      return {
        ...prev,
        [id]: {
          ...entry,
          status,
          error,
        },
      };
    });

    if (error) {
      setErrors((prev) => ({ ...prev, [id]: error }));
    } else {
      setErrors((prev) => {
        if (!prev[id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, []);

  const cancelUpload = useCallback(
    (id: string) => {
      cancelledRef.current.add(id);
      queueRef.current = queueRef.current.filter((task) => task.id !== id);

      setEntryStatus(id, 'cancelled', 'Upload cancelled');
      setEntryProgress(id, 0);
      updateUploadingState();
    },
    [setEntryProgress, setEntryStatus, updateUploadingState],
  );

  const startUploads = useCallback(() => {
    if (!boardId) {
      return;
    }

    const runTask = async (task: UploadTask) => {
      try {
        if (cancelledRef.current.has(task.id)) {
          return;
        }

        setEntryStatus(task.id, 'uploading');
        setEntryProgress(task.id, 5);

        const dimensions = await readImageDimensions(task.file);

        if (cancelledRef.current.has(task.id)) {
          setEntryStatus(task.id, 'cancelled', 'Upload cancelled');
          setEntryProgress(task.id, 0);
          return;
        }

        setEntryProgress(task.id, 30);

        const uploadResult = await uploadImage(task.file, boardId);

        if (cancelledRef.current.has(task.id)) {
          setEntryStatus(task.id, 'cancelled', 'Upload cancelled');
          setEntryProgress(task.id, 0);
          return;
        }

        setEntryStatus(task.id, 'processing');
        setEntryProgress(task.id, 70);

        const imageData: ImageCreate = {
          board_id: boardId,
          storage_path: uploadResult.storagePath,
          position: 1,
          mime_type: uploadResult.mimeType,
          width: dimensions.width,
          height: dimensions.height,
          size_bytes: uploadResult.sizeBytes,
          original_filename: uploadResult.originalFilename,
          source_url: null,
          caption: null,
        };

        await addImageToBoard(boardId, imageData);

        setEntryStatus(task.id, 'success');
        setEntryProgress(task.id, 100);

        await queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      } catch (error) {
        const message = normalizeErrorMessage(error);
        setEntryStatus(task.id, 'error', message);
      } finally {
        cancelledRef.current.delete(task.id);
        activeUploadsRef.current -= 1;
        updateUploadingState();
        startUploads();
      }
    };

    while (activeUploadsRef.current < MAX_CONCURRENT_UPLOADS && queueRef.current.length > 0) {
      const nextTask = queueRef.current.shift();
      if (!nextTask) {
        break;
      }

      activeUploadsRef.current += 1;
      void runTask(nextTask);
    }

    updateUploadingState();
  }, [boardId, queryClient, setEntryProgress, setEntryStatus, updateUploadingState]);

  const enqueueUploads = useCallback(
    (files: File[]) => {
      if (!boardId || files.length === 0) {
        return;
      }

      const newEntries: UploadMap = {};
      const newProgress: Record<string, number> = {};

      files.forEach((file) => {
        const id = createUploadId(file, idCounterRef.current++);

        try {
          validateImageFile(file);
          newEntries[id] = {
            id,
            file,
            progress: 0,
            status: 'pending',
          };
          newProgress[id] = 0;
          queueRef.current.push({ id, file });
        } catch (error) {
          const message = normalizeErrorMessage(error);
          newEntries[id] = {
            id,
            file,
            progress: 0,
            status: 'error',
            error: message,
          };
          newProgress[id] = 0;
          setErrors((prev) => ({ ...prev, [id]: message }));
        }
      });

      if (Object.keys(newEntries).length === 0) {
        return;
      }

      setUploadMap((prev) => ({ ...prev, ...newEntries }));
      setProgress((prev) => ({ ...prev, ...newProgress }));
      startUploads();
    },
    [boardId, startUploads],
  );

  const uploadImages = useCallback(
    (inputFiles: File[] | FileList) => {
      const files = Array.isArray(inputFiles) ? inputFiles : Array.from(inputFiles);
      enqueueUploads(files);
    },
    [enqueueUploads],
  );

  const handlePaste = useCallback(
    (clipboardItems: ClipboardItem[] | File[]) => {
      void extractFilesFromClipboardItems(clipboardItems).then((files) => {
        if (files.length === 0) {
          return;
        }
        enqueueUploads(files);
      });
    },
    [enqueueUploads],
  );

  const dismissToastWhenComplete = useCallback(
    (currentUploads: UploadMap) => {
      if (!toastIdRef.current) {
        return;
      }

      const allComplete = Object.values(currentUploads).every((item) =>
        ['success', 'error', 'cancelled'].includes(item.status),
      );

      if (allComplete) {
        const toastId = toastIdRef.current;
        toastIdRef.current = null;
        setTimeout(() => hotToast.dismiss(toastId), 1000);
      }
    },
    [],
  );

  const updateToast = useCallback(
    (currentUploads: UploadMap) => {
      if (Object.keys(currentUploads).length === 0) {
        if (toastIdRef.current) {
          hotToast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
        }
        return;
      }

      const toastItems: UploadToastItem[] = Object.values(currentUploads).map((upload) => ({
        id: upload.id,
        fileName: upload.file.name,
        progress: upload.progress,
        status: upload.status,
        error: upload.error,
      }));

      const toastId = hotToast.custom(
        (_t) => (
          <UploadProgressToast
            uploads={toastItems}
            onCancel={cancelUpload}
          />
        ),
        {
          id: toastIdRef.current ?? undefined,
          duration: Infinity,
        },
      );

      toastIdRef.current = toastId;
      dismissToastWhenComplete(currentUploads);
    },
    [cancelUpload, dismissToastWhenComplete],
  );

  useEffect(() => {
    updateToast(uploadMap);
  }, [updateToast, uploadMap]);

  useEffect(() => {
    if (!boardId) {
      queueRef.current = [];
      activeUploadsRef.current = 0;
      cancelledRef.current.clear();
      toastIdRef.current = null;
      setUploadMap({});
      setProgress({});
      setErrors({});
      setUploading(false);
    }
  }, [boardId]);

  return useMemo(
    () => ({
      uploadImages,
      handlePaste,
      uploading,
      progress,
      errors,
      cancelUpload,
      allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
      maxFileSize: MAX_IMAGE_SIZE_BYTES,
      accept: getAcceptString(),
    }),
    [uploadImages, handlePaste, uploading, progress, errors, cancelUpload],
  );
}

function createUploadId(file: File, counter: number): string {
  return `${file.name || 'file'}-${file.lastModified}-${file.size}-${counter}`;
}

async function readImageDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        resolve({ width: null, height: null });
        return;
      }

      const image = new Image();
      image.onload = () => {
        resolve({ width: Math.round(image.width), height: Math.round(image.height) });
      };
      image.onerror = () => {
        resolve({ width: null, height: null });
      };
      image.src = result;
    };

    reader.readAsDataURL(file);
  });
}

type ClipboardEntry = ClipboardItem | File | DataTransferItemLike | ClipboardItemLike;

interface ClipboardItemLike {
  types?: readonly string[];
  getType?: (type: string) => Promise<Blob>;
}

interface DataTransferItemLike {
  kind?: string;
  type?: string;
  getAsFile?: () => File | null;
}

function isFileEntry(entry: ClipboardEntry): entry is File {
  return typeof File !== 'undefined' && entry instanceof File;
}

function isDataTransferItem(entry: ClipboardEntry): entry is DataTransferItemLike {
  return typeof entry === 'object' && entry !== null && 'getAsFile' in entry;
}

function isClipboardItem(entry: ClipboardEntry): entry is ClipboardItemLike {
  return typeof entry === 'object' && entry !== null && 'getType' in entry;
}

async function extractFilesFromClipboardItems(
  clipboardItems: ClipboardItem[] | File[],
): Promise<File[]> {
  const timestamp = Date.now();
  const entries: ClipboardEntry[] = Array.isArray(clipboardItems)
    ? clipboardItems
    : Array.from(clipboardItems ?? []);

  const files = await Promise.all(
    entries.map(async (entry, index) => {
      if (isFileEntry(entry)) {
        return entry.type.startsWith('image/') ? entry : null;
      }

      if (isDataTransferItem(entry)) {
        const file = entry.getAsFile?.();
        if (file && file.type.startsWith('image/')) {
          return file;
        }
        return null;
      }

      if (isClipboardItem(entry) && entry.types) {
        const imageType = entry.types.find((type) => type.startsWith('image/'));
        if (!imageType || !entry.getType) {
          return null;
        }

        try {
          const blob = await entry.getType(imageType);
          if (!blob.type.startsWith('image/')) {
            return null;
          }
          const extension = blob.type.split('/')[1] ?? 'png';
          const fileName = `clipboard-image-${timestamp}-${index}.${extension}`;
          return new File([blob], fileName, { type: blob.type });
        } catch {
          return null;
        }
      }

      return null;
    }),
  );

  return files.filter((file): file is File => file !== null);
}
