const DB_NAME = 'moodeight-staging';
const STORE_NAME = 'staged-images';
const DB_VERSION = 1;

interface StagedImageData {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  timestamp: number;
}

/**
 * Opens or creates the IndexedDB database for staging images
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Saves files to IndexedDB for persistence across OAuth redirect
 */
export async function saveStagedImages(files: File[]): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  // Clear existing images first
  store.clear();

  // Save new images
  for (const [index, file] of files.entries()) {
    const imageData: StagedImageData = {
      id: `staged-${Date.now()}-${index}`,
      name: file.name || `Image ${index + 1}`,
      type: file.type,
      size: file.size,
      blob: file,
      timestamp: Date.now(),
    };
    store.add(imageData);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Retrieves staged images from IndexedDB and converts back to File objects
 */
export async function getStagedImages(): Promise<File[]> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      const images = request.result as StagedImageData[];
      const files = images.map((img) => new File([img.blob], img.name, { type: img.type }));
      resolve(files);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Clears all staged images from IndexedDB
 */
export async function clearStagedImages(): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  store.clear();

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Checks if there are any staged images
 */
export async function hasStagedImages(): Promise<boolean> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.count();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result > 0);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}
