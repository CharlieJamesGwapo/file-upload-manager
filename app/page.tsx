'use client';

import { useEffect, useState } from 'react';
import { FileItem, Folder, StorageInfo } from '@/lib/types';
import {
  addFile,
  getFilesByFolder,
  deleteFile,
  getFoldersByParent,
  addFolder,
  updateFolder,
  deleteFolder,
  getStorageInfo,
  updateStorageInfo,
} from '@/lib/db';
import {
  generateId,
  generateToken,
  formatBytes,
} from '@/lib/storage';
import {
  optimizeImage,
  createThumbnail,
  isImageFile,
} from '@/lib/imageOptimization';
import FileUploader from '@/components/FileUploader';
import FolderTree from '@/components/FolderTree';
import FileList from '@/components/FileList';
import FilePreview from '@/components/FilePreview';
import StorageBar from '@/components/StorageBar';
import ShareModal from '@/components/ShareModal';
import ContextMenu from '@/components/ContextMenu';
import DarkModeToggle from '@/components/DarkModeToggle';
import Link from 'next/link';

export default function Home() {
  const [currentFolderId, setCurrentFolderId] = useState('ROOT');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [storage, setStorage] = useState<StorageInfo>({
    totalUsed: 0,
    maxQuota: 50 * 1024 * 1024,
    sharedFiles: {},
  });
  const [selectedFileId, setSelectedFileId] = useState<string>();
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [shareModal, setShareModal] = useState(false);
  const [shareToken, setShareToken] = useState<string>();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'file' | 'folder';
    id: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load current folder's files and subfolders
  useEffect(() => {
    loadFolderContents();
  }, [currentFolderId]);

  // Update selected file when selectedFileId changes
  useEffect(() => {
    const loadFile = async () => {
      if (selectedFileId) {
        const file = files.find((f) => f.id === selectedFileId);
        setSelectedFile(file || null);
      } else {
        setSelectedFile(null);
      }
    };
    loadFile();
  }, [selectedFileId, files]);

  const loadData = async () => {
    try {
      const storagInfo = await getStorageInfo();
      setStorage(storagInfo);

      const allFolders = await getFoldersByParent('ROOT');
      setFolders(allFolders);

      const filesInRoot = await getFilesByFolder('ROOT');
      setFiles(filesInRoot);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadFolderContents = async () => {
    try {
      const filesInFolder = await getFilesByFolder(currentFolderId);
      setFiles(filesInFolder);
      setSelectedFileId(undefined);
    } catch (error) {
      console.error('Error loading folder contents:', error);
    }
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setLoading(true);
    setUploadProgress(`Processing 0/${selectedFiles.length}`);

    try {
      let updatedStorage = storage;

      for (let i = 0; i < selectedFiles.length; i++) {
        let fileBlob: Blob = selectedFiles[i];

        // Optimize image if needed
        if (isImageFile(selectedFiles[i].type)) {
          fileBlob = await optimizeImage(fileBlob);
        }

        // Check storage quota
        if (updatedStorage.totalUsed + fileBlob.size > updatedStorage.maxQuota) {
          setUploadProgress(`Storage full! Max ${formatBytes(updatedStorage.maxQuota)}`);
          break;
        }

        const fileId = generateId();
        const thumbnail = isImageFile(selectedFiles[i].type)
          ? await createThumbnail(fileBlob)
          : undefined;

        const fileItem: FileItem = {
          id: fileId,
          name: selectedFiles[i].name,
          type: selectedFiles[i].type,
          size: fileBlob.size,
          parentFolderId: currentFolderId,
          data: fileBlob,
          createdAt: Date.now(),
          thumbnail,
        };

        await addFile(fileItem);
        updatedStorage.totalUsed += fileBlob.size;

        setUploadProgress(`Processing ${i + 1}/${selectedFiles.length}`);
      }

      await updateStorageInfo(updatedStorage);
      await loadData();
      setUploadProgress('');
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadProgress('Error uploading files');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const folderId = generateId();
      const folder: Folder = {
        id: folderId,
        name: newFolderName,
        parentFolderId: currentFolderId,
        createdAt: Date.now(),
      };

      await addFolder(folder);
      setNewFolderName('');
      await loadData();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      await loadData();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (window.confirm('Delete this folder and all its contents?')) {
      try {
        await deleteFolder(folderId);
        if (currentFolderId === folderId) {
          setCurrentFolderId('ROOT');
        }
        await loadData();
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        await updateFolder({ ...folder, name: newName });
        await loadData();
      }
    } catch (error) {
      console.error('Error renaming folder:', error);
    }
  };

  const handleShare = async (file: FileItem) => {
    const token = generateToken();
    const updatedStorage = {
      ...storage,
      sharedFiles: {
        ...storage.sharedFiles,
        [token]: {
          id: file.id,
          token,
          createdAt: Date.now(),
        },
      },
    };
    await updateStorageInfo(updatedStorage);
    setShareToken(token);
    setShareModal(true);
  };

  const handleDownload = (file: FileItem) => {
    const url = URL.createObjectURL(file.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleContextMenu = (type: 'file' | 'folder', id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  const getContextMenuItems = () => {
    if (!contextMenu) return [];

    if (contextMenu.type === 'file') {
      const file = files.find((f) => f.id === contextMenu.id);
      if (!file) return [];

      return [
        {
          icon: '🔗',
          label: 'Share',
          onClick: () => handleShare(file),
        },
        {
          icon: '⬇️',
          label: 'Download',
          onClick: () => handleDownload(file),
        },
        {
          divider: true,
        },
        {
          icon: '🗑️',
          label: 'Delete',
          onClick: () => handleDeleteFile(file.id),
        },
      ];
    } else {
      return [
        {
          icon: '✏️',
          label: 'Rename',
          onClick: () => {
            const folder = folders.find((f) => f.id === contextMenu.id);
            if (folder) {
              setRenameId(contextMenu.id);
              setRenameName(folder.name);
            }
          },
        },
        {
          divider: true,
        },
        {
          icon: '🗑️',
          label: 'Delete',
          onClick: () => handleDeleteFolder(contextMenu.id),
        },
      ];
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">📁 File Upload Manager</h1>
          <div className="flex gap-2 items-center">
            <Link
              href="/settings"
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              ⚙️ Settings
            </Link>
            <Link
              href="/shared"
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              🔗 Shared
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar - Folders & Storage */}
          <div className="space-y-6">
            {/* Storage bar */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <StorageBar storage={storage} />
            </div>

            {/* Folder tree */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-3">Folders</h3>
              <FolderTree
                currentFolderId={currentFolderId}
                onFolderSelect={setCurrentFolderId}
                onContextMenu={(id, e) => handleContextMenu('folder', id, e)}
                folders={folders}
              />
            </div>

            {/* Create new folder */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">New Folder</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                  }}
                  placeholder="Folder name..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                />
                <button
                  onClick={handleCreateFolder}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  ✓
                </button>
              </div>
            </div>
          </div>

          {/* Right content - Files & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload area */}
            <FileUploader
              onFilesSelected={handleFilesSelected}
              disabled={loading}
            />

            {uploadProgress && (
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 p-4 rounded-lg">
                {uploadProgress}
              </div>
            )}

            {/* File list */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Files</h3>
              <FileList
                files={files}
                selectedFileId={selectedFileId}
                onSelectFile={(file) => setSelectedFileId(file.id)}
                onContextMenu={(id, e) => handleContextMenu('file', id, e)}
              />
            </div>

            {/* Preview panel */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Preview</h3>
              <FilePreview file={selectedFile} />
            </div>
          </div>
        </div>
      </main>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Share modal */}
      <ShareModal
        file={selectedFile}
        onClose={() => setShareModal(false)}
        shareToken={shareToken}
      />

      {/* Rename dialog */}
      {renameId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Rename Folder
            </h2>

            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleRenameFolder(renameId, renameName);
                  setRenameId(null);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setRenameId(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleRenameFolder(renameId, renameName);
                  setRenameId(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
