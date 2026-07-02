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
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
