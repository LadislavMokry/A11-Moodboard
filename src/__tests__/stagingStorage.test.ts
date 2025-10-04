import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveStagedImages,
  getStagedImages,
  clearStagedImages,
  hasStagedImages,
} from '@/lib/stagingStorage';

// Mock IndexedDB with proper async behavior
class IDBDatabaseMock {
  objectStoreNames = {
    contains: vi.fn().mockReturnValue(false),
  };
  transaction = vi.fn();
  close = vi.fn();
  createObjectStore = vi.fn();
}

class IDBTransactionMock {
  oncomplete: (() => void) | null = null;
  onerror: ((error: Error) => void) | null = null;
  objectStore = vi.fn();

  triggerComplete() {
    if (this.oncomplete) {
      this.oncomplete();
    }
  }
}

class IDBObjectStoreMock {
  data: Map<string, any> = new Map();

  add = vi.fn((item: any) => {
    this.data.set(item.id, item);
    return { onsuccess: null, onerror: null };
  });

  getAll = vi.fn(() => {
    const request = {
      result: Array.from(this.data.values()),
      onsuccess: null as (() => void) | null,
      onerror: null as ((error: Error) => void) | null,
    };
    setTimeout(() => request.onsuccess?.(), 0);
    return request;
  });

  clear = vi.fn(() => {
    this.data.clear();
    return { onsuccess: null, onerror: null };
  });

  count = vi.fn(() => {
    const request = {
      result: this.data.size,
      onsuccess: null as (() => void) | null,
      onerror: null as ((error: Error) => void) | null,
    };
    setTimeout(() => request.onsuccess?.(), 0);
    return request;
  });
}

describe('stagingStorage', () => {
  let mockDB: IDBDatabaseMock;
  let mockTransaction: IDBTransactionMock;
  let mockStore: IDBObjectStoreMock;

  beforeEach(() => {
    mockDB = new IDBDatabaseMock();
    mockTransaction = new IDBTransactionMock();
    mockStore = new IDBObjectStoreMock();

    mockDB.transaction.mockReturnValue(mockTransaction);
    mockTransaction.objectStore.mockReturnValue(mockStore);

    // Mock indexedDB.open with proper async behavior
    global.indexedDB = {
      open: vi.fn((name, version) => {
        const request = {
          result: mockDB,
          onsuccess: null as (() => void) | null,
          onerror: null as ((error: Error) => void) | null,
          onupgradeneeded: null as ((event: any) => void) | null,
        };

        setTimeout(() => {
          if (request.onupgradeneeded) {
            request.onupgradeneeded({ target: request });
          }
          setTimeout(() => request.onsuccess?.(), 0);
        }, 0);

        return request;
      }),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('saves files to IndexedDB', async () => {
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'test2.png', { type: 'image/png' });

    const savePromise = saveStagedImages([file1, file2]);

    // Trigger transaction complete
    await new Promise((resolve) => setTimeout(resolve, 10));
    mockTransaction.triggerComplete();

    await savePromise;

    expect(mockStore.clear).toHaveBeenCalled();
    expect(mockStore.add).toHaveBeenCalledTimes(2);
    expect(mockDB.close).toHaveBeenCalled();
  });

  it('retrieves files from IndexedDB', async () => {
    const blob1 = new Blob(['content1'], { type: 'image/jpeg' });
    const blob2 = new Blob(['content2'], { type: 'image/png' });

    mockStore.data.set('1', {
      id: '1',
      name: 'test1.jpg',
      type: 'image/jpeg',
      blob: blob1,
    });
    mockStore.data.set('2', {
      id: '2',
      name: 'test2.png',
      type: 'image/png',
      blob: blob2,
    });

    const files = await getStagedImages();

    expect(files).toHaveLength(2);
    expect(files[0].name).toBe('test1.jpg');
    expect(files[1].name).toBe('test2.png');
    expect(mockDB.close).toHaveBeenCalled();
  });

  it('clears all staged images', async () => {
    mockStore.data.set('1', {
      id: '1',
      name: 'test.jpg',
      type: 'image/jpeg',
      blob: new Blob(['content']),
    });

    const clearPromise = clearStagedImages();

    // Trigger transaction complete
    await new Promise((resolve) => setTimeout(resolve, 10));
    mockTransaction.triggerComplete();

    await clearPromise;

    expect(mockStore.clear).toHaveBeenCalled();
    expect(mockDB.close).toHaveBeenCalled();
  });

  it('checks if there are staged images', async () => {
    mockStore.data.clear();
    const hasNone = await hasStagedImages();
    expect(hasNone).toBe(false);

    mockStore.data.set('1', {
      id: '1',
      name: 'test.jpg',
      type: 'image/jpeg',
      blob: new Blob(['content']),
    });

    const hasImages = await hasStagedImages();
    expect(hasImages).toBe(true);
    expect(mockDB.close).toHaveBeenCalled();
  });

  it('handles empty file array', async () => {
    const savePromise = saveStagedImages([]);

    // Trigger transaction complete
    await new Promise((resolve) => setTimeout(resolve, 10));
    mockTransaction.triggerComplete();

    await savePromise;

    expect(mockStore.clear).toHaveBeenCalled();
    expect(mockStore.add).not.toHaveBeenCalled();
  });

  it('creates object store on upgrade', async () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    const savePromise = saveStagedImages([file]);

    // Trigger transaction complete
    await new Promise((resolve) => setTimeout(resolve, 10));
    mockTransaction.triggerComplete();

    await savePromise;

    expect(mockDB.createObjectStore).toHaveBeenCalledWith('staged-images', { keyPath: 'id' });
  });
});
