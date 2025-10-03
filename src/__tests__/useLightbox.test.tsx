import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLightbox } from '@/hooks/useLightbox';

describe('useLightbox', () => {
  const totalImages = 5;

  beforeEach(() => {
    // Mock body style
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up
    document.body.style.overflow = '';
  });

  it('initializes with closed state', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    expect(result.current.isOpen).toBe(false);
    expect(result.current.currentIndex).toBe(0);
  });

  it('opens lightbox at specified index', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    act(() => {
      result.current.open(2);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.currentIndex).toBe(2);
  });

  it('closes lightbox', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    act(() => {
      result.current.open(0);
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('navigates to next image', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    act(() => {
      result.current.open(1);
    });

    act(() => {
      result.current.goToNext();
    });

    expect(result.current.currentIndex).toBe(2);
  });

  it('navigates to previous image', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    act(() => {
      result.current.open(2);
    });

    act(() => {
      result.current.goToPrev();
    });

    expect(result.current.currentIndex).toBe(1);
  });

  it('wraps to first image when navigating next from last image', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    act(() => {
      result.current.open(4); // Last image (index 4 in total of 5)
    });

    act(() => {
      result.current.goToNext();
    });

    expect(result.current.currentIndex).toBe(0);
  });

  it('wraps to last image when navigating previous from first image', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    act(() => {
      result.current.open(0); // First image
    });

    act(() => {
      result.current.goToPrev();
    });

    expect(result.current.currentIndex).toBe(4); // Last image (index 4)
  });

  it('prevents body scroll when open', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    expect(document.body.style.overflow).toBe('');

    act(() => {
      result.current.open(0);
    });

    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      result.current.close();
    });

    expect(document.body.style.overflow).toBe('');
  });

  it('handles Escape key to close', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    act(() => {
      result.current.open(0);
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('handles ArrowRight key to go to next image', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    act(() => {
      result.current.open(1);
    });

    expect(result.current.currentIndex).toBe(1);

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      window.dispatchEvent(event);
    });

    expect(result.current.currentIndex).toBe(2);
  });

  it('handles ArrowLeft key to go to previous image', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    act(() => {
      result.current.open(2);
    });

    expect(result.current.currentIndex).toBe(2);

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      window.dispatchEvent(event);
    });

    expect(result.current.currentIndex).toBe(1);
  });

  it('does not handle keyboard events when closed', () => {
    const { result } = renderHook(() => useLightbox(totalImages));

    expect(result.current.isOpen).toBe(false);
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      window.dispatchEvent(event);
    });

    // Index should not change when lightbox is closed
    expect(result.current.currentIndex).toBe(0);
  });

  it('cleans up keyboard listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { result, unmount } = renderHook(() => useLightbox(totalImages));

    act(() => {
      result.current.open(0);
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
