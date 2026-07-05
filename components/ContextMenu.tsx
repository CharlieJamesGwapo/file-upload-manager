'use client';

import { useEffect, useRef } from 'react';

interface MenuItem {
  label?: string;
  icon?: string;
  onClick?: () => void;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700"
      style={{
        left: `${Math.min(x, window.innerWidth - 200)}px`,
        top: `${Math.min(y, window.innerHeight - 200)}px`,
      }}
    >
      <div className="py-1">
        {items.map((item, index) => (
          <div key={index}>
            {item.divider && <div className="border-t border-gray-200 dark:border-gray-700 my-1" />}
            {!item.divider && item.onClick && (
              <button
                onClick={() => {
                  item.onClick!();
                  onClose();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm flex items-center gap-2 transition-colors"
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
