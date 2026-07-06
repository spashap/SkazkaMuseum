// One-time migration: copies the real excursion/quest/masterclass/birthday content that
// used to be hardcoded in src/content/fragments/{tours,kvesty,masterclasses,birthday}.html
// into the Program table, so /admin/programs becomes the single source of truth and the
// public pages (now rendered from Program rows — see src/lib/programCards.ts) show it.
// Idempotent: skips any title that already exists.
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const EXCURSIONS = [
  {
    title: 'Интерактивная экскурсия с героем сказки',
    shortDesc: '700 кв. м · 21 зал · можно трогать, пробовать, забираться внутрь. Путешествие с гидом-персонажем: задания, артефакты, стрельба из лука, примерка кокошников, чаепитие.',
    ageLimit: 'от 6 лет', durationMin: 60, maxGroup: 20,
    priceAdult: 1700, priceChild: 1500, priceReduced: 1050, priceGroup: 5500,
    images: ['/seed/tours_13.webp'],
  },
  {
    title: '«Мрачный фольклор»',
    shortDesc: 'Та сторона сказок, о которой не рассказывают детям. Реальные поверья и обряды, образы злых духов — с живой подачей и атмосферой, которая затягивает всё глубже.',
    ageLimit: '18+', durationMin: 60, maxGroup: 20,
    priceAdult: 2500, priceChild: 0, priceGroup: 0,
    images: ['/seed/tours_14.webp'],
  },
  {
    title: '«Русские народные сказки» — школьная группа',
    shortDesc: 'Ребята исследуют тайны Бабы Яги, Змея Горыныча и лешего. В программу включён мастер-класс по свече из вощины и чаепитие из самовара.',
    ageLimit: 'Школьники', durationMin: 90, maxGroup: 30,
    priceAdult: 700, priceChild: 1500, priceGroup: 0,
    images: ['/seed/tours_15.webp'],
  },
  {
    title: '«Русские народные сказки» — детский сад',
    shortDesc: 'Интерактивная экскурсия для дошкольников по загадочному миру русских сказок. В программу включён мастер-класс по свече из вощины и чаепитие.',
    ageLimit: 'Дошкольники', durationMin: 90, maxGroup: 30,
    priceAdult: 700, priceChild: 1500, priceGroup: 0,
    images: ['/seed/tours_16.webp'],
  },
];

const QUESTS = [
  {
    title: 'Здравствуй, сказка!',
    shortDesc: 'Квест для самостоятельного прохождения по буклету. Встреча с Лисичкой и сказочными персонажами, загадки и тайны по всему музею. Приз — именная сказка и сладкое угощение.',
    ageLimit: 'от 4 лет', durationMin: 90, maxGroup: 30,
    priceAdult: 1000, priceChild: 1000,
    images: ['/seed/kvesty_28.webp'],
  },
  {
    title: 'В поисках сказочного сокровища',
    shortDesc: 'Волшебная карта и поиск букв, спрятанных среди экспонатов музея, — пока не сложится загаданное слово. Победителей ждут чаепитие и вкусный приз.',
    ageLimit: 'от 8 лет', durationMin: 90, maxGroup: 30,
    priceAdult: 1000, priceChild: 1000,
    images: ['/seed/kvesty_29.webp'],
  },
  {
    title: 'Седьмая тайна сказки',
    shortDesc: 'Знакомство с персонажами и их секретами, семь загадок сказочного мира — сложный квест для тех, кто любит подумать. Финал: чаепитие и вкусный пряник.',
    ageLimit: 'от 13 лет', durationMin: 90, maxGroup: 30,
    priceAdult: 1000, priceChild: 1000,
    images: ['/seed/kvesty_30.webp'],
  },
];

const MASTERCLASSES = [
  {
    title: 'Свеча из вощины',
    shortDesc: 'Создайте свою особую свечу из натуральной вощины и медовых сот в медитативной, уютной атмосфере — с выбором оттенков, формы и аромата.',
    ageLimit: 'от 12 лет', durationMin: 60,
    priceAdult: 1500, priceChild: 1500,
    images: ['/seed/masterclasses_23.webp'],
  },
  {
    title: 'Народная кукла',
    shortDesc: 'Создайте свой личный оберег: куклу-оберег из ниток или «Стригушку» из лыка — на ваш выбор. Готовый оберег забираете с собой.',
    ageLimit: 'от 6 лет', durationMin: 60,
    priceAdult: 500, priceChild: 500,
    images: ['/seed/masterclasses_24.webp'],
  },
  {
    title: 'Сумка «Лубок»',
    shortDesc: 'Нанесите на тканевый шоппер рисунок в лубочной технике — старинном русском народном искусстве. Завершается чаепитием из самовара.',
    ageLimit: 'от 6 лет', durationMin: 60,
    priceAdult: 1500, priceChild: 1500,
    images: ['/seed/masterclasses_25.webp'],
  },
  {
    title: 'Кукла Крупеничка — хранительница достатка',
    shortDesc: 'Традиционная народная кукла, символизирующая достаток и благополучие. Создаётся без иглы и нитки, по старинным традициям.',
    ageLimit: 'от 6 лет', durationMin: 60,
    priceAdult: 1500, priceChild: 1500,
    images: ['/seed/masterclasses_26.webp'],
  },
  {
    title: 'Клуб богатырей',
    shortDesc: 'Увлекательное путешествие по страницам истории русского вооружения: примерка шлема и кольчуги, стрельба из лука, поединки с мягкими мечами.',
    ageLimit: '6+', durationMin: 60,
    priceAdult: 1000, priceChild: 1000,
    images: ['/seed/masterclasses_27.webp'],
  },
];

const BIRTHDAY = {
  title: 'Праздник в сказке',
  shortDesc: '5 детей + 2 взрослых · 2 часа · Доп. ребёнок +2 500 ₽ · Доп. взрослый +1 290 ₽',
  fullDesc: [
    'Аренда зала «Ледяная избушка» на 2 часа',
    'Праздничное украшение зала',
    'Квест по музею с актёром из трёх представленных',
    'Торжественное поздравление именинника на троне',
    'Чаепитие из самовара с сушками и пряниками',
    'Вынос вашего торта актёром-аниматором',
    'Квест-программа на выбор: «Спасти сказку», «Былинные богатыри» или «Царское задание»',
    'Профессиональные актёры в образах на протяжении всей программы',
  ].join('\n'),
  ageLimit: '4–14 лет', durationMin: 120, minGroup: 5, maxGroup: 7,
  priceAdult: 1290, priceChild: 2500, priceGroup: 14500,
  images: ['/seed/birthday_18.webp'],
};

const BIRTHDAY_UPSELLS = [
  ['Фотозона «С днём рождения»', 'Шарики + надпись', 5000],
  ['Праздничный стол', 'Пряники, сушки, сладкий и несладкий пироги', 6000],
  ['Фотосъёмка праздника', 'Фотограф на 2 часа', 8000],
  ['Серебряное шоу', 'Ветродуйка + серебристое конфетти, +30 мин аренды', 8000],
  ['МК «Свеча из вощины»', 'За человека', 500],
  ['МК «Куколка из лыка»', 'За человека', 500],
  ['МК «Кукла Крупеничка»', 'За человека', 1500],
  ['МК «Особая свеча из вощины»', 'За человека', 1500],
  ['Продление аренды зала', '+1 час', 5000],
];

async function upsertProgram(type, data) {
  const exists = await db.program.findFirst({ where: { title: data.title } });
  if (exists) return exists;
  const { images, ...rest } = data;
  return db.program.create({ data: { ...rest, type, status: 'active', images: JSON.stringify(images) } });
}

async function main() {
  for (const p of EXCURSIONS) await upsertProgram('excursion', p);
  for (const p of QUESTS) await upsertProgram('quest', p);
  for (const p of MASTERCLASSES) await upsertProgram('masterclass', p);

  const birthday = await upsertProgram('birthday', BIRTHDAY);
  const hasUpsells = await db.upsell.findFirst({ where: { programId: birthday.id } });
  if (!hasUpsells) {
    await db.upsell.createMany({
      data: BIRTHDAY_UPSELLS.map(([title, description, price]) => ({ programId: birthday.id, title, description, price })),
    });
  }

  console.log('Migrated fragment content into Program/Upsell rows.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
