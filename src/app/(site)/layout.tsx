import './site.css';
import Script from 'next/script';
import { renderFragment } from '@/lib/fragments';
import { getVersion } from '@/lib/version';

// Public site shell: her original header + footer (with corrected links + admin images),
// her original JS runtime, then our small overrides (routing + forms → /api/leads).
// site.css is imported here so it applies to the public site only, not the admin panel.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [header, footer, version] = await Promise.all([
    renderFragment('header'),
    renderFragment('footer'),
    getVersion(),
  ]);
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: header }} />
      <main>{children}</main>
      <div dangerouslySetInnerHTML={{ __html: footer }} />
      {version && <div className="site-version">{version}</div>}
      <Script src="/site-runtime.js" strategy="afterInteractive" />
      <Script src="/site-overrides.js" strategy="afterInteractive" />
    </>
  );
}
