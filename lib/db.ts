import { FileItem, Folder, StorageInfo } from './types';

const DB_NAME = 'FileUploadManager';
const DB_VERSION = 1;
const FILES_STORE = 'files';
const FOLDERS_STORE = 'folders';
const STORAGE_STORE = 'storage';

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!database.objectStoreNames.contains(FILES_STORE)) {
        const fileStore = database.createObjectStore(FILES_STORE, { keyPath: 'id' });
        fileStore.createIndex('parentFolderId', 'parentFolderId');
        fileStore.createIndex('createdAt', 'createdAt');
      }

      if (!database.objectStoreNames.contains(FOLDERS_STORE)) {
        const folderStore = database.createObjectStore(FOLDERS_STORE, { keyPath: 'id' });
        folderStore.createIndex('parentFolderId', 'parentFolderId');
      }

      if (!database.objectStoreNames.contains(STORAGE_STORE)) {
        database.createObjectStore(STORAGE_STORE, { keyPath: 'key' });
      }
    };
  });
};

// File operations
export const addFile = async (file: FileItem): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FILES_STORE, STORAGE_STORE], 'readwrite');
    const fileStore = transaction.objectStore(FILES_STORE);
    const storageStore = transaction.objectStore(STORAGE_STORE);

    fileStore.add(file);

    // Update storage info
    const storageRequest = storageStore.get('info');
    storageRequest.onsuccess = () => {
      const storage = (storageRequest.result as StorageInfo) || {
        totalUsed: 0,
        maxQuota: 50 * 1024 * 1024, // 50MB
        sharedFiles: {},
      };
      storage.totalUsed += file.size;
      storageStore.put({ key: 'info', ...storage });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getFile = async (id: string): Promise<FileItem | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FILES_STORE], 'readonly');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getFilesByFolder = async (parentFolderId: string): Promise<FileItem[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FILES_STORE], 'readonly');
    const store = transaction.objectStore(FILES_STORE);
    const index = store.index('parentFolderId');
    const request = index.getAll(parentFolderId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteFile = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FILES_STORE, STORAGE_STORE], 'readwrite');
    const fileStore = transaction.objectStore(FILES_STORE);
    const storageStore = transaction.objectStore(STORAGE_STORE);

    // Get file first to get its size
    const getRequest = fileStore.get(id);
    getRequest.onsuccess = () => {
      const file = getRequest.result as FileItem;
      if (file) {
        fileStore.delete(id);

        // Update storage info
        const storageRequest = storageStore.get('info');
        storageRequest.onsuccess = () => {
          const storage = (storageRequest.result as StorageInfo) || {
            totalUsed: 0,
            maxQuota: 50 * 1024 * 1024,
            sharedFiles: {},
          };
          storage.totalUsed = Math.max(0, storage.totalUsed - file.size);
          storageStore.put({ key: 'info', ...storage });
        };
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const updateFile = async (file: FileItem): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FILES_STORE], 'readwrite');
    const store = transaction.objectStore(FILES_STORE);
    store.put(file);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Folder operations
export const addFolder = async (folder: Folder): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FOLDERS_STORE], 'readwrite');
    const store = transaction.objectStore(FOLDERS_STORE);
    store.add(folder);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getFolder = async (id: string): Promise<Folder | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FOLDERS_STORE], 'readonly');
    const store = transaction.objectStore(FOLDERS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getFoldersByParent = async (parentFolderId: string): Promise<Folder[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FOLDERS_STORE], 'readonly');
    const store = transaction.objectStore(FOLDERS_STORE);
    const index = store.index('parentFolderId');
    const request = index.getAll(parentFolderId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updateFolder = async (folder: Folder): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FOLDERS_STORE], 'readwrite');
    const store = transaction.objectStore(FOLDERS_STORE);
    store.put(folder);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const deleteFolder = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FILES_STORE, FOLDERS_STORE], 'readwrite');
    const fileStore = transaction.objectStore(FILES_STORE);
    const folderStore = transaction.objectStore(FOLDERS_STORE);
    const storageStore = transaction.objectStore(STORAGE_STORE);

    // Delete all files in folder
    const fileIndex = fileStore.index('parentFolderId');
    const fileRequest = fileIndex.getAll(id);
    fileRequest.onsuccess = () => {
      const files = fileRequest.result as FileItem[];
      let totalSizeToDelete = 0;
      files.forEach((file) => {
        totalSizeToDelete += file.size;
        fileStore.delete(file.id);
      });

      // Update storage
      if (totalSizeToDelete > 0) {
        const storageRequest = storageStore.get('info');
        storageRequest.onsuccess = () => {
          const storage = (storageRequest.result as StorageInfo) || {
            totalUsed: 0,
            maxQuota: 50 * 1024 * 1024,
            sharedFiles: {},
          };
          storage.totalUsed = Math.max(0, storage.totalUsed - totalSizeToDelete);
          storageStore.put({ key: 'info', ...storage });
        };
      }
    };

    // Delete folder
    folderStore.delete(id);

    // Delete subfolders recursively
    const folderIndex = folderStore.index('parentFolderId');
    const folderRequest = folderIndex.getAll(id);
    folderRequest.onsuccess = () => {
      const folders = folderRequest.result as Folder[];
      folders.forEach((folder) => {
        deleteFolder(folder.id);
      });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Storage operations
export const getStorageInfo = async (): Promise<StorageInfo> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORAGE_STORE], 'readonly');
    const store = transaction.objectStore(STORAGE_STORE);
    const request = store.get('info');

    request.onsuccess = () => {
      const result = request.result as StorageInfo | undefined;
      resolve(
        result || {
          totalUsed: 0,
          maxQuota: 50 * 1024 * 1024,
          sharedFiles: {},
        }
      );
    };
    request.onerror = () => reject(request.error);
  });
};

export const updateStorageInfo = async (info: StorageInfo): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORAGE_STORE], 'readwrite');
    const store = transaction.objectStore(STORAGE_STORE);
    store.put({ key: 'info', ...info });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getAllFiles = async (): Promise<FileItem[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FILES_STORE], 'readonly');
    const store = transaction.objectStore(FILES_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllFolders = async (): Promise<Folder[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([FOLDERS_STORE], 'readonly');
    const store = transaction.objectStore(FOLDERS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
