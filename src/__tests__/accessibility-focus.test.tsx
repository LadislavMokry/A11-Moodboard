import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { trapFocus, announceToScreenReader, restoreFocus, getFocusableElements, prefersReducedMotion } from '@/lib/accessibility';

describe('Accessibility Utilities', () => {
  describe('trapFocus', () => {
    it('should trap focus within container', async () => {
      const { container } = render(
        <div>
          <button>Outside Before</button>
          <div data-testid="modal">
            <button data-testid="first">First</button>
            <button data-testid="middle">Middle</button>
            <button data-testid="last">Last</button>
          </div>
          <button>Outside After</button>
        </div>
      );

      const modal = screen.getByTestId('modal');
      const cleanup = trapFocus(modal);

      const first = screen.getByTestId('first');
      const last = screen.getByTestId('last');

      // Focus first element
      first.focus();
      expect(document.activeElement).toBe(first);

      // Tab to last
      await userEvent.tab();
      await userEvent.tab();
      expect(document.activeElement).toBe(last);

      // Tab should wrap to first
      await userEvent.tab();
      await waitFor(() => {
        expect(document.activeElement).toBe(first);
      });

      // Shift+Tab should go to last
      await userEvent.tab({ shift: true });
      await waitFor(() => {
        expect(document.activeElement).toBe(last);
      });

      cleanup();
    });
  });

  describe('announceToScreenReader', () => {
    it('should create aria-live announcement', () => {
      announceToScreenReader('Test announcement');

      const announcement = document.querySelector('[aria-live="polite"]');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveTextContent('Test announcement');
    });

    it('should support assertive priority', () => {
      announceToScreenReader('Urgent message', 'assertive');

      const announcement = document.querySelector('[aria-live="assertive"]');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveTextContent('Urgent message');
    });

    it('should be screen reader only', () => {
      announceToScreenReader('Hidden message');

      const announcement = document.querySelector('[aria-live="polite"]');
      expect(announcement).toHaveClass('sr-only');
    });
  });

  describe('restoreFocus', () => {
    it('should restore focus to element', async () => {
      const { container } = render(
        <div>
          <button data-testid="target">Target</button>
          <button data-testid="other">Other</button>
        </div>
      );

      const target = screen.getByTestId('target');
      const other = screen.getByTestId('other');

      target.focus();
      expect(document.activeElement).toBe(target);

      other.focus();
      expect(document.activeElement).toBe(other);

      restoreFocus(target);

      await waitFor(() => {
        expect(document.activeElement).toBe(target);
      });
    });

    it('should handle null element gracefully', () => {
      expect(() => restoreFocus(null)).not.toThrow();
    });
  });

  describe('getFocusableElements', () => {
    it('should find all focusable elements', () => {
      const { container } = render(
        <div>
          <button>Button</button>
          <a href="#test">Link</a>
          <input type="text" />
          <textarea />
          <select><option>Option</option></select>
          <button disabled>Disabled</button>
          <div tabIndex={-1}>Not Focusable</div>
        </div>
      );

      const focusableElements = getFocusableElements(container);
      
      // Should include: button, link, input, textarea, select (5 elements)
      // Should exclude: disabled button and tabIndex={-1}
      expect(focusableElements).toHaveLength(5);
    });

    it('should respect tabindex', () => {
      const { container } = render(
        <div>
          <div tabIndex={0}>Focusable Div</div>
          <div tabIndex={-1}>Not Focusable Div</div>
        </div>
      );

      const focusableElements = getFocusableElements(container);
      expect(focusableElements).toHaveLength(1);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should detect reduced motion preference', () => {
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

      expect(prefersReducedMotion()).toBe(true);
    });

    it('should return false when motion is not reduced', () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('Keyboard Event Handling', () => {
    it('should handle Tab key for navigation', async () => {
      render(
        <div>
          <button data-testid="btn1">Button 1</button>
          <button data-testid="btn2">Button 2</button>
          <button data-testid="btn3">Button 3</button>
        </div>
      );

      const btn1 = screen.getByTestId('btn1');
      const btn2 = screen.getByTestId('btn2');

      btn1.focus();
      expect(document.activeElement).toBe(btn1);

      await userEvent.tab();
      expect(document.activeElement).toBe(btn2);
    });

    it('should handle Shift+Tab for reverse navigation', async () => {
      render(
        <div>
          <button data-testid="btn1">Button 1</button>
          <button data-testid="btn2">Button 2</button>
        </div>
      );

      const btn1 = screen.getByTestId('btn1');
      const btn2 = screen.getByTestId('btn2');

      btn2.focus();
      expect(document.activeElement).toBe(btn2);

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(btn1);
    });

    it('should handle Enter key for activation', async () => {
      const handleClick = vi.fn();
      render(<button onClick={handleClick}>Click Me</button>);

      const button = screen.getByRole('button');
      button.focus();

      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle Space key for activation', async () => {
      const handleClick = vi.fn();
      render(<button onClick={handleClick}>Click Me</button>);

      const button = screen.getByRole('button');
      button.focus();

      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});

