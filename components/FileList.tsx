'use client';

import { FileItem } from '@/lib/types';
import { formatBytes } from '@/lib/storage';
import { useState } from 'react';

interface FileListProps {
  files: FileItem[];
  selectedFileId?: string;
  onSelectFile: (file: FileItem) => void;
  onContextMenu: (fileId: string, e: React.MouseEvent) => void;
}

export default function FileList({
  files,
  selectedFileId,
  onSelectFile,
  onContextMenu,
}: FileListProps) {
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'size') {
      comparison = a.size - b.size;
    } else {
      comparison = a.createdAt - b.createdAt;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type === 'application/pdf') return '📄';
    if (
      type === 'application/msword' ||
      type.includes('wordprocessingml')
    ) return '📝';
    if (type.startsWith('text/')) return '📄';
    return '📦';
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <div className="text-4xl mb-2">📂</div>
        <p>No files in this folder</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Sort controls */}
      <div className="flex gap-2 mb-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="date">Date</option>
          <option value="name">Name</option>
          <option value="size">Size</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* File list */}
      <div className="space-y-1">
        {sortedFiles.map((file) => (
          <div
            key={file.id}
            onClick={() => onSelectFile(file)}
            onContextMenu={(e) => onContextMenu(file.id, e)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedFileId === file.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{getFileIcon(file.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <div className="flex gap-4 text-xs opacity-75">
                  <span>{formatBytes(file.size)}</span>
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
