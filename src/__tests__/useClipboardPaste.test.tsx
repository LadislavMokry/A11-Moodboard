import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';

type ClipboardItemLike = {
  kind: string;
  type: string;
  getAsFile: () => File | null;
};

type PastePayload = {
  items?: ClipboardItemLike[];
  files?: File[];
};

function dispatchPasteEvent({ items = [], files = [] }: PastePayload) {
  const clipboardData = {
    items,
    files,
  };

  const event = new Event('paste') as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: clipboardData,
    enumerable: true,
    writable: false,
  });

  act(() => {
    window.dispatchEvent(event);
  });
}

describe('useClipboardPaste', () => {
  let hasFocusSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    hasFocusSpy = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  });

  afterEach(() => {
    hasFocusSpy.mockRestore();
  });

  it('invokes callback with pasted image files when enabled', () => {
    const onPaste = vi.fn();

    const { rerender, unmount } = renderHook(
      ({ enabled }) => useClipboardPaste({ enabled, onPaste }),
      { initialProps: { enabled: true } },
    );

    const imageFile = new File(['image-data'], 'pasted.png', { type: 'image/png' });

    dispatchPasteEvent({
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => imageFile,
        },
      ],
    });

    expect(onPaste).toHaveBeenCalledTimes(1);
    expect(onPaste).toHaveBeenCalledWith([imageFile]);

    onPaste.mockClear();
    rerender({ enabled: false });

    dispatchPasteEvent({
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => imageFile,
        },
      ],
    });

    expect(onPaste).not.toHaveBeenCalled();

    unmount();
  });

  it('ignores non-image clipboard data', () => {
    const onPaste = vi.fn();

    renderHook(() => useClipboardPaste({ enabled: true, onPaste }));

    dispatchPasteEvent({
      items: [
        {
          kind: 'string',
          type: 'text/plain',
          getAsFile: () => null,
        },
      ],
      files: [new File(['text'], 'note.txt', { type: 'text/plain' })],
    });

    expect(onPaste).not.toHaveBeenCalled();
  });

  it('falls back to clipboard files list when items are unavailable', () => {
    const onPaste = vi.fn();

    renderHook(() => useClipboardPaste({ enabled: true, onPaste }));

    const imageFile = new File(['binary'], 'photo.jpg', { type: 'image/jpeg' });

    dispatchPasteEvent({ files: [imageFile] });

    expect(onPaste).toHaveBeenCalledWith([imageFile]);
  });
});

