'use client';

import { useEffect, useState } from 'react';
import { getMetadata, setMetadata, applyTheme } from '@/lib/storage';
import Link from 'next/link';
import DarkModeToggle from '@/components/DarkModeToggle';

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [quota, setQuota] = useState(50);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const metadata = getMetadata();
    setTheme(metadata.theme);
    setQuota(Math.round(metadata.defaultQuota / (1024 * 1024)));
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setMetadata({ theme: newTheme });
  };

  const handleQuotaChange = (newQuota: number) => {
    setQuota(newQuota);
    setMetadata({ defaultQuota: newQuota * 1024 * 1024 });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">⚙️ Settings</h1>
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
        <div className="space-y-8">
          {/* Theme Settings */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold">Theme</h2>
            <div className="space-y-3">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <label key={t} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="theme"
                    value={t}
                    checked={theme === t}
                    onChange={() => handleThemeChange(t)}
                    className="w-4 h-4"
                  />
                  <span className="capitalize text-sm">
                    {t === 'light' && '☀️ Light'}
                    {t === 'dark' && '🌙 Dark'}
                    {t === 'system' && '🖥️ System'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Storage Settings */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold">Storage</h2>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium mb-2 block">Default Storage Quota (MB)</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={quota}
                  onChange={(e) => handleQuotaChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Current: {quota}MB ({(quota * 1024 * 1024).toLocaleString()} bytes)
                </p>
              </label>
            </div>
          </div>

          {/* About */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold">About</h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-medium">File Upload Manager</span> - A modern web-based file management application
              </p>
              <p>
                <span className="font-medium">Storage:</span> All files are stored locally in your browser using IndexedDB. No data is sent to any server.
              </p>
              <p>
                <span className="font-medium">Privacy:</span> Your files remain completely private and are never uploaded anywhere.
              </p>
              <p>
                <span className="font-medium">Created by:</span> Charlie James
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold">Tips & Tricks</h2>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
              <li>Drag and drop files to upload them quickly</li>
              <li>Right-click on files or folders for more options</li>
              <li>Large images are automatically optimized to save space</li>
              <li>Share files using the share button - no account needed!</li>
              <li>All folders and files are searchable by name</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
