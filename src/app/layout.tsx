import type { Metadata, Viewport } from 'next';
import './styles.css';

const THEME_SCRIPT = `(function(){try{var key='onenote-system-theme';var saved=localStorage.getItem(key);var theme=saved==='light'||saved==='dark'?saved:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',theme);}catch(error){}})();`;

export const metadata: Metadata = {
  title: { default: 'OneNote System', template: '%s · OneNote System' },
  description: 'Deploy your own private capture API for Microsoft OneNote, then save from Apple Shortcuts, the onenotesystem terminal client, Discord, and other automations.',
  metadataBase: new URL('https://onenotesystem.erinskidds.com'),
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
    <body>{children}</body>
  </html>;
}
