import {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  regenerateShareToken,
} from '../services/boards';
import { getPublicBoard } from '../services/publicBoards';
import { supabase } from '../lib/supabase';
import { BoardNotFoundError, BoardOwnershipError, ValidationError } from '../lib/errors';
import type { Board } from '../schemas/board';
import type { BoardWithImages } from '../schemas/boardWithImages';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('Board Services', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };

  const mockBoard: Board = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    owner_id: mockUser.id,
    name: 'My Board',
    description: 'Test board',
    share_token: '123e4567-e89b-12d3-a456-426614174002',
    cover_rotation_enabled: true,
    is_showcase: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBoards', () => {
    it('should fetch all boards for authenticated user', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [mockBoard], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getBoards();

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('boards');
      expect(mockEq).toHaveBeenCalledWith('owner_id', mockUser.id);
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(result).toEqual([mockBoard]);
    });

    it('should throw error when not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

      await expect(getBoards()).rejects.toThrow(BoardOwnershipError);
    });

    it('should throw error on database failure', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      (supabase.from as any).mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });

      await expect(getBoards()).rejects.toThrow('Failed to fetch boards');
    });
  });

  describe('getBoard', () => {
    it('should fetch single board with images', async () => {
      const mockBoardWithImages: BoardWithImages = {
        ...mockBoard,
        images: [
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            board_id: mockBoard.id,
            storage_path: 'boards/123/image.jpg',
            position: 1,
            mime_type: 'image/jpeg',
            width: 1920,
            height: 1080,
            size_bytes: 50000,
            original_filename: 'image.jpg',
            source_url: null,
            caption: 'Test image',
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
      };

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockBoardWithImages, error: null });

      (supabase.from as any).mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ single: mockSingle });

      const result = await getBoard(mockBoard.id);

      expect(result).toEqual(mockBoardWithImages);
    });

    it('should throw BoardNotFoundError when board does not exist', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      (supabase.from as any).mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ single: mockSingle });

      await expect(getBoard('nonexistent-id')).rejects.toThrow(BoardNotFoundError);
    });
  });

  describe('createBoard', () => {
    it('should create a new board', async () => {
      const newBoardData = {
        name: 'New Board',
        description: 'A new test board',
      };

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockBoard, error: null });

      (supabase.from as any).mockReturnValue({ insert: mockInsert });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const result = await createBoard(newBoardData);

      expect(supabase.from).toHaveBeenCalledWith('boards');
      expect(mockInsert).toHaveBeenCalledWith({
        ...newBoardData,
        owner_id: mockUser.id,
      });
      expect(result).toEqual(mockBoard);
    });

    it('should throw ValidationError on duplicate board name', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Duplicate' },
      });

      (supabase.from as any).mockReturnValue({ insert: mockInsert });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await expect(createBoard({ name: 'Duplicate' })).rejects.toThrow(ValidationError);
    });
  });

  describe('updateBoard', () => {
    it('should update board fields', async () => {
      const updates = { name: 'Updated Name' };
      const updatedBoard = { ...mockBoard, name: 'Updated Name' };

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedBoard, error: null });

      (supabase.from as any).mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const result = await updateBoard(mockBoard.id, updates);

      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(result).toEqual(updatedBoard);
    });

    it('should throw BoardNotFoundError when board does not exist', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      (supabase.from as any).mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      await expect(updateBoard('nonexistent-id', { name: 'Test' })).rejects.toThrow(BoardNotFoundError);
    });
  });

  describe('deleteBoard', () => {
    it('should delete a board', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockBoard, error: null });

      (supabase.from as any).mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ single: mockSingle });

      (supabase.functions.invoke as any).mockResolvedValue({ error: null });

      await deleteBoard(mockBoard.id);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('delete_board', {
        body: { board_id: mockBoard.id },
      });
    });

    it('should throw BoardNotFoundError when board does not exist', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      (supabase.from as any).mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ single: mockSingle });

      await expect(deleteBoard('nonexistent-id')).rejects.toThrow(BoardNotFoundError);
    });
  });

  describe('regenerateShareToken', () => {
    it('should regenerate share token', async () => {
      const newShareToken = '999e4567-e89b-12d3-a456-426614174999';
      const updatedBoard = { ...mockBoard, share_token: newShareToken };

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });

      // Mock crypto.randomUUID
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(newShareToken);

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq1 = vi.fn().mockReturnThis();
      const mockEq2 = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedBoard, error: null });

      (supabase.from as any).mockReturnValue({ update: mockUpdate });
      mockUpdate.mockReturnValue({ eq: mockEq1 });
      mockEq1.mockReturnValue({ eq: mockEq2 });
      mockEq2.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });

      const result = await regenerateShareToken(mockBoard.id);

      expect(result.share_token).toBe(newShareToken);
    });
  });

  describe('getPublicBoard', () => {
    it('should fetch public board by share token', async () => {
      const mockPublicBoardData = {
        board: mockBoard,
        owner: {
          id: mockUser.id,
          display_name: 'Test User',
          avatar_url: null,
        },
        images: [
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            board_id: mockBoard.id,
            storage_path: 'boards/123/image.jpg',
            position: 1,
            mime_type: 'image/jpeg',
            width: 1920,
            height: 1080,
            size_bytes: 50000,
            original_filename: 'image.jpg',
            source_url: null,
            caption: 'Test image',
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
      };

      (supabase.rpc as any).mockResolvedValue({ data: mockPublicBoardData, error: null });

      const result = await getPublicBoard(mockBoard.share_token);

      expect(supabase.rpc).toHaveBeenCalledWith('get_public_board', {
        p_share_token: mockBoard.share_token,
      });
      expect(result).toHaveProperty('images');
      expect(result.images).toBeInstanceOf(Array);
    });

    it('should throw BoardNotFoundError when share token is invalid', async () => {
      (supabase.rpc as any).mockResolvedValue({ data: null, error: null });

      await expect(getPublicBoard('invalid-token')).rejects.toThrow(BoardNotFoundError);
    });

    it('should throw error on RPC failure', async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });

      await expect(getPublicBoard('some-token')).rejects.toThrow('Failed to fetch public board');
    });
  });
});
