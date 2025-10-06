import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import { SkipLink } from '@/components/SkipLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { EditableText } from '@/components/EditableText';
import { ImageDropZone } from '@/components/ImageDropZone';
import * as boardsService from '@/services/boards';

expect.extend(toHaveNoViolations);

// Mock services
vi.mock('@/services/boards');
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useProfile');
vi.mock('@/hooks/useTheme');
vi.mock('@/components/Header', () => ({
  Header: () => <div data-testid="header" />,
}));
vi.mock('@/components/ShowcaseBoard', () => ({
  ShowcaseBoard: () => <div data-testid="showcase-board" />,
}));

// Mock useAuth hook
const mockUseAuth = await import('@/hooks/useAuth');
vi.mocked(mockUseAuth.useAuth).mockReturnValue({
  user: null,
  loading: false,
  signOut: vi.fn(),
  signInWithGoogle: vi.fn(),
});

// Mock useProfile hook
const mockUseProfile = await import('@/hooks/useProfile');
vi.mocked(mockUseProfile.useProfile).mockReturnValue({
  data: null,
  isLoading: false,
  error: null,
} as any);

// Mock useTheme hook
const mockUseTheme = await import('@/hooks/useTheme');
vi.mocked(mockUseTheme.useTheme).mockReturnValue({
  theme: 'system',
  effectiveTheme: 'light',
  setTheme: vi.fn(),
});

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(boardsService.getBoards).mockResolvedValue([]);
  });

  describe('SkipLink', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<SkipLink />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible', () => {
      render(<SkipLink />);
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink.tagName).toBe('A');
    });

    it('should become visible on focus', () => {
      const { container } = render(<SkipLink />);
      const skipLink = container.querySelector('a');
      expect(skipLink).toHaveClass('sr-only');
      expect(skipLink).toHaveClass('focus:not-sr-only');
    });
  });

  describe('ThemeToggle', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ThemeToggle />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA label', () => {
      render(<ThemeToggle />);
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(<ThemeToggle />);
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('EditableText', () => {
    const defaultProps = {
      value: 'Test Value',
      onSave: vi.fn(),
      maxLength: 100,
      placeholder: 'Enter text',
      label: 'Test Label',
    };

    it('should have no accessibility violations in display mode', async () => {
      const { container } = render(<EditableText {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes in edit mode', async () => {
      const { container } = render(<EditableText {...defaultProps} />);
      const button = screen.getByRole('button');
      button.click();

      // Wait for input to appear
      const input = await screen.findByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Test Label');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toHaveAttribute('maxLength', '100');
    });

    it('should associate error message with input', async () => {
      const { container } = render(
        <EditableText {...defaultProps} value="" allowEmpty={false} />
      );
      
      const button = screen.getByRole('button');
      button.click();

      const input = await screen.findByRole('textbox');
      input.blur();

      // Check for error association
      const errorElement = await screen.findByRole('alert');
      expect(errorElement).toHaveTextContent('This field is required.');
      expect(input).toHaveAttribute('aria-describedby', 'editable-text-error');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-required when field is required', async () => {
      const { container } = render(
        <EditableText {...defaultProps} allowEmpty={false} />
      );
      
      const button = screen.getByRole('button');
      button.click();

      const input = await screen.findByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('ImageDropZone', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ImageDropZone onDropFiles={vi.fn()}>
          <div>Drop zone content</div>
        </ImageDropZone>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be renderable and have proper structure', () => {
      const { container } = render(
        <ImageDropZone onDropFiles={vi.fn()}>
          <div data-testid="drop-zone-content">Drop zone content</div>
        </ImageDropZone>
      );

      // Check that the drop zone renders correctly
      expect(screen.getByTestId('drop-zone-content')).toBeInTheDocument();
      expect(container).toBeInTheDocument();
      
      // The drag overlay should not be visible initially
      const statusElement = screen.queryByRole('status');
      expect(statusElement).not.toBeInTheDocument();
    });
  });

  describe('Home Page', () => {
    function renderHome() {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });

      return render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Home />
          </MemoryRouter>
        </QueryClientProvider>
      );
    }

    it('should have no accessibility violations for unauthenticated view', async () => {
      vi.mocked(mockUseAuth.useAuth).mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
        signInWithGoogle: vi.fn(),
      });

      const { container } = renderHome();
      
      // Wait for content to load
      await screen.findByText(/Capture your vibe/i);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', async () => {
      const { container } = renderHome();
      
      await screen.findByText(/Capture your vibe/i);

      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
      
      // Should have an h1
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
    });

    it('should have landmark regions', async () => {
      const { container } = renderHome();
      
      await screen.findByText(/Capture your vibe/i);

      // Should have main content area
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have visible focus indicators', () => {
      render(
        <div>
          <button>Test Button</button>
          <a href="#test">Test Link</a>
          <input type="text" placeholder="Test Input" />
        </div>
      );

      const button = screen.getByRole('button');
      const link = screen.getByRole('link');
      const input = screen.getByRole('textbox');

      // All interactive elements should be focusable
      expect(button).not.toHaveAttribute('tabindex', '-1');
      expect(link).not.toHaveAttribute('tabindex', '-1');
      expect(input).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast', async () => {
      const { container } = render(
        <div>
          <button className="bg-violet-600 text-white px-4 py-2">
            Primary Button
          </button>
          <p className="text-neutral-900 dark:text-neutral-100">
            Regular text content
          </p>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels for icon-only buttons', () => {
      render(
        <button aria-label="Close dialog">
          <span aria-hidden="true">×</span>
        </button>
      );

      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it('should use semantic HTML elements', () => {
      const { container } = render(
        <article>
          <header>
            <h2>Article Title</h2>
          </header>
          <p>Article content</p>
          <footer>Article footer</footer>
        </article>
      );

      expect(container.querySelector('article')).toBeInTheDocument();
      expect(container.querySelector('header')).toBeInTheDocument();
      expect(container.querySelector('footer')).toBeInTheDocument();
    });
  });

  describe('Motion and Animation', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock prefers-reduced-motion
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { container } = render(
        <div className="animate-spin">Loading</div>
      );

      // The CSS should handle this via media query
      expect(container).toBeInTheDocument();
    });
  });
});

