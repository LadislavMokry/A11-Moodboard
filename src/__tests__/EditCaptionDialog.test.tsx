import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditCaptionDialog } from '@/components/EditCaptionDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as imageService from '@/services/images';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/services/images');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EditCaptionDialog', () => {
  let queryClient: QueryClient;

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
        <EditCaptionDialog
          open={true}
          onOpenChange={vi.fn()}
          boardId="board-123"
          imageId="image-123"
          currentCaption={null}
          {...props}
        />
      </QueryClientProvider>,
    );
  };

  it('renders when open', () => {
    renderDialog();

    expect(screen.getByText('Edit caption')).toBeInTheDocument();
    expect(screen.getByText('Add or edit a caption for this image.')).toBeInTheDocument();
  });

  it('pre-fills current caption', () => {
    renderDialog({ currentCaption: 'Existing caption' });

    const input = screen.getByLabelText('Caption') as HTMLInputElement;
    expect(input.value).toBe('Existing caption');
  });

  it('shows character counter', () => {
    renderDialog();

    expect(screen.getByText('140 left')).toBeInTheDocument();
  });

  it('updates character counter as user types', async () => {
    renderDialog();

    const input = screen.getByLabelText('Caption');
    fireEvent.change(input, { target: { value: 'Hello' } });

    await waitFor(() => {
      expect(screen.getByText('135 left')).toBeInTheDocument();
    });
  });

  it('shows warning color when approaching character limit', async () => {
    renderDialog();

    const input = screen.getByLabelText('Caption');
    const longText = 'a'.repeat(125); // 140 - 125 = 15 left
    fireEvent.change(input, { target: { value: longText } });

    await waitFor(() => {
      const counter = screen.getByText('15 left');
      expect(counter).toHaveClass('text-amber-500');
    });
  });

  it('shows error color when exceeding character limit', async () => {
    renderDialog();

    const input = screen.getByLabelText('Caption');
    const tooLongText = 'a'.repeat(145);
    fireEvent.change(input, { target: { value: tooLongText } });

    await waitFor(() => {
      const counter = screen.getByText('-5 left');
      expect(counter).toHaveClass('text-red-500');
    });
  });

  it('shows validation error when submitting caption that is too long', async () => {
    renderDialog();

    const input = screen.getByLabelText('Caption');
    const tooLongText = 'a'.repeat(145);
    fireEvent.change(input, { target: { value: tooLongText } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/caption must be 140 characters or less/i)).toBeInTheDocument();
    });
  });

  it('calls updateImage service when form is submitted', async () => {
    const mockUpdateImage = vi.spyOn(imageService, 'updateImage').mockResolvedValue({
      id: 'image-123',
      board_id: 'board-123',
      storage_path: 'path/to/image.jpg',
      position: 1,
      caption: 'New caption',
      created_at: '2025-01-01T00:00:00Z',
    } as any);

    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    const input = screen.getByLabelText('Caption');
    fireEvent.change(input, { target: { value: 'New caption' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateImage).toHaveBeenCalledWith('image-123', {
        caption: 'New caption',
      });
    });
  });

  it('shows success toast and closes dialog on successful update', async () => {
    vi.spyOn(imageService, 'updateImage').mockResolvedValue({
      id: 'image-123',
      caption: 'New caption',
    } as any);

    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    const input = screen.getByLabelText('Caption');
    fireEvent.change(input, { target: { value: 'New caption' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Caption updated');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows error toast when update fails', async () => {
    vi.spyOn(imageService, 'updateImage').mockRejectedValue(
      new Error('Network error'),
    );

    renderDialog();

    const input = screen.getByLabelText('Caption');
    fireEvent.change(input, { target: { value: 'New caption' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });

  it('trims whitespace from caption before saving', async () => {
    const mockUpdateImage = vi.spyOn(imageService, 'updateImage').mockResolvedValue({
      id: 'image-123',
      caption: 'Trimmed',
    } as any);

    renderDialog();

    const input = screen.getByLabelText('Caption');
    fireEvent.change(input, { target: { value: '  Trimmed  ' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateImage).toHaveBeenCalledWith('image-123', {
        caption: 'Trimmed',
      });
    });
  });

  it('saves null when caption is empty', async () => {
    const mockUpdateImage = vi.spyOn(imageService, 'updateImage').mockResolvedValue({
      id: 'image-123',
      caption: null,
    } as any);

    renderDialog({ currentCaption: 'Old caption' });

    const input = screen.getByLabelText('Caption');
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateImage).toHaveBeenCalledWith('image-123', {
        caption: null,
      });
    });
  });

  it('disables buttons while saving', async () => {
    vi.spyOn(imageService, 'updateImage').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    renderDialog();

    const input = screen.getByLabelText('Caption');
    fireEvent.change(input, { target: { value: 'New caption' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    fireEvent.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
