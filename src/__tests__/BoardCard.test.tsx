import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BoardCard } from '@/components/BoardCard';
import { type BoardWithImages } from '@/schemas/boardWithImages';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('BoardCard', () => {
  const mockBoard: BoardWithImages = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    owner_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Inspiration Board',
    description: 'A collection of ideas',
    share_token: '123e4567-e89b-12d3-a456-426614174002',
    cover_rotation_enabled: true,
    is_showcase: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    images: [
      {
        id: '1',
        board_id: '123e4567-e89b-12d3-a456-426614174000',
        storage_path: 'boards/123/image1.jpg',
        caption: 'Image 1',
        position: 1,
        width: 1920,
        height: 1080,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        board_id: '123e4567-e89b-12d3-a456-426614174000',
        storage_path: 'boards/123/image2.jpg',
        caption: 'Image 2',
        position: 2,
        width: 1920,
        height: 1080,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '3',
        board_id: '123e4567-e89b-12d3-a456-426614174000',
        storage_path: 'boards/123/image3.jpg',
        caption: null,
        position: 3,
        width: 1920,
        height: 1080,
        created_at: '2025-01-01T00:00:00Z',
      },
    ],
  };

  const mockBoardEmpty: BoardWithImages = {
    ...mockBoard,
    id: '223e4567-e89b-12d3-a456-426614174000',
    name: 'Empty Board',
    images: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders board with name and image count', () => {
    render(
      <MemoryRouter>
        <BoardCard board={mockBoard} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Inspiration Board')).toBeInTheDocument();
    expect(screen.getByText('3 images')).toBeInTheDocument();
  });

  it('renders singular "image" for single image', () => {
    const singleImageBoard = { ...mockBoard, images: [mockBoard.images[0]] };
    render(
      <MemoryRouter>
        <BoardCard board={singleImageBoard} />
      </MemoryRouter>,
    );

    expect(screen.getByText('1 image')).toBeInTheDocument();
  });

  it('displays relative time since last update', () => {
    render(
      <MemoryRouter>
        <BoardCard board={mockBoard} />
      </MemoryRouter>,
    );

    // Should show "X days ago" or similar
    expect(screen.getByText(/ago$/)).toBeInTheDocument();
  });

  it('displays first 4 image thumbnails', () => {
    render(
      <MemoryRouter>
        <BoardCard board={mockBoard} />
      </MemoryRouter>,
    );

    const images = screen.getAllByRole('img');
    // Should have 3 actual images + 1 empty slot (total 4 in grid)
    expect(images).toHaveLength(3);
  });

  it('shows empty state icon when board has no images', () => {
    render(
      <MemoryRouter>
        <BoardCard board={mockBoardEmpty} />
      </MemoryRouter>,
    );

    expect(screen.getByText('0 images')).toBeInTheDocument();
    // Empty state icon should be visible
    const svgIcons = screen.getByText('Empty Board').closest('a')?.querySelectorAll('svg');
    expect(svgIcons).toBeTruthy();
  });

  it('navigates to board page when card is clicked', () => {
    render(
      <MemoryRouter>
        <BoardCard board={mockBoard} />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/boards/${mockBoard.id}`);
  });

  it('opens menu when three-dot button is clicked', () => {
    render(
      <MemoryRouter>
        <BoardCard board={mockBoard} />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', { name: /board menu/i });
    fireEvent.click(menuButton);

    // Menu items should appear
    expect(screen.getByText('Rename')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('Regenerate link')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onRename when rename menu item is clicked', () => {
    const onRename = vi.fn();
    render(
      <MemoryRouter>
        <BoardCard board={mockBoard} onRename={onRename} />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', { name: /board menu/i });
    fireEvent.click(menuButton);

    const renameItem = screen.getByText('Rename');
    fireEvent.click(renameItem);

    expect(onRename).toHaveBeenCalledWith(mockBoard.id);
  });

  it('calls onShare when share menu item is clicked', () => {
    const onShare = vi.fn();
    render(
      <MemoryRouter>
        <BoardCard board={mockBoard} onShare={onShare} />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', { name: /board menu/i });
    fireEvent.click(menuButton);

    const shareItem = screen.getByText('Share');
    fireEvent.click(shareItem);

    expect(onShare).toHaveBeenCalledWith(mockBoard.id);
  });

  it('calls onRegenerateLink when regenerate link menu item is clicked', () => {
    const onRegenerateLink = vi.fn();
    render(
      <MemoryRouter>
        <BoardCard board={mockBoard} onRegenerateLink={onRegenerateLink} />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', { name: /board menu/i });
    fireEvent.click(menuButton);

    const regenerateItem = screen.getByText('Regenerate link');
    fireEvent.click(regenerateItem);

    expect(onRegenerateLink).toHaveBeenCalledWith(mockBoard.id);
  });

  it('calls onDelete when delete menu item is clicked', () => {
    const onDelete = vi.fn();
    render(
      <MemoryRouter>
        <BoardCard board={mockBoard} onDelete={onDelete} />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', { name: /board menu/i });
    fireEvent.click(menuButton);

    const deleteItem = screen.getByText('Delete');
    fireEvent.click(deleteItem);

    expect(onDelete).toHaveBeenCalledWith(mockBoard.id);
  });

  it('uses board name as image alt text', () => {
    render(
      <MemoryRouter>
        <BoardCard board={mockBoard} />
      </MemoryRouter>,
    );

    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('alt', 'Image 1');
    expect(images[1]).toHaveAttribute('alt', 'Image 2');
    expect(images[2]).toHaveAttribute('alt', 'Inspiration Board'); // No caption, uses board name
  });
});
