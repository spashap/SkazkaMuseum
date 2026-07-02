import type { Metadata } from 'next';
import './globals.css';
import './fonts.css';
import { getTheme, themeToCss } from '@/lib/theme';

export const metadata: Metadata = {
  title: {
    default: 'Музей русской сказки «За лесами, за горами» — Санкт-Петербург',
    template: '%s — Музей русской сказки «За лесами, за горами»',
  },
  description:
    'Интерактивный музей русского фольклора в СПб. 21 зона, живые актёры. Экскурсии для детей и школьников.',
  manifest: '/site.webmanifest',
};

// Root layout injects the design tokens (from the Theme row) as :root CSS variables.
// Fonts are SELF-HOSTED (public/fonts + fonts.css, same family names as the theme
// tokens) — no render-blocking Google Fonts request, works without google reachability.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();
  return (
    <html lang="ru">
      <head>
        {/* Above-the-fold fonts (cyrillic subsets): body text + display headings */}
        <link rel="preload" href="/fonts/Manrope-400-cyrillic.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/RuslanDisplay-400-cyrillic.woff2" as="font" type="font/woff2" crossOrigin="" />
        <style dangerouslySetInnerHTML={{ __html: themeToCss(theme) }} />
      </head>
      {/* suppressHydrationWarning: browser extensions (ad blockers etc.) inject attributes
          into <body> before React hydrates, which would otherwise log a false-positive warning */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
