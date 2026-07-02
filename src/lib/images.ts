import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { db } from './db';

// On upload: resize to the slot's recommended size, produce a WebP + JPG fallback +
// a tiny blurred base64 placeholder (LQIP) for smooth lazy loading. Keeps the site light.
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function processAndStore(slotId: string, buffer: Buffer) {
  const slot = await db.imageSlot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error('unknown slot: ' + slotId);
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const base = sharp(buffer).resize(slot.recW, slot.recH, { fit: 'cover' });

  const webpName = `${slotId}.webp`;
  const jpgName = `${slotId}.jpg`;
  await base.clone().webp({ quality: 78 }).toFile(path.join(UPLOAD_DIR, webpName));
  await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(UPLOAD_DIR, jpgName));

  // LQIP: 20px wide blurred base64
  const blur = await sharp(buffer).resize(20).blur().webp({ quality: 30 }).toBuffer();
  const blurData = `data:image/webp;base64,${blur.toString('base64')}`;

  await db.imageSlot.update({
    where: { id: slotId },
    data: {
      webpPath: `/uploads/${webpName}`,
      fallbackPath: `/uploads/${jpgName}`,
      blurData,
    },
  });
  return { webpPath: `/uploads/${webpName}`, fallbackPath: `/uploads/${jpgName}` };
}
