'use client';

import { FileItem } from '@/lib/types';
import { formatBytes } from '@/lib/storage';
import { useEffect, useState } from 'react';

interface FilePreviewProps {
  file: FileItem | null;
}

export default function FilePreview({ file }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewText, setPreviewText] = useState<string>('');

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      setPreviewText('');
      return;
    }

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file.data);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    if (file.type === 'application/pdf') {
      const url = URL.createObjectURL(file.data);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    if (file.type.startsWith('text/') || file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setPreviewText(text.substring(0, 5000));
      };
      reader.readAsText(file.data);
    }
  }, [file]);

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <div className="text-6xl mb-2">👀</div>
        <p>Select a file to preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
          {file.name}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <p className="font-medium">Size</p>
            <p>{formatBytes(file.size)}</p>
          </div>
          <div>
            <p className="font-medium">Type</p>
            <p className="truncate">{file.type}</p>
          </div>
          <div className="col-span-2">
            <p className="font-medium">Created</p>
            <p>{new Date(file.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden" style={{ maxHeight: '400px' }}>
        {file.type.startsWith('image/') && previewUrl && (
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-contain"
          />
        )}
        {file.type === 'application/pdf' && previewUrl && (
          <iframe
            src={previewUrl}
            className="w-full h-full border-none"
            style={{ minHeight: '400px' }}
          />
        )}
        {(file.type.startsWith('text/') || file.type === 'application/json') && (
          <pre className="p-4 overflow-auto text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
            {previewText}
          </pre>
        )}
        {!previewUrl && !previewText && (
          <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
            <div>
              <div className="text-3xl mb-2">📋</div>
              <p>Preview not available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
