import Link from 'next/link';

export default function SiteHeader() {
  return <header className="site-header">
    <Link href="/" className="brand">OneNote Queue</Link>
    <nav aria-label="Main navigation">
      <Link href="/">Overview</Link>
      <Link href="/setup">Set up</Link>
      <Link href="/shortcuts">Shortcuts</Link>
      <Link href="/docs">Docs</Link>
      <a href="https://github.com/DudeThatsErin/onenote-queue" target="_blank" rel="noreferrer">GitHub ↗</a>
    </nav>
  </header>;
}
