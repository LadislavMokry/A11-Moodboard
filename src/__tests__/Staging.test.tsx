import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Staging from '@/pages/Staging';
import { useAuth } from '@/hooks/useAuth';
import * as stagingStorage from '@/lib/stagingStorage';

// Mock dependencies
vi.mock('@/hooks/useAuth');
vi.mock('@/lib/stagingStorage');
vi.mock('@/components/SaveStagedImagesModal', () => ({
  SaveStagedImagesModal: ({ open, files }: any) =>
    open ? <div data-testid="save-modal">Modal with {files.length} files</div> : null,
}));
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header" />,
}));
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'system', effectiveTheme: 'light', setTheme: vi.fn() }),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockSaveStagedImages = vi.mocked(stagingStorage.saveStagedImages);
const mockGetStagedImages = vi.mocked(stagingStorage.getStagedImages);

function renderStaging() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Staging />
    </QueryClientProvider>
  );
}

describe('Staging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      session: null,
    });
    mockGetStagedImages.mockResolvedValue([]);

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders empty state when no images', () => {
    renderStaging();

    expect(screen.getByText('Staging Area')).toBeInTheDocument();
    expect(screen.getByText('Drop images here')).toBeInTheDocument();
  });

  it('handles image drop', async () => {
    renderStaging();

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const dropZone = screen.getByText('Drop images here').closest('div')!;

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('1/5 images')).toBeInTheDocument();
    });
  });

  it('enforces 5 image limit', async () => {
    renderStaging();

    const files = Array.from({ length: 7 }, (_, i) =>
      new File(['content'], `test${i}.jpg`, { type: 'image/jpeg' })
    );

    const dropZone = screen.getByText('Drop images here').closest('div')!;

    fireEvent.drop(dropZone, {
      dataTransfer: { files },
    });

    await waitFor(() => {
      expect(screen.getByText('5/5 images')).toBeInTheDocument();
    });
  });

  it('shows sign-in button when images are added and user is not authenticated', async () => {
    renderStaging();

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const dropZone = screen.getByText('Drop images here').closest('div')!;

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText('Sign in to save these images to a board')).toBeInTheDocument();
    });
  });

  it('shows save to board button when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      loading: false,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      session: null,
    });

    renderStaging();

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const dropZone = screen.getByText('Drop images here').closest('div')!;

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText('Save to board')).toBeInTheDocument();
    });
  });

  it('saves images to IndexedDB when signing in', async () => {
    mockSaveStagedImages.mockResolvedValue();

    renderStaging();

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const dropZone = screen.getByText('Drop images here').closest('div')!;

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText('Sign in to save these images to a board')).toBeInTheDocument();
    });

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockSaveStagedImages).toHaveBeenCalledWith([file]);
    });
  });

  it('loads staged images from IndexedDB on mount', async () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    mockGetStagedImages.mockResolvedValue([file]);

    renderStaging();

    await waitFor(() => {
      expect(screen.getByText('1/5 images')).toBeInTheDocument();
    });
  });

  it('shows save modal when user is authenticated and has staged images', async () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    mockGetStagedImages.mockResolvedValue([file]);
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      loading: false,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      session: null,
    });

    renderStaging();

    await waitFor(() => {
      expect(screen.getByTestId('save-modal')).toBeInTheDocument();
      expect(screen.getByText('Modal with 1 files')).toBeInTheDocument();
    });
  });

  it('filters non-image files on drop', async () => {
    renderStaging();

    const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const textFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const dropZone = screen.getByText('Drop images here').closest('div')!;

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [imageFile, textFile],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('1/5 images')).toBeInTheDocument();
    });
  });

  it('allows adding more images when under limit', async () => {
    renderStaging();

    const file1 = new File(['content'], 'test1.jpg', { type: 'image/jpeg' });
    const dropZone = screen.getByText('Drop images here').closest('div')!;

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file1] },
    });

    await waitFor(() => {
      expect(screen.getByText('Add more')).toBeInTheDocument();
    });
  });
});
