import { headers } from 'next/headers';

// The `Origin` header is absent on plain top-level GET navigation (e.g. clicking
// a plain <a href> to a PDF/ICS download), so building links from it is
// unreliable — `Host` is sent on virtually every request. Works both in a
// Route Handler (pass `req`) and in a Server Component (call with no args).
export function requestOrigin(req?: Request): string {
  const host = req ? req.headers.get('host') : headers().get('host');
  if (host) {
    const proto = host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https';
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://skazkamuseum.ru';
}
