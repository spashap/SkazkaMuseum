import type { Metadata } from 'next';
import './globals.css';
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

// Root layout injects the design tokens (from the Theme row) as :root CSS variables
// and loads the 3 locked fonts. This is what makes "change font in admin → whole site".
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Ruslan+Display&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Manrope:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: themeToCss(theme) }} />
      </head>
      {/* suppressHydrationWarning: browser extensions (ad blockers etc.) inject attributes
          into <body> before React hydrates, which would otherwise log a false-positive warning */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
