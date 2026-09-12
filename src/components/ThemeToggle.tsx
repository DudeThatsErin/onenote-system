'use client';

import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'onenote-system-theme';

function documentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const timer = window.setTimeout(() => setTheme(documentTheme()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const light = theme === 'light';
  const toggle = () => {
    const next: Theme = light ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The theme still changes when private browsing blocks persistence.
    }
  };

  return <button
    className="theme-toggle"
    type="button"
    onClick={toggle}
    aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
    title={light ? 'Switch to dark theme' : 'Switch to light theme'}
  >
    <span aria-hidden="true">{light ? '☾' : '☀'}</span>
  </button>;
}
