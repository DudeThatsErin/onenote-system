import SetupWizard from '@/components/SetupWizard';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export default function SetupPage() {
  return <main>
    <SiteHeader />
    <section className="page-intro">
      <p className="eyebrow">Guided setup</p>
      <h1>Connect your own OneNote.</h1>
      <p className="lead">Work through one part at a time. Each step explains what you are creating, why it is needed, where to click, and which values must stay private.</p>
      <p className="fine-print">This browser remembers only the last numbered step you viewed. Secrets and Microsoft tokens are never stored in browser localStorage.</p>
    </section>
    <SetupWizard />
    <SiteFooter />
  </main>;
}
