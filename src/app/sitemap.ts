import type { MetadataRoute } from 'next';

const BASE = 'https://skazkamuseum.ru';

// The 14 public pages + home + legal pages. Keep in sync with VALID in (site)/[page]/page.tsx.
const PAGES = ['', 'tickets', 'tours', 'birthday', 'schools', 'kindergarten', 'masterclasses',
  'kvesty', 'partners', 'lektsii', 'teatr', 'reviews', 'contacts', 'poleznoe', 'skazki',
  'privacy', 'offer', 'consent'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({
    url: p ? `${BASE}/${p}` : BASE,
    changeFrequency: p === '' || p === 'tickets' ? 'weekly' : 'monthly',
    priority: p === '' ? 1 : p === 'tickets' ? 0.9 : 0.7,
  }));
}
