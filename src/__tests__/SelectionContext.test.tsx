import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SelectionProvider, useSelection } from '@/contexts/SelectionContext';
import { type ReactNode } from 'react';

function createWrapper() {
  return ({ children }: { children: ReactNode }) => (
    <SelectionProvider>{children}</SelectionProvider>
  );
}

describe('SelectionContext', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = () => {};

    expect(() => {
      renderHook(() => useSelection());
    }).toThrow('useSelection must be used within a SelectionProvider');

    console.error = consoleError;
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSelection(), {
      wrapper: createWrapper(),
    });

    expect(result.current.selectionMode).toBe(false);
    expect(result.current.selectedIds).toBeInstanceOf(Set);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should enter selection mode', () => {
    const { result } = renderHook(() => useSelection(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.enterSelectionMode();
    });

    expect(result.current.selectionMode).toBe(true);
  });

  it('should exit selection mode and clear selections', () => {
    const { result } = renderHook(() => useSelection(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('image-1');
      result.current.toggleSelection('image-2');
    });

    expect(result.current.selectedIds.size).toBe(2);

    act(() => {
      result.current.exitSelectionMode();
    });

    expect(result.current.selectionMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should toggle selection for an image', () => {
    const { result } = renderHook(() => useSelection(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.toggleSelection('image-1');
    });

    expect(result.current.selectedIds.has('image-1')).toBe(true);

    act(() => {
      result.current.toggleSelection('image-1');
    });

    expect(result.current.selectedIds.has('image-1')).toBe(false);
  });

  it('should select multiple images', () => {
    const { result } = renderHook(() => useSelection(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.toggleSelection('image-1');
      result.current.toggleSelection('image-2');
      result.current.toggleSelection('image-3');
    });

    expect(result.current.selectedIds.size).toBe(3);
    expect(result.current.selectedIds.has('image-1')).toBe(true);
    expect(result.current.selectedIds.has('image-2')).toBe(true);
    expect(result.current.selectedIds.has('image-3')).toBe(true);
  });

  it('should select all images', () => {
    const { result } = renderHook(() => useSelection(), {
      wrapper: createWrapper(),
    });

    const imageIds = ['image-1', 'image-2', 'image-3', 'image-4'];

    act(() => {
      result.current.selectAll(imageIds);
    });

    expect(result.current.selectedIds.size).toBe(4);
    imageIds.forEach((id) => {
      expect(result.current.selectedIds.has(id)).toBe(true);
    });
  });

  it('should deselect all images', () => {
    const { result } = renderHook(() => useSelection(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.toggleSelection('image-1');
      result.current.toggleSelection('image-2');
      result.current.toggleSelection('image-3');
    });

    expect(result.current.selectedIds.size).toBe(3);

    act(() => {
      result.current.deselectAll();
    });

    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should check if an image is selected', () => {
    const { result } = renderHook(() => useSelection(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isSelected('image-1')).toBe(false);

    act(() => {
      result.current.toggleSelection('image-1');
    });

    expect(result.current.isSelected('image-1')).toBe(true);
  });

  it('should maintain selection state across operations', () => {
    const { result } = renderHook(() => useSelection(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('image-1');
      result.current.toggleSelection('image-2');
    });

    expect(result.current.selectionMode).toBe(true);
    expect(result.current.selectedIds.size).toBe(2);

    act(() => {
      result.current.toggleSelection('image-3');
    });

    expect(result.current.selectedIds.size).toBe(3);

    act(() => {
      result.current.deselectAll();
    });

    expect(result.current.selectionMode).toBe(true); // Mode stays on
    expect(result.current.selectedIds.size).toBe(0); // But selections cleared
  });
});
