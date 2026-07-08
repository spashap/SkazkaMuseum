// One-time data fix for the льготный-билет (reduced-price ticket) feature: the new
// `reducedEnabled` column defaults to true for every Program, but «Мрачный фольклор»
// (18+ excursion) is explicitly excluded from reduced tickets per spec — the schema
// default can't special-case one title, so this flips it off. Idempotent: re-running
// is a no-op once the row is already disabled. Run once against each database
// (dev now, production after the next deploy) with:
//   node prisma/fix-reduced-tickets-defaults.mjs
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const r = await db.program.updateMany({
  where: { title: { contains: 'Мрачный фольклор' }, reducedEnabled: true },
  data: { reducedEnabled: false },
});
console.log(`[fix-reduced-tickets-defaults] disabled reducedEnabled on ${r.count} program(s) matching «Мрачный фольклор»`);

await db.$disconnect();
