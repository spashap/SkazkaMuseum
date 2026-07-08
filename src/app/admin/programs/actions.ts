'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession, canAccess } from '@/lib/auth';
import { processAndStoreProgramImage } from '@/lib/images';
import { slugify } from '@/lib/slug';
import { PROGRAM_TYPES, PROGRAM_STATUSES } from '@/lib/programTypes';

const ProgramSchema = z
  .object({
    title: z.string().trim().min(1),
    type: z.enum(PROGRAM_TYPES),
    shortDesc: z.string().trim(),
    fullDesc: z.string().trim(),
    status: z.enum(PROGRAM_STATUSES),
    durationMin: z.coerce.number().int().min(1),
    minGroup: z.coerce.number().int().min(1),
    maxGroup: z.coerce.number().int().min(1),
    ageLimit: z.string().trim(),
    priceAdult: z.coerce.number().int().min(0),
    priceChild: z.coerce.number().int().min(0),
    priceGroup: z.coerce.number().int().min(0),
    reducedEnabled: z.coerce.boolean(),
    reducedDiscountPercent: z.coerce.number().int().min(0).max(100),
    seoTitle: z.string().trim(),
    seoDescription: z.string().trim(),
    slug: z.string().trim(),
  })
  .refine((v) => v.maxGroup >= v.minGroup, { message: 'Максимум не может быть меньше минимума', path: ['maxGroup'] });

function parseProgramForm(formData: FormData) {
  return ProgramSchema.parse({
    title: formData.get('title') || '',
    type: formData.get('type') || 'excursion',
    shortDesc: formData.get('shortDesc') || '',
    fullDesc: formData.get('fullDesc') || '',
    status: formData.get('status') || 'active',
    durationMin: formData.get('durationMin') || 60,
    minGroup: formData.get('minGroup') || 1,
    maxGroup: formData.get('maxGroup') || 30,
    ageLimit: formData.get('ageLimit') || '',
    priceAdult: formData.get('priceAdult') || 0,
    priceChild: formData.get('priceChild') || 0,
    priceGroup: formData.get('priceGroup') || 0,
    reducedEnabled: formData.get('reducedEnabled') === 'on',
    reducedDiscountPercent: formData.get('reducedDiscountPercent') || 30,
    seoTitle: formData.get('seoTitle') || '',
    seoDescription: formData.get('seoDescription') || '',
    slug: formData.get('slug') || '',
  });
}

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  let candidate = base;
  let n = 2;
  while (true) {
    const clash = await db.program.findFirst({ where: { slug: candidate, ...(ignoreId ? { id: { not: ignoreId } } : {}) } });
    if (!clash) return candidate;
    candidate = `${base}-${n++}`;
  }
}

async function requireAccess() {
  const session = await getSession();
  if (!session || !canAccess(session.role, 'programs')) redirect('/admin');
  return session;
}

export async function createProgram(formData: FormData) {
  await requireAccess();
  const fields = parseProgramForm(formData);
  const baseSlug = slugify(fields.slug || fields.title);
  const slug = await uniqueSlug(baseSlug);

  const program = await db.program.create({ data: { ...fields, slug } });

  const file = formData.get('image');
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await processAndStoreProgramImage(program.id, buffer);
    await db.program.update({ where: { id: program.id }, data: { images: JSON.stringify([url]) } });
  }

  revalidatePath('/admin/programs');
  redirect('/admin/programs');
}

export async function updateProgram(formData: FormData) {
  await requireAccess();
  const id = String(formData.get('id') || '');
  const existing = await db.program.findUnique({ where: { id } });
  if (!existing) redirect('/admin/programs');

  const fields = parseProgramForm(formData);
  const baseSlug = slugify(fields.slug || fields.title);
  const slug = baseSlug === existing!.slug ? existing!.slug : await uniqueSlug(baseSlug, id);

  let images = existing!.images;
  const file = formData.get('image');
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await processAndStoreProgramImage(id, buffer);
    images = JSON.stringify([url]);
  }

  await db.program.update({ where: { id }, data: { ...fields, slug, images } });

  revalidatePath('/admin/programs');
  redirect('/admin/programs');
}

export async function duplicateProgram(formData: FormData) {
  await requireAccess();
  const id = String(formData.get('id') || '');
  const source = await db.program.findUnique({ where: { id }, include: { upsells: true } });
  if (!source) return;

  const title = `${source.title} (копия)`;
  const slug = await uniqueSlug(slugify(title));
  const copy = await db.program.create({
    data: {
      title,
      type: source.type,
      shortDesc: source.shortDesc,
      fullDesc: source.fullDesc,
      ageLimit: source.ageLimit,
      durationMin: source.durationMin,
      minGroup: source.minGroup,
      maxGroup: source.maxGroup,
      priceAdult: source.priceAdult,
      priceChild: source.priceChild,
      priceReduced: source.priceReduced,
      priceGroup: source.priceGroup,
      reducedEnabled: source.reducedEnabled,
      reducedDiscountPercent: source.reducedDiscountPercent,
      status: 'draft',
      images: source.images,
      slug,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
    },
  });
  if (source.upsells.length > 0) {
    await db.upsell.createMany({
      data: source.upsells.map((u) => ({
        programId: copy.id,
        title: u.title,
        description: u.description,
        price: u.price,
        active: u.active,
      })),
    });
  }

  revalidatePath('/admin/programs');
}

export async function archiveProgram(formData: FormData) {
  await requireAccess();
  const id = String(formData.get('id') || '');
  const program = await db.program.findUnique({ where: { id } });
  if (!program) return;
  await db.program.update({ where: { id }, data: { status: program.status === 'archived' ? 'active' : 'archived' } });
  revalidatePath('/admin/programs');
}

export async function addUpsell(formData: FormData) {
  await requireAccess();
  const programId = String(formData.get('programId') || '');
  const title = String(formData.get('title') || '').trim();
  if (!title) return;
  const price = Number(formData.get('price') || 0);
  await db.upsell.create({ data: { programId, title, price, description: String(formData.get('description') || '') } });
  revalidatePath(`/admin/programs/${programId}`);
}

export async function deleteUpsell(formData: FormData) {
  await requireAccess();
  const id = String(formData.get('id') || '');
  const programId = String(formData.get('programId') || '');
  await db.upsell.delete({ where: { id } });
  revalidatePath(`/admin/programs/${programId}`);
}
