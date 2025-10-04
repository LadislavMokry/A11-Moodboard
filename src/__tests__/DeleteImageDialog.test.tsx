import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteImageDialog } from '@/components/DeleteImageDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as imageService from '@/services/images';
import { toast } from 'sonner';
import { type Image } from '@/schemas/image';

// Mock dependencies
vi.mock('@/services/images');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DeleteImageDialog', () => {
  let queryClient: QueryClient;

  const mockImage: Image = {
    id: 'image-123',
    board_id: 'board-123',
    storage_path: 'boards/board-123/image.jpg',
    position: 1,
    mime_type: 'image/jpeg',
    width: 800,
    height: 600,
    size_bytes: 100000,
    original_filename: 'test-image.jpg',
    source_url: null,
    caption: 'Test caption',
    created_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderDialog = (props: any = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <DeleteImageDialog
          open={true}
          onOpenChange={vi.fn()}
          boardId="board-123"
          image={mockImage}
          {...props}
        />
      </QueryClientProvider>,
    );
  };

  it('renders when open', () => {
    renderDialog();

    expect(screen.getByText('Delete image')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('displays warning message', () => {
    renderDialog();

    expect(screen.getByText('Delete this image? This cannot be undone.')).toBeInTheDocument();
  });

  it('displays image thumbnail preview', () => {
    renderDialog();

    const img = screen.getByAltText('Test caption');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('image.jpg'));
  });

  it('has delete and cancel buttons', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls deleteImage service when delete button is clicked', async () => {
    const mockDeleteImage = vi.spyOn(imageService, 'deleteImage').mockResolvedValue();

    renderDialog();

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteImage).toHaveBeenCalledWith('image-123');
    });
  });

  it('shows success toast and closes dialog on successful deletion', async () => {
    vi.spyOn(imageService, 'deleteImage').mockResolvedValue();

    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Image deleted');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('calls onDeleteSuccess callback after successful deletion', async () => {
    vi.spyOn(imageService, 'deleteImage').mockResolvedValue();

    const onDeleteSuccess = vi.fn();
    renderDialog({ onDeleteSuccess });

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(onDeleteSuccess).toHaveBeenCalled();
    });
  });

  it('shows error toast when deletion fails', async () => {
    vi.spyOn(imageService, 'deleteImage').mockRejectedValue(
      new Error('Network error'),
    );

    renderDialog();

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });

  it('does not close dialog when deletion fails', async () => {
    vi.spyOn(imageService, 'deleteImage').mockRejectedValue(
      new Error('Network error'),
    );

    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    // Should not have closed
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('disables buttons while deleting', async () => {
    vi.spyOn(imageService, 'deleteImage').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    renderDialog();

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    fireEvent.click(deleteButton);

    expect(deleteButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('has red destructive styling on delete button', () => {
    renderDialog();

    const deleteButton = screen.getByRole('button', { name: /^delete$/i });
    expect(deleteButton).toHaveClass('bg-red-600');
  });
});
