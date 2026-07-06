import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/programs -> active program catalog (template list, no dates)
export async function GET() {
  const programs = await db.program.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, title: true, type: true, shortDesc: true, ageLimit: true,
      durationMin: true, maxGroup: true, priceAdult: true, priceChild: true, slug: true,
    },
  });
  return NextResponse.json({ programs });
}
