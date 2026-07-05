'use client';

import { useEffect, useState } from 'react';
import { applyTheme, getMetadata } from '@/lib/storage';

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const metadata = getMetadata();
    setTheme(metadata.theme);
  }, []);

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return <button className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse w-10 h-10" />;
  }

  const themeIcons = {
    light: '☀️',
    dark: '🌙',
    system: '🖥️',
  };

  return (
    <button
      onClick={toggleTheme}
      title={`Current: ${theme}`}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-lg"
    >
      {themeIcons[theme]}
    </button>
  );
}
