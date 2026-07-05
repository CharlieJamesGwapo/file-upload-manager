import { FileMetadata } from './types';

const METADATA_KEY = 'file_upload_manager_metadata';

export const getMetadata = (): FileMetadata => {
  if (typeof window === 'undefined') {
    return { theme: 'system', defaultQuota: 50 * 1024 * 1024 };
  }

  const stored = localStorage.getItem(METADATA_KEY);
  if (!stored) {
    return { theme: 'system', defaultQuota: 50 * 1024 * 1024 };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return { theme: 'system', defaultQuota: 50 * 1024 * 1024 };
  }
};

export const setMetadata = (metadata: Partial<FileMetadata>): void => {
  if (typeof window === 'undefined') return;

  const current = getMetadata();
  const updated = { ...current, ...metadata };
  localStorage.setItem(METADATA_KEY, JSON.stringify(updated));
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const getTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';

  const metadata = getMetadata();
  if (metadata.theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return metadata.theme;
};

export const applyTheme = (theme: 'light' | 'dark' | 'system'): void => {
  if (typeof window === 'undefined') return;

  const htmlElement = document.documentElement;
  const actualTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  if (actualTheme === 'dark') {
    htmlElement.classList.add('dark');
  } else {
    htmlElement.classList.remove('dark');
  }

  setMetadata({ theme });
};

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateToken = (): string => {
  return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
};
