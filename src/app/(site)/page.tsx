import { preload } from 'react-dom';
import { db } from '@/lib/db';
import { renderFragment } from '@/lib/fragments';

export async function generateMetadata() {
  const p = await db.pageContent.findUnique({ where: { id: 'home' } });
  // Home shows its seoTitle as-is (no "— Музей..." template suffix — it IS the brand title)
  return {
    title: p?.seoTitle ? { absolute: p.seoTitle } : undefined,
    description: p?.seoDesc || undefined,
  };
}

export default async function Home() {
  const html = await renderFragment('home');
  // The hero background is the LCP element; preload it (admin-uploaded override wins,
  // same resolution logic as renderFragment's slot swap).
  const hero = await db.imageSlot.findUnique({ where: { id: 'home_12' } });
  // Default priority on purpose: 'high' makes the 100KB image compete with the
  // render-blocking CSS on slow connections and delays first paint (measured).
  preload(hero?.webpPath || '/seed/home_12.webp', { as: 'image' });
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
