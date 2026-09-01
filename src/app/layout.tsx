import type { Metadata } from 'next';
import './styles.css';
export const metadata: Metadata = { title: 'OneNote Queue', description: 'Your private capture API for Microsoft OneNote.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
