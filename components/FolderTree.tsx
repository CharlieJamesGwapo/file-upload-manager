'use client';

import { useEffect, useState } from 'react';
import { Folder } from '@/lib/types';
import { getFoldersByParent } from '@/lib/db';

interface FolderTreeProps {
  currentFolderId: string;
  onFolderSelect: (folderId: string) => void;
  onContextMenu: (folderId: string, e: React.MouseEvent) => void;
  folders: Folder[];
}

interface TreeItem extends Folder {
  children: TreeItem[];
}

export default function FolderTree({
  currentFolderId,
  onFolderSelect,
  onContextMenu,
  folders,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['ROOT']));
  const [tree, setTree] = useState<TreeItem[]>([]);

  useEffect(() => {
    // Build tree structure
    const buildTree = (parentId: string): TreeItem[] => {
      return folders
        .filter((f) => f.parentFolderId === parentId)
        .map((f) => ({
          ...f,
          children: buildTree(f.id),
        }));
    };

    const rootFolders = buildTree('ROOT');
    setTree(rootFolders);
  }, [folders]);

  const toggleExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: TreeItem, level: number = 0) => (
    <div key={folder.id}>
      <button
        onClick={() => onFolderSelect(folder.id)}
        onContextMenu={(e) => onContextMenu(folder.id, e)}
        className={`w-full text-left px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
          currentFolderId === folder.id
            ? 'bg-blue-500 text-white'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
        }`}
        style={{ paddingLeft: `${level * 20 + 16}px` }}
      >
        <span className="inline-block mr-2">
          {folder.children.length > 0 ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(folder.id);
              }}
              className="cursor-pointer"
            >
              {expandedFolders.has(folder.id) ? '▼' : '▶'}
            </span>
          ) : (
            <span className="opacity-0">▶</span>
          )}
        </span>
        <span>📁 {folder.name}</span>
      </button>
      {expandedFolders.has(folder.id) && folder.children.length > 0 && (
        <div>
          {folder.children.map((child) => renderFolder(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full space-y-1">
      <button
        onClick={() => onFolderSelect('ROOT')}
        onContextMenu={(e) => onContextMenu('ROOT', e)}
        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
          currentFolderId === 'ROOT'
            ? 'bg-blue-500 text-white'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        🏠 My Files
      </button>
      {tree.map((folder) => renderFolder(folder))}
    </div>
  );
}
