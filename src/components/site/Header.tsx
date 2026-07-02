import Link from 'next/link';
import { db } from '@/lib/db';

// Top navigation. Labels come from PageContent.navLabel (admin-editable).
const ORDER = ['tickets','tours','birthday','schools','kindergarten','masterclasses','kvesty','teatr','lektsii','poleznoe','partners','contacts'];

export default async function Header() {
  const pages = await db.pageContent.findMany();
  const byId = Object.fromEntries(pages.map((p) => [p.id, p]));
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--dark)', boxShadow: 'var(--shadow)' }}>
      <nav className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.25rem', flexWrap: 'wrap' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: 'var(--fs-h3)' }}>
          За лесами, за горами
        </Link>
        <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
          {ORDER.map((id) => (
            <Link key={id} href={`/${id}`} style={{ color: 'var(--cream)', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' }}>
              {byId[id]?.navLabel || id}
            </Link>
          ))}
        </div>
        <Link href="/tickets" className="btn btn--gold" style={{ padding: '0.5rem 1rem' }}>
          Купить билет
        </Link>
      </nav>
    </header>
  );
}
