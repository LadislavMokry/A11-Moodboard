import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useImageUpload } from '@/hooks/useImageUpload';
import * as imageServices from '@/services/images';

vi.mock('@/components/UploadProgressToast', () => ({
  UploadProgressToast: () => null,
}));

const toastMocks = vi.hoisted(() => ({
  customMock: vi.fn(),
  dismissMock: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    custom: toastMocks.customMock,
    dismiss: toastMocks.dismissMock,
  },
}));

vi.mock('@/services/images');

const uploadImageMock = vi.mocked(imageServices.uploadImage);
const addImageToBoardMock = vi.mocked(imageServices.addImageToBoard);

class FileReaderMock {
  public result: string | ArrayBuffer | null = null;
  public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
  public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;

  readAsDataURL() {
    this.result = 'data:image/jpeg;base64,AAA=';
    this.onload?.call(this as unknown as FileReader, new ProgressEvent('load'));
  }
}

class ImageMock {
  public onload: (() => void) | null = null;
  public onerror: (() => void) | null = null;

  set src(_value: string) {
    setTimeout(() => {
      this.onload?.();
    }, 0);
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useImageUpload', () => {
  beforeEach(() => {
    uploadImageMock.mockReset();
    addImageToBoardMock.mockReset();
    toastMocks.customMock.mockReset().mockReturnValue('toast-id');
    toastMocks.dismissMock.mockReset();
    vi.stubGlobal('FileReader', FileReaderMock);
    vi.stubGlobal('Image', ImageMock as unknown as typeof Image);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('limits concurrent uploads to four at a time', async () => {
    const uploadResolvers: Array<() => void> = [];
    uploadImageMock.mockImplementation((_file, board) =>
      new Promise((resolve) => {
        uploadResolvers.push(() =>
          resolve({
            storagePath: `boards/${board}/path.jpg`,
            mimeType: 'image/jpeg',
            sizeBytes: 1024,
            originalFilename: 'photo.jpg',
          }),
        );
      }),
    );
    addImageToBoardMock.mockResolvedValue({} as any);

    const { result } = renderHook(() => useImageUpload('board-1'), {
      wrapper: createWrapper(),
    });

    const files = Array.from({ length: 6 }, (_, index) =>
      new File(['data'], `file-${index}.jpg`, { type: 'image/jpeg' }),
    );

    act(() => {
      result.current.uploadImages(files);
    });

    await waitFor(() => {
      expect(uploadImageMock).toHaveBeenCalledTimes(4);
    });

    act(() => uploadResolvers.shift()?.());
    await waitFor(() => {
      expect(uploadImageMock).toHaveBeenCalledTimes(5);
    });

    act(() => uploadResolvers.shift()?.());
    await waitFor(() => {
      expect(uploadImageMock).toHaveBeenCalledTimes(6);
    });
  });

  it('updates progress to 100 after successful upload', async () => {
    uploadImageMock.mockResolvedValue({
      storagePath: 'boards/board-1/file.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      originalFilename: 'file.jpg',
    });
    addImageToBoardMock.mockResolvedValue({} as any);

    const { result } = renderHook(() => useImageUpload('board-1'), {
      wrapper: createWrapper(),
    });

    const file = new File(['data'], 'image.jpg', { type: 'image/jpeg' });

    await act(async () => {
      result.current.uploadImages([file]);
    });

    await waitFor(() => {
      expect(addImageToBoardMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      const values = Object.values(result.current.progress);
      expect(values).toHaveLength(1);
      expect(values[0]).toBe(100);
    });
  });

  it('records error for failed uploads and continues', async () => {
    uploadImageMock
      .mockRejectedValueOnce(new Error('Network issue'))
      .mockResolvedValueOnce({
        storagePath: 'boards/board-1/ok.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        originalFilename: 'ok.jpg',
      });
    addImageToBoardMock.mockResolvedValue({} as any);

    const { result } = renderHook(() => useImageUpload('board-1'), {
      wrapper: createWrapper(),
    });

    const files = [
      new File(['data'], 'bad.jpg', { type: 'image/jpeg' }),
      new File(['data'], 'good.jpg', { type: 'image/jpeg' }),
    ];

    await act(async () => {
      result.current.uploadImages(files);
    });

    await waitFor(() => {
      expect(Object.values(result.current.errors)).toContain('Network issue');
    });
    await waitFor(() => {
      expect(addImageToBoardMock).toHaveBeenCalledTimes(1);
    });
  });

  it('rejects invalid files before uploading', async () => {
    const { result } = renderHook(() => useImageUpload('board-1'), {
      wrapper: createWrapper(),
    });

    const invalidFile = new File(['data'], 'note.txt', { type: 'text/plain' });

    await act(async () => {
      result.current.uploadImages([invalidFile]);
    });

    expect(uploadImageMock).not.toHaveBeenCalled();
    expect(Object.values(result.current.errors)[0]).toMatch('Unsupported file type');
  });

  it('maps row level security failures to a friendly message', async () => {
    uploadImageMock.mockRejectedValue(new Error('new row violates row-level security policy'));

    const { result } = renderHook(() => useImageUpload('board-1'), {
      wrapper: createWrapper(),
    });

    const file = new File(['data'], 'image.jpg', { type: 'image/jpeg' });

    await act(async () => {
      result.current.uploadImages([file]);
    });

    await waitFor(() => {
      const messages = Object.values(result.current.errors);
      expect(messages[0]).toBe('You do not have permission to upload to this board.');
    });
  });
});