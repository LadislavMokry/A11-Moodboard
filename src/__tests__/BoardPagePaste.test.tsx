import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import BoardPage from '@/pages/BoardPage';
import * as boardsService from '@/services/boards';
import { useImageUpload } from '@/hooks/useImageUpload';

const toastModuleMock = vi.hoisted(() => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header" />,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'owner-1' } }),
}));

vi.mock('@/lib/toast', () => toastModuleMock);
vi.mock('@/services/boards');
vi.mock('@/hooks/useImageUpload');

const toastMock = toastModuleMock.toast;
const useImageUploadMock = vi.mocked(useImageUpload);

const boardResponse = {
  id: 'board-1',
  owner_id: 'owner-1',
  name: 'Clipboard test board',
  description: 'Testing paste uploads',
  share_token: 'token',
  cover_rotation_enabled: false,
  is_showcase: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  images: [],
};

type ClipboardItemLike = {
  kind: string;
  type: string;
  getAsFile: () => File | null;
};

function dispatchPasteEvent(items: ClipboardItemLike[]) {
  const clipboardData = {
    items,
    files: items
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file)),
  };

  const event = new Event('paste') as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: clipboardData,
    enumerable: true,
  });

  act(() => {
    window.dispatchEvent(event);
  });
}

function renderBoardPage(boardId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/boards/${boardId}`]}>
        <Routes>
          <Route path="/boards/:boardId" element={<BoardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BoardPage clipboard paste integration', () => {
  let hasFocusSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    hasFocusSpy = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    useImageUploadMock.mockReturnValue({
      uploadImages: vi.fn(),
      handlePaste: vi.fn(),
      uploading: false,
      progress: {},
      errors: {},
      cancelUpload: vi.fn(),
      allowedMimeTypes: [],
      maxFileSize: 0,
      accept: 'image/*',
    });
    vi.mocked(boardsService.getBoard).mockResolvedValue(boardResponse as never);
  });

  afterEach(() => {
    hasFocusSpy.mockRestore();
  });

  it('triggers handlePaste and toast when image is pasted', async () => {
    const handlePasteMock = vi.fn();
    useImageUploadMock.mockReturnValue({
      uploadImages: vi.fn(),
      handlePaste: handlePasteMock,
      uploading: false,
      progress: {},
      errors: {},
      cancelUpload: vi.fn(),
      allowedMimeTypes: [],
      maxFileSize: 0,
      accept: 'image/*',
    });

    renderBoardPage('board-1');

    await waitFor(() => {
      expect(screen.getByText('Clipboard test board')).toBeInTheDocument();
    });

    const imageFile = new File(['image'], 'clipboard.png', { type: 'image/png' });

    dispatchPasteEvent([
      {
        kind: 'file',
        type: 'image/png',
        getAsFile: () => imageFile,
      },
    ]);

    await waitFor(() => {
      expect(handlePasteMock).toHaveBeenCalledWith([imageFile]);
    });

    expect(toastMock.success).toHaveBeenCalledWith('Image pasted, uploading...');
  });

  it('disables paste listener while uploading', async () => {
    const handlePasteMock = vi.fn();
    useImageUploadMock.mockReturnValue({
      uploadImages: vi.fn(),
      handlePaste: handlePasteMock,
      uploading: true,
      progress: {},
      errors: {},
      cancelUpload: vi.fn(),
      allowedMimeTypes: [],
      maxFileSize: 0,
      accept: 'image/*',
    });

    renderBoardPage('board-1');

    await waitFor(() => {
      expect(screen.getByText('Clipboard test board')).toBeInTheDocument();
    });

    const imageFile = new File(['image'], 'clipboard.png', { type: 'image/png' });

    dispatchPasteEvent([
      {
        kind: 'file',
        type: 'image/png',
        getAsFile: () => imageFile,
      },
    ]);

    expect(handlePasteMock).not.toHaveBeenCalled();
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});
