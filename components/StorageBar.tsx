'use client';

import { formatBytes } from '@/lib/storage';
import { StorageInfo } from '@/lib/types';

interface StorageBarProps {
  storage: StorageInfo;
}

export default function StorageBar({ storage }: StorageBarProps) {
  const percentage = (storage.totalUsed / storage.maxQuota) * 100;
  const isWarning = percentage > 75;
  const isCritical = percentage > 90;

  const getBarColor = () => {
    if (isCritical) return 'bg-red-500';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Storage Usage
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatBytes(storage.totalUsed)} / {formatBytes(storage.maxQuota)}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getBarColor()} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {percentage > 0 && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {Math.round(percentage)}% used
        </p>
      )}
    </div>
  );
}
