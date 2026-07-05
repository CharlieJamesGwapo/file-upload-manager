'use client';

import { useEffect } from 'react';
import { applyTheme, getMetadata } from '@/lib/storage';

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Apply theme on mount
    const metadata = getMetadata();
    applyTheme(metadata.theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const metadata = getMetadata();
      if (metadata.theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return <>{children}</>;
}
