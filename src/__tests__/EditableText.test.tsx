import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EditableText } from '@/components/EditableText';

describe('EditableText', () => {
  it('enters edit mode on click and focuses input', () => {
    const onSave = vi.fn();

    render(
      <EditableText
        value="Moodboard"
        onSave={onSave}
        maxLength={60}
        label="Board name"
      />,
    );

    const trigger = screen.getByRole('button', { name: /board name/i });
    fireEvent.click(trigger);

    const input = screen.getByRole('textbox', { name: /board name/i });
    expect(input).toHaveFocus();
  });

  it('saves trimmed value on Enter', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <EditableText
        value="Moodboard"
        onSave={onSave}
        maxLength={60}
        label="Board name"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /board name/i }));
    const input = screen.getByRole('textbox', { name: /board name/i });

    fireEvent.change(input, { target: { value: '  Updated board  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('Updated board');
    });
    await waitFor(() => {
      expect(screen.queryByRole('textbox', { name: /board name/i })).not.toBeInTheDocument();
    });
  });

  it('cancels edits on Escape', () => {
    const onSave = vi.fn();

    render(
      <EditableText
        value="Moodboard"
        onSave={onSave}
        maxLength={60}
        label="Board name"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /board name/i }));
    const input = screen.getByRole('textbox', { name: /board name/i });

    fireEvent.change(input, { target: { value: 'New Value' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /board name/i })).toHaveTextContent('Moodboard');
  });

  it('shows required validation error', async () => {
    const onSave = vi.fn();

    render(
      <EditableText
        value="Moodboard"
        onSave={onSave}
        maxLength={60}
        label="Board name"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /board name/i }));
    const input = screen.getByRole('textbox', { name: /board name/i });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText('This field is required.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows max length validation error', async () => {
    const onSave = vi.fn();

    render(
      <EditableText
        value="Moodboard"
        onSave={onSave}
        maxLength={10}
        label="Board name"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /board name/i }));
    const input = screen.getByRole('textbox', { name: /board name/i });

    fireEvent.change(input, { target: { value: 'a'.repeat(12) } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText('Must be 10 characters or fewer.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows loading indicator while saving', async () => {
    let resolveSave: (() => void) | undefined;
    const onSave = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );

    render(
      <EditableText
        value="Moodboard"
        onSave={onSave}
        maxLength={60}
        label="Board name"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /board name/i }));
    const input = screen.getByRole('textbox', { name: /board name/i });

    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByRole('status')).toBeInTheDocument();

    await act(async () => {
      resolveSave?.();
    });

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('renders error message when save fails and reverts to previous value', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Failed to save'));

    render(
      <EditableText
        value="Moodboard"
        onSave={onSave}
        maxLength={60}
        label="Board name"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /board name/i }));
    const input = screen.getByRole('textbox', { name: /board name/i });

    fireEvent.change(input, { target: { value: 'Broken Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText('Failed to save')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /board name/i })).toHaveTextContent('Moodboard');
  });

  it('supports multiline mode with character count and blur save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <EditableText
        value=""
        onSave={onSave}
        maxLength={160}
        multiline
        allowEmpty
        placeholder="Add a description..."
        label="Board description"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /board description/i }));
    const textarea = screen.getByRole('textbox', { name: /board description/i });

    expect(textarea.tagName).toBe('TEXTAREA');
    expect(screen.getByText('0 / 160')).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'New description' } });
    expect(screen.getByText('16', { exact: false })).toBeInTheDocument();

    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('New description');
    });
  });
});