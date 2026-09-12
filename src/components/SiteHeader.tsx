import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

function NavigationLinks() {
  return <>
    <Link href="/">Overview</Link>
    <Link href="/setup">Set up</Link>
    <Link href="/shortcuts">Shortcuts</Link>
    <Link href="/terminal">Terminal</Link>
    <Link href="/docs">Docs</Link>
    <a href="mailto:me@erinskidds.com">Email support</a>
    <a href="https://github.com/DudeThatsErin/onenote-system" target="_blank" rel="noreferrer">GitHub ↗</a>
  </>;
}

export default function SiteHeader() {
  return <header className="site-header">
    <Link href="/" className="brand">OneNote System</Link>
    <nav className="desktop-navigation" aria-label="Main navigation"><NavigationLinks /></nav>
    <ThemeToggle />
    <details className="mobile-navigation">
      <summary aria-label="Toggle navigation">Menu</summary>
      <nav aria-label="Mobile navigation"><NavigationLinks /></nav>
    </details>
  </header>;
}
