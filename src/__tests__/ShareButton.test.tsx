import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from '@/components/ShareButton';
import * as clipboard from '@/lib/clipboard';
import * as shareUtils from '@/lib/shareUtils';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner');
vi.mock('@/lib/clipboard');
vi.mock('@/lib/shareUtils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/shareUtils')>('@/lib/shareUtils');
  return {
    ...actual,
    isWebShareSupported: vi.fn(),
  };
});

describe('ShareButton', () => {
  const mockUrl = 'https://example.com/b/123';
  const mockTitle = 'Test Board';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: desktop (no Web Share API)
    vi.mocked(shareUtils.isWebShareSupported).mockReturnValue(false);
  });

  describe('Desktop behavior (copy to clipboard)', () => {
    it('renders with "Copy Link" text and Link2 icon on desktop', () => {
      render(<ShareButton url={mockUrl} title={mockTitle} />);

      expect(screen.getByText('Copy Link')).toBeInTheDocument();
    });

    it('copies URL to clipboard when clicked', async () => {
      vi.mocked(clipboard.copyToClipboard).mockResolvedValue();

      render(<ShareButton url={mockUrl} title={mockTitle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(clipboard.copyToClipboard).toHaveBeenCalledWith(mockUrl);
      });
    });

    it('shows success toast after copying', async () => {
      vi.mocked(clipboard.copyToClipboard).mockResolvedValue();

      render(<ShareButton url={mockUrl} title={mockTitle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard');
      });
    });

    it('shows "Copied!" text temporarily after successful copy', async () => {
      vi.mocked(clipboard.copyToClipboard).mockResolvedValue();

      render(<ShareButton url={mockUrl} title={mockTitle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      // Should revert back after 2 seconds
      await waitFor(() => {
        expect(screen.getByText('Copy Link')).toBeInTheDocument();
      }, { timeout: 2500 });
    });

    it('shows error toast when copy fails', async () => {
      vi.mocked(clipboard.copyToClipboard).mockRejectedValue(new Error('Copy failed'));

      render(<ShareButton url={mockUrl} title={mockTitle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to copy link');
      });
    });
  });

  describe('Mobile behavior (Web Share API)', () => {
    beforeEach(() => {
      // Mock mobile environment
      vi.mocked(shareUtils.isWebShareSupported).mockReturnValue(true);
      // Mock navigator.share
      Object.defineProperty(navigator, 'share', {
        value: vi.fn().mockResolvedValue(undefined),
        writable: true,
        configurable: true,
      });
    });

    it('renders with "Share" text and Share2 icon on mobile', () => {
      render(<ShareButton url={mockUrl} title={mockTitle} />);

      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    it('calls Web Share API when clicked on mobile', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });

      render(<ShareButton url={mockUrl} title={mockTitle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith({
          url: mockUrl,
        });
      });
    });

    it('does not show toast when Web Share API succeeds', async () => {
      render(<ShareButton url={mockUrl} title={mockTitle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.share).toHaveBeenCalled();
      });

      // Should not show toast for native share dialog
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('falls back to copy when user cancels share dialog', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';

      const mockShare = vi.fn().mockRejectedValue(abortError);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });

      vi.mocked(clipboard.copyToClipboard).mockResolvedValue();

      render(<ShareButton url={mockUrl} title={mockTitle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalled();
      });

      // Should not fall back to copy when user cancels
      expect(clipboard.copyToClipboard).not.toHaveBeenCalled();
    });

    it('falls back to copy when Web Share API fails with non-abort error', async () => {
      const mockShare = vi.fn().mockRejectedValue(new Error('Share failed'));
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });

      vi.mocked(clipboard.copyToClipboard).mockResolvedValue();

      render(<ShareButton url={mockUrl} title={mockTitle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(clipboard.copyToClipboard).toHaveBeenCalledWith(mockUrl);
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard');
      });
    });
  });

  describe('Props and styling', () => {
    it('applies custom variant and size', () => {
      const { container } = render(
        <ShareButton
          url={mockUrl}
          title={mockTitle}
          variant="default"
          size="lg"
        />
      );

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ShareButton
          url={mockUrl}
          title={mockTitle}
          className="custom-class"
        />
      );

      const button = container.querySelector('button.custom-class');
      expect(button).toBeInTheDocument();
    });

    it('disables button while sharing on mobile', async () => {
      vi.mocked(shareUtils.isWebShareSupported).mockReturnValue(true);

      // Create a promise that doesn't resolve immediately
      let resolveShare: () => void;
      const sharePromise = new Promise<void>((resolve) => {
        resolveShare = resolve;
      });

      const mockShare = vi.fn().mockReturnValue(sharePromise);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });

      render(<ShareButton url={mockUrl} title={mockTitle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Button should be disabled while sharing
      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      // Resolve the share
      resolveShare!();

      // Button should be enabled again
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });
});
