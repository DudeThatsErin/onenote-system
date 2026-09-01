import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata = {
  title: { default: 'OneNote Queue', template: '%s · OneNote Queue' },
  description: 'Deploy your own private capture API for Microsoft OneNote, then save from Shortcuts and other automations.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
