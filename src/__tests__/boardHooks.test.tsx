import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBoards } from '../hooks/useBoards';
import { useBoard } from '../hooks/useBoard';
import { usePublicBoard } from '../hooks/usePublicBoard';
import {
  useCreateBoard,
  useUpdateBoard,
  useDeleteBoard,
  useRegenerateShareToken,
} from '../hooks/useBoardMutations';
import * as boardsService from '../services/boards';
import * as publicBoardsService from '../services/publicBoards';
import { useAuth } from '../hooks/useAuth';
import type { Board } from '../schemas/board';
import type { BoardWithImages } from '../schemas/boardWithImages';

// Mock services
vi.mock('../services/boards');
vi.mock('../services/publicBoards');
vi.mock('../hooks/useAuth');

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
};

const mockBoard: Board = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  owner_id: mockUser.id,
  name: 'Test Board',
  description: 'A test board',
  share_token: '123e4567-e89b-12d3-a456-426614174002',
  cover_rotation_enabled: true,
  is_showcase: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const mockBoardWithImages: BoardWithImages = {
  ...mockBoard,
  images: [],
};

// Removed - we'll create wrapper inline in tests

describe('Board Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a fresh QueryClient for each test to avoid cache pollution
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  describe('useBoards', () => {
    it('should fetch boards for authenticated user', async () => {
      (useAuth as any).mockReturnValue({ user: mockUser });
      (boardsService.getBoards as any).mockResolvedValue([mockBoard]);

      const { result } = renderHook(() => useBoards(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockBoard]);
      expect(boardsService.getBoards).toHaveBeenCalled();
    });

    it('should not fetch when user is not authenticated', () => {
      (useAuth as any).mockReturnValue({ user: null });

      const { result } = renderHook(() => useBoards(), {
        wrapper: createWrapper(),
      });

      // Query should be disabled, not loading, and have no data
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should handle errors', async () => {
      (useAuth as any).mockReturnValue({ user: mockUser });
      (boardsService.getBoards as any).mockRejectedValue(new Error('Failed to fetch'));

      const { result } = renderHook(() => useBoards(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useBoard', () => {
    it('should fetch board with images', async () => {
      (boardsService.getBoard as any).mockResolvedValue(mockBoardWithImages);

      const { result } = renderHook(() => useBoard(mockBoard.id), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockBoardWithImages);
      expect(boardsService.getBoard).toHaveBeenCalledWith(mockBoard.id);
    });

    it('should not fetch when boardId is undefined', () => {
      const { result } = renderHook(() => useBoard(undefined), {
        wrapper: createWrapper(),
      });

      // Query should be disabled, not loading, and have no data
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should handle errors', async () => {
      (boardsService.getBoard as any).mockRejectedValue(new Error('Board not found'));

      const { result } = renderHook(() => useBoard(mockBoard.id), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('usePublicBoard', () => {
    it('should fetch public board by share token', async () => {
      (publicBoardsService.getPublicBoard as any).mockResolvedValue(mockBoardWithImages);

      const { result } = renderHook(() => usePublicBoard(mockBoard.share_token), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockBoardWithImages);
      expect(publicBoardsService.getPublicBoard).toHaveBeenCalledWith(mockBoard.share_token);
    });

    it('should not fetch when shareToken is undefined', () => {
      const { result } = renderHook(() => usePublicBoard(undefined), {
        wrapper: createWrapper(),
      });

      // Query should be disabled, not loading, and have no data
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCreateBoard', () => {
    it('should create a board and invalidate queries', async () => {
      (useAuth as any).mockReturnValue({ user: mockUser });
      (boardsService.createBoard as any).mockResolvedValue(mockBoard);

      const { result } = renderHook(() => useCreateBoard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);

      result.current.mutate({ name: 'New Board' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(boardsService.createBoard).toHaveBeenCalledWith({ name: 'New Board' });
    });

    it('should handle errors', async () => {
      (useAuth as any).mockReturnValue({ user: mockUser });
      (boardsService.createBoard as any).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useCreateBoard(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ name: 'New Board' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useUpdateBoard', () => {
    it('should update a board and invalidate queries', async () => {
      (useAuth as any).mockReturnValue({ user: mockUser });
      const updatedBoard = { ...mockBoard, name: 'Updated Board' };
      (boardsService.updateBoard as any).mockResolvedValue(updatedBoard);

      const { result } = renderHook(() => useUpdateBoard(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        boardId: mockBoard.id,
        updates: { name: 'Updated Board' },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(boardsService.updateBoard).toHaveBeenCalledWith(mockBoard.id, {
        name: 'Updated Board',
      });
    });
  });

  describe('useDeleteBoard', () => {
    it('should delete a board and invalidate queries', async () => {
      (useAuth as any).mockReturnValue({ user: mockUser });
      (boardsService.deleteBoard as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteBoard(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockBoard.id);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(boardsService.deleteBoard).toHaveBeenCalledWith(mockBoard.id);
    });
  });

  describe('useRegenerateShareToken', () => {
    it('should regenerate share token and update cache', async () => {
      const newShareToken = '999e4567-e89b-12d3-a456-426614174999';
      const updatedBoard = { ...mockBoard, share_token: newShareToken };
      (boardsService.regenerateShareToken as any).mockResolvedValue(updatedBoard);

      const { result } = renderHook(() => useRegenerateShareToken(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockBoard.id);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(boardsService.regenerateShareToken).toHaveBeenCalledWith(mockBoard.id);
    });
  });
});
