import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { renderFragment } from '@/lib/fragments';
import YandexMap from '@/components/site/YandexMap';

// Renders each page's full original design (from the extracted fragment), with images
// admin-controlled and links corrected. Contacts gets the Yandex map appended (spec 2.3).
// Note: the tours/kvesty/masterclasses/birthday fragments contain a Program-catalog
// marker div that renderFragment fills in with live data from /admin/programs.
const VALID = ['tickets','tours','birthday','schools','kindergarten','masterclasses','kvesty','partners','lektsii','teatr','reviews','contacts','poleznoe','skazki'];

export function generateStaticParams() {
  return VALID.map((page) => ({ page }));
}

export async function generateMetadata({ params }: { params: { page: string } }) {
  const p = await db.pageContent.findUnique({ where: { id: params.page } });
  // No row / empty fields → return nothing so the root layout's title+description apply
  const meta: { title?: string; description?: string } = {};
  if (p?.seoTitle) meta.title = p.seoTitle;
  if (p?.seoDesc) meta.description = p.seoDesc;
  return meta;
}

export default async function Page({ params }: { params: { page: string } }) {
  if (!VALID.includes(params.page)) notFound();
  const html = await renderFragment(params.page);
  if (!html) notFound();
  const settings = params.page === 'contacts' ? await db.companySettings.findUnique({ where: { id: 1 } }) : null;

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {settings && (
        <div className="container" style={{ padding: '1rem 1.25rem 3rem' }}>
          <YandexMap lat={settings.lat} lon={settings.lon} />
        </div>
      )}
    </>
  );
}
