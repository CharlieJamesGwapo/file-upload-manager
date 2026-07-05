export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  parentFolderId: string;
  data: Blob;
  createdAt: number;
  thumbnail?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentFolderId: string;
  createdAt: number;
}

export interface StorageInfo {
  totalUsed: number;
  maxQuota: number;
  sharedFiles: { [key: string]: SharedFile };
}

export interface SharedFile {
  id: string;
  token: string;
  expiresAt?: number;
  createdAt: number;
}

export interface FileMetadata {
  theme: 'light' | 'dark' | 'system';
  defaultQuota: number;
}
