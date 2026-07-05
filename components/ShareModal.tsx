'use client';

import { FileItem } from '@/lib/types';
import { useEffect, useState } from 'react';

interface ShareModalProps {
  file: FileItem | null;
  onClose: () => void;
  shareToken?: string;
}

export default function ShareModal({ file, onClose, shareToken }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (file && shareToken && typeof window !== 'undefined') {
      const url = `${window.location.origin}/shared?token=${shareToken}&fileId=${file.id}`;
      setShareUrl(url);
    }
  }, [file, shareToken]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!file || !shareUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Share {file.name}
        </h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Share Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Share this link with anyone to let them view your file. No account required!
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
