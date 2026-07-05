'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileItem, StorageInfo } from '@/lib/types';
import { getStorageInfo, getFile } from '@/lib/db';
import FilePreview from '@/components/FilePreview';
import { formatBytes } from '@/lib/storage';
import Link from 'next/link';
import DarkModeToggle from '@/components/DarkModeToggle';

function SharedContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const fileId = searchParams.get('fileId');

  const [file, setFile] = useState<FileItem | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFile = async () => {
      try {
        if (!token || !fileId) {
          setError('Invalid share link. Token or file ID missing.');
          setLoading(false);
          return;
        }

        const storageInfo = await getStorageInfo();
        setStorage(storageInfo);

        const sharedFile = storageInfo.sharedFiles[token];
        if (!sharedFile || sharedFile.id !== fileId) {
          setError('This file is not shared or the share link has expired.');
          setLoading(false);
          return;
        }

        const loadedFile = await getFile(fileId);
        if (!loadedFile) {
          setError('File not found. It may have been deleted.');
          setLoading(false);
          return;
        }

        setFile(loadedFile);
        setLoading(false);
      } catch (err) {
        console.error('Error loading shared file:', err);
        setError('Failed to load the shared file. Please try again.');
        setLoading(false);
      }
    };

    loadFile();
  }, [token, fileId]);

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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🔗 Shared File</h1>
          <div className="flex gap-2 items-center">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              📁 Files
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <p>Loading shared file...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100 p-4 rounded-lg">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {file && !loading && !error && (
          <div className="space-y-6">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Filename</p>
                  <p className="font-semibold break-all">{file.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Size</p>
                  <p className="font-semibold">{formatBytes(file.size)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Shared On</p>
                  <p className="font-semibold">
                    {token && storage?.sharedFiles[token] &&
                      new Date(storage.sharedFiles[token].createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownload(file)}
                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                ⬇️ Download File
              </button>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Preview</h2>
              <FilePreview file={file} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SharedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SharedContent />
    </Suspense>
  );
}
