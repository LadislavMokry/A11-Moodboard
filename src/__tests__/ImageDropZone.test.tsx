import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImageDropZone } from '@/components/ImageDropZone';

function createFile(name: string, type: string) {
  return new File(['content'], name, { type });
}

function createDragEvent(type: string, files: File[]): DragEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      types: ['Files'],
      dropEffect: 'copy',
      effectAllowed: 'all',
    },
  });
  return event;
}

const dragTarget = typeof window !== 'undefined' ? window : globalThis;

describe('ImageDropZone', () => {
  it('shows overlay on drag enter and hides after drop', () => {
    const handleDrop = vi.fn();
    render(
      <ImageDropZone onDropFiles={handleDrop}>
        <div>Board content</div>
      </ImageDropZone>,
    );

    const file = createFile('photo.jpg', 'image/jpeg');

    act(() => {
      dragTarget.dispatchEvent(createDragEvent('dragenter', [file]));
    });

    expect(screen.getByText('Drop images here')).toBeInTheDocument();

    act(() => {
      dragTarget.dispatchEvent(createDragEvent('drop', [file]));
    });

    expect(handleDrop).toHaveBeenCalledWith([file]);
    expect(screen.queryByText('Drop images here')).not.toBeInTheDocument();
  });

  it('does not accept unsupported file types', () => {
    const handleDrop = vi.fn();
    render(
      <ImageDropZone onDropFiles={handleDrop}>
        <div>Board content</div>
      </ImageDropZone>,
    );

    const invalidFile = createFile('notes.txt', 'text/plain');

    act(() => {
      dragTarget.dispatchEvent(createDragEvent('dragenter', [invalidFile]));
      dragTarget.dispatchEvent(createDragEvent('drop', [invalidFile]));
    });

    expect(handleDrop).not.toHaveBeenCalled();
    expect(screen.queryByText('Drop images here')).not.toBeInTheDocument();
  });

  it('remains inactive when disabled', () => {
    const handleDrop = vi.fn();
    render(
      <ImageDropZone onDropFiles={handleDrop} disabled>
        <div>Board content</div>
      </ImageDropZone>,
    );

    const file = createFile('photo.jpg', 'image/jpeg');

    act(() => {
      dragTarget.dispatchEvent(createDragEvent('dragenter', [file]));
      dragTarget.dispatchEvent(createDragEvent('drop', [file]));
    });

    expect(screen.queryByText('Drop images here')).not.toBeInTheDocument();
    expect(handleDrop).not.toHaveBeenCalled();
  });
});