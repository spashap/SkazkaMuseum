// One-off extractor (already run; kept for reproducibility). Pulls her original CSS, JS,
// header/footer, and per-page HTML out of the prototype; decodes every base64 image and
// writes an optimized WebP to public/seed (admin-replaceable); adds lazy-loading; strips
// her inline <style>/<script> and :root (tokens are injected from the Theme row).
// Requires sharp (installed with the app). Run: node scripts/extract-original.mjs
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'projectSpec', 'muzeyskazki_v3_final_244.html');
const FRAG = path.join(ROOT, 'src', 'content', 'fragments');
const SEED = path.join(ROOT, 'public', 'seed');

const PAGES = [['home',912],['tickets',1664],['tours',2121],['birthday',2295],['schools',2441],['kindergarten',2541],['masterclasses',2654],['kvesty',2756],['partners',2931],['lektsii',3061],['teatr',3213],['reviews',3365],['contacts',3409],['poleznoe',3448],['skazki',4104]];
const SKAZKI_END = 4134, HEADER = [867, 911], FOOTER = [4135, 4182];
const CSS_BLOCKS = [[156, 851], [2948, 2948], [3484, 3577]], JS_BLOCKS = [[1741, 2081], [4184, 4402]];
const slice = (l, a, b) => l.slice(a - 1, b).join('\n');
const stripTags = (h, t) => h.replace(new RegExp(`<${t}[^>]*>[\\s\\S]*?</${t}>`, 'gi'), '');

async function saveWebp(b64, slotId, manifest, pageId, n) {
  let w = 1200, h = 800;
  try {
    const buf = Buffer.from(b64, 'base64');
    const img = sharp(buf).resize(1400, 1400, { fit: 'inside', withoutEnlargement: true });
    const meta = await sharp(buf).metadata(); w = meta.width || w; h = meta.height || h;
    await img.webp({ quality: 76 }).toFile(path.join(SEED, `${slotId}.webp`));
  } catch (e) { console.warn('img fail', slotId, e.message); }
  manifest.push({ id: slotId, label: `${pageId} — изображение ${n}`, recW: w, recH: h, seed: `/seed/${slotId}.webp` });
}
async function processImages(html, pageId, manifest, start) {
  let n = start, out = html;
  for (const m of [...out.matchAll(/src=(['"])data:image\/([a-zA-Z]+);base64,([^'"]+)\1/g)]) {
    n++; const id = `${pageId}_${n}`; await saveWebp(m[3], id, manifest, pageId, n);
    out = out.replace(m[0], `src="/seed/${id}.webp"`);
  }
  for (const m of [...out.matchAll(/url\((['"]?)data:image\/([a-zA-Z]+);base64,([^'")]+)\1\)/g)]) {
    n++; const id = `${pageId}_${n}`; await saveWebp(m[3], id, manifest, pageId, n);
    out = out.replace(m[0], `url('/seed/${id}.webp')`);
  }
  out = out.replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async" ');
  return { html: out, next: n };
}
async function main() {
  const lines = (await fs.readFile(SRC, 'utf8')).split('\n');
  await fs.mkdir(FRAG, { recursive: true }); await fs.mkdir(SEED, { recursive: true });
  let css = CSS_BLOCKS.map(([a, b]) => slice(lines, a, b)).join('\n')
    .replace(/<\/?style[^>]*>/gi, '').replace(/:root\s*\{[\s\S]*?\}/, '/* :root tokens injected from Theme row */');
  await fs.writeFile(path.join(ROOT, 'src', 'app', '(site)', 'site.css'), css);
  await fs.writeFile(path.join(ROOT, 'public', 'site-runtime.js'), JS_BLOCKS.map(([a, b]) => slice(lines, a, b)).join('\n\n'));
  const manifest = []; let ic = 0;
  for (const [name, a, b] of [['header', ...HEADER], ['footer', ...FOOTER]]) {
    const r = await processImages(stripTags(stripTags(slice(lines, a, b), 'script'), 'style'), name, manifest, ic);
    ic = r.next; await fs.writeFile(path.join(FRAG, `${name}.html`), r.html);
  }
  for (let i = 0; i < PAGES.length; i++) {
    const [id, s] = PAGES[i]; const e = i < PAGES.length - 1 ? PAGES[i + 1][1] - 1 : SKAZKI_END;
    const r = await processImages(stripTags(stripTags(slice(lines, s, e), 'script'), 'style'), id, manifest, ic);
    ic = r.next; await fs.writeFile(path.join(FRAG, `${id}.html`), r.html);
  }
  await fs.writeFile(path.join(ROOT, 'src', 'content', 'slots.json'), JSON.stringify(manifest, null, 2));
  console.log(`Done. ${manifest.length} slots.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
