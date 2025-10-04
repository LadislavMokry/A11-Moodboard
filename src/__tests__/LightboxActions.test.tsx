import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LightboxActions } from '@/components/LightboxActions';
import * as downloadLib from '@/lib/download';
import * as clipboardLib from '@/lib/clipboard';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/download');
vi.mock('@/lib/clipboard');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LightboxActions', () => {
  const mockImageUrl = 'https://example.com/image.jpg';
  const mockFilename = 'test-image.jpg';
  const mockOnCopyUrl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.innerWidth to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('renders download button', () => {
    render(
      <LightboxActions
        imageUrl={mockImageUrl}
        filename={mockFilename}
      />,
    );

    const downloadButton = screen.getByLabelText('Download image');
    expect(downloadButton).toBeInTheDocument();
  });

  it('renders copy URL button on desktop', () => {
    render(
      <LightboxActions
        imageUrl={mockImageUrl}
        filename={mockFilename}
      />,
    );

    const copyButton = screen.getByLabelText('Copy image URL');
    expect(copyButton).toBeInTheDocument();
  });

  it('calls downloadImage when download button is clicked', async () => {
    const mockDownloadImage = vi.spyOn(downloadLib, 'downloadImage').mockResolvedValue();

    render(
      <LightboxActions
        imageUrl={mockImageUrl}
        filename={mockFilename}
      />,
    );

    const downloadButton = screen.getByLabelText('Download image');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockDownloadImage).toHaveBeenCalledWith(mockImageUrl, mockFilename);
    });
  });

  it('shows success toast when download succeeds', async () => {
    vi.spyOn(downloadLib, 'downloadImage').mockResolvedValue();

    render(
      <LightboxActions
        imageUrl={mockImageUrl}
        filename={mockFilename}
      />,
    );

    const downloadButton = screen.getByLabelText('Download image');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Download started');
    });
  });

  it('shows error toast when download fails', async () => {
    vi.spyOn(downloadLib, 'downloadImage').mockRejectedValue(new Error('Download failed'));

    render(
      <LightboxActions
        imageUrl={mockImageUrl}
        filename={mockFilename}
      />,
    );

    const downloadButton = screen.getByLabelText('Download image');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to download image');
    });
  });

  it('calls copyToClipboard when copy URL button is clicked', async () => {
    const mockCopyToClipboard = vi.spyOn(clipboardLib, 'copyToClipboard').mockResolvedValue();

    render(
      <LightboxActions
        imageUrl={mockImageUrl}
        filename={mockFilename}
      />,
    );

    const copyButton = screen.getByLabelText('Copy image URL');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockCopyToClipboard).toHaveBeenCalledWith(mockImageUrl);
    });
  });

  it('shows success toast when copy succeeds', async () => {
    vi.spyOn(clipboardLib, 'copyToClipboard').mockResolvedValue();

    render(
      <LightboxActions
        imageUrl={mockImageUrl}
        filename={mockFilename}
      />,
    );

    const copyButton = screen.getByLabelText('Copy image URL');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('URL copied to clipboard');
    });
  });

  it('shows error toast when copy fails', async () => {
    vi.spyOn(clipboardLib, 'copyToClipboard').mockRejectedValue(new Error('Copy failed'));

    render(
      <LightboxActions
        imageUrl={mockImageUrl}
        filename={mockFilename}
      />,
    );

    const copyButton = screen.getByLabelText('Copy image URL');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to copy URL');
    });
  });

  it('calls onCopyUrl callback when copy succeeds', async () => {
    vi.spyOn(clipboardLib, 'copyToClipboard').mockResolvedValue();

    render(
      <LightboxActions
        imageUrl={mockImageUrl}
        filename={mockFilename}
        onCopyUrl={mockOnCopyUrl}
      />,
    );

    const copyButton = screen.getByLabelText('Copy image URL');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockOnCopyUrl).toHaveBeenCalled();
    });
  });

  it('renders share button on mobile when Web Share API is available', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    // Mock Web Share API
    Object.defineProperty(navigator, 'share', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });

    render(
      <LightboxActions
        imageUrl={mockImageUrl}
        filename={mockFilename}
      />,
    );

    const shareButton = screen.getByLabelText('Share image');
    expect(shareButton).toBeInTheDocument();
  });

  it('has proper z-index to appear above thumbnails', () => {
    const { container } = render(
      <LightboxActions
        imageUrl={mockImageUrl}
        filename={mockFilename}
      />,
    );

    const actionsContainer = container.firstChild as HTMLElement;
    expect(actionsContainer).toHaveStyle({ zIndex: '30' });
  });
});
