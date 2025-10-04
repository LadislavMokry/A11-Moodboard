import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LightboxCaptionPanel } from '@/components/LightboxCaptionPanel';

describe('LightboxCaptionPanel', () => {
  it('renders with caption in typographic quotes', () => {
    render(<LightboxCaptionPanel caption="A beautiful sunset" />);

    expect(screen.getByText('"A beautiful sunset"')).toBeInTheDocument();
  });

  it('does not render when caption is null', () => {
    const { container } = render(<LightboxCaptionPanel caption={null} />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render when caption is empty string', () => {
    const { container } = render(<LightboxCaptionPanel caption="" />);

    expect(container.firstChild).toBeNull();
  });

  it('renders toggle button', () => {
    render(<LightboxCaptionPanel caption="Test caption" />);

    const toggleButton = screen.getByLabelText('Hide caption');
    expect(toggleButton).toBeInTheDocument();
  });

  it('starts in open state by default', () => {
    render(<LightboxCaptionPanel caption="Test caption" />);

    const panel = screen.getByText('"Test caption"').closest('div')?.parentElement;
    expect(panel).toHaveClass('translate-x-0');
  });

  it('closes panel when toggle button is clicked', () => {
    render(<LightboxCaptionPanel caption="Test caption" />);

    const toggleButton = screen.getByLabelText('Hide caption');
    fireEvent.click(toggleButton);

    expect(screen.getByLabelText('Show caption')).toBeInTheDocument();
  });

  it('reopens panel when toggle button is clicked again', () => {
    render(<LightboxCaptionPanel caption="Test caption" />);

    const toggleButton = screen.getByLabelText('Hide caption');
    fireEvent.click(toggleButton);

    const showButton = screen.getByLabelText('Show caption');
    fireEvent.click(showButton);

    expect(screen.getByLabelText('Hide caption')).toBeInTheDocument();
  });

  it('is hidden on mobile (md breakpoint)', () => {
    render(<LightboxCaptionPanel caption="Test caption" />);

    const panel = screen.getByText('"Test caption"').closest('div')?.parentElement;
    expect(panel).toHaveClass('hidden');
    expect(panel).toHaveClass('md:flex');
  });

  it('renders with fixed width on desktop', () => {
    render(<LightboxCaptionPanel caption="Test caption" />);

    const panel = screen.getByText('"Test caption"').closest('div')?.parentElement;
    expect(panel).toHaveStyle({ width: '320px' });
  });

  it('handles long captions with scrolling', () => {
    const longCaption = 'Lorem ipsum '.repeat(50);
    render(<LightboxCaptionPanel caption={longCaption} />);

    const contentDiv = screen.getByText(`"${longCaption}"`).parentElement;
    expect(contentDiv).toHaveClass('overflow-y-auto');
  });
});
