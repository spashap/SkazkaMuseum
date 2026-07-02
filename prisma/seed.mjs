// Seed: default admin, theme, company settings, 14 pages, image slots, sample programs.
// Idempotent — safe to re-run (upserts).
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const db = new PrismaClient();
const __dir = dirname(fileURLToPath(import.meta.url));
// Image slots extracted from the original HTML (id, label, recW, recH, seed path).
const SLOTS_JSON = JSON.parse(readFileSync(join(__dir, '..', 'src', 'content', 'slots.json'), 'utf8'));

const PAGES = [
  ['home', 'Главная', 'Главная', 'Выберите своё путешествие', 'Путешествие, которое захватит от 3 до 99 лет. 30+ фотозон, живые актёры и настоящее волшебство.'],
  ['tickets', 'Билеты', 'Билеты', 'Купить билет', 'Выберите удобный формат посещения. Онлайн-покупка без очереди.'],
  ['tours', 'Экскурсии', 'Экскурсии', 'Экскурсии по музею', 'Интерактивные путешествия в мир народных преданий для детей и взрослых.'],
  ['birthday', 'Дни рождения', 'Дни рождения', 'День рождения в сказке', 'Сказочный квест, живые персонажи и незабываемые эмоции для именинника и его гостей.'],
  ['schools', 'Школьным группам', 'Школам', 'Школьным группам', 'Образовательные экскурсии по ФГОС для учеников 1–11 классов.'],
  ['kindergarten', 'Детским садам', 'Дет. сады', 'Детским садам', 'Программы для детей от 3 до 6 лет. Безопасно, ярко, незабываемо.'],
  ['masterclasses', 'Мастер-классы', 'Мастер-классы', 'Мастер-классы', 'Народные ремёсла, роспись и творчество для детей и взрослых.'],
  ['kvesty', 'Квесты', 'Квесты', 'Квесты', 'Захватывающие квест-приключения по миру русских сказок для детей и взрослых.'],
  ['teatr', 'Театр сказки', 'Театр', 'Театр сказки', 'Живые спектакли для детей и всей семьи в волшебных залах музея.'],
  ['lektsii', 'Лекции', 'Лекции', 'Лекции', 'Погружение в истоки народных традиций, их символику и значение для современной культуры.'],
  ['partners', 'Партнёрам', 'Партнёрам', 'Партнёрам', 'Музей открыт для сотрудничества с туроператорами, гидами, блогерами и компаниями.'],
  ['reviews', 'Отзывы', 'Отзывы', 'Отзывы посетителей', 'Живые отзывы семей, школ и гостей музея русской сказки «За лесами, за горами».'],
  ['contacts', 'Контакты', 'Контакты', 'Контакты', 'Мы ждём вас в сердце Санкт-Петербурга.'],
  ['poleznoe', 'Полезное', 'Полезное', 'Полезное о Петербурге', 'Гиды, подборки и советы для семейного отдыха в Санкт-Петербурге.'],
  ['skazki', 'Сказки', 'Сказки', 'Энциклопедия сказок', 'Герои, существа и истории русских народных сказок.'],
];

async function main() {
  await db.theme.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await db.companySettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@skazkamuseum.ru';
  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'muzei-admin-2026';
  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPass, 10),
      fullName: 'Администратор',
      role: 'ADMIN',
    },
  });

  for (const [id, title, navLabel, heroTitle, heroText] of PAGES) {
    await db.pageContent.upsert({
      where: { id },
      update: {},
      create: {
        id, title, navLabel, heroTitle, heroText,
        // Home's tab title is the full brand; other pages get the site name
        // appended automatically via the title template in src/app/layout.tsx.
        seoTitle: id === 'home' ? 'Музей русской сказки «За лесами, за горами» — Санкт-Петербург' : title,
        seoDesc: heroText,
      },
    });
  }

  for (const s of SLOTS_JSON) {
    await db.imageSlot.upsert({
      where: { id: s.id },
      update: { seedPath: s.seed, recW: s.recW, recH: s.recH, label: s.label },
      create: { id: s.id, label: s.label, recW: s.recW, recH: s.recH, alt: s.label, seedPath: s.seed },
    });
  }

  // Sample programs so catalog/calendar aren't empty
  const samples = [
    ['Обзорная экскурсия', 'excursion', 'Путешествие по 21 зоне музея', 900, 700],
    ['Квест «Тайна Кощея»', 'quest', 'Интерактивное приключение', 1200, 1000],
    ['Мастер-класс росписи', 'masterclass', 'Народная роспись своими руками', 800, 800],
  ];
  for (const [title, type, shortDesc, priceAdult, priceChild] of samples) {
    const exists = await db.program.findFirst({ where: { title } });
    if (!exists) await db.program.create({ data: { title, type, shortDesc, priceAdult, priceChild } });
  }

  console.log(`Seeded. Admin login: ${adminEmail} / ${adminPass}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
