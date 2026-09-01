import Link from 'next/link';
import SetupWizard from '@/components/SetupWizard';
export default function SetupPage() { return <main><header><Link href="/" className="brand">OneNote Queue</Link><nav><Link href="/docs">Docs</Link></nav></header><section className="page-intro"><p className="eyebrow">Guided setup</p><h1>Connect your own OneNote.</h1><p>Progress is remembered in this browser only. Never paste API keys or Microsoft tokens into browser storage.</p></section><SetupWizard /></main>; }
