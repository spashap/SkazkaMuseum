import { db } from './db';

// The single source of CSS control. Reads the active Theme row and renders it
// as :root custom properties. EVERY component styles itself from these vars only.
// Change a value in the admin "Design" page → whole site updates on next load.

export type ThemeRow = Awaited<ReturnType<typeof getTheme>>;

export async function getTheme() {
  const t = await db.theme.findUnique({ where: { id: 1 } });
  // Fallbacks mirror schema defaults so the site renders even before seeding.
  return (
    t ?? {
      fontDisplay: "'Ruslan Display', cursive",
      fontSerif: "'Cormorant Garamond', Georgia, serif",
      fontBody: "'Manrope', system-ui, sans-serif",
      fsHeroXl: 'clamp(2.2rem,6vw,3.8rem)', fsH1: 'clamp(1.6rem,4vw,2.4rem)',
      fsH2: '1.5rem', fsH3: '1.2rem', fsBody: '1rem', fsSmall: '0.85rem', fsCaption: '0.75rem',
      gold: '#C8963E', goldLight: '#E8B96A', crimson: '#8B1A2F', crimsonDark: '#5C1020',
      forest: '#2C4A2E', cream: '#FBF5E6', dark: '#1A1209', text: '#2D2416',
      textLight: '#6B5D45', white: '#FFFFFF',
      radius: '12px', shadow: '0 4px 24px rgba(0,0,0,0.12)',
      shadowLg: '0 8px 40px rgba(0,0,0,0.18)', transition: '0.3s ease',
    }
  );
}

export function themeToCss(t: NonNullable<Awaited<ReturnType<typeof getTheme>>>): string {
  return `:root{
  --font-display:${t.fontDisplay};
  --font-serif:${t.fontSerif};
  --font-body:${t.fontBody};
  --fs-hero-xl:${t.fsHeroXl};
  --fs-h1:${t.fsH1};
  --fs-h2:${t.fsH2};
  --fs-h3:${t.fsH3};
  --fs-body:${t.fsBody};
  --fs-small:${t.fsSmall};
  --fs-caption:${t.fsCaption};
  --gold:${t.gold};
  --gold-light:${t.goldLight};
  --crimson:${t.crimson};
  --crimson-dark:${t.crimsonDark};
  --forest:${t.forest};
  --cream:${t.cream};
  --dark:${t.dark};
  --text:${t.text};
  --text-light:${t.textLight};
  --white:${t.white};
  --radius:${t.radius};
  --shadow:${t.shadow};
  --shadow-lg:${t.shadowLg};
  --transition:${t.transition};
  --fw-regular:400; --fw-semibold:600; --fw-bold:700;
}`;
}
