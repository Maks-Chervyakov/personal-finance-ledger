import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  AccountKind,
  Currency,
  LegDirection,
  PrismaClient,
  TransactionType,
  type Account,
  type Category,
} from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const DEMO_TAG = "[DEMO_EXPENSE_TRACKER_V1]";

const accountSeeds = [
  { name: "UAH card", kind: AccountKind.CARD, currency: Currency.UAH },
  { name: "Cash UAH", kind: AccountKind.CASH, currency: Currency.UAH },
  { name: "Cash USD", kind: AccountKind.CASH, currency: Currency.USD },
  { name: "Binance USDT", kind: AccountKind.PLATFORM, currency: Currency.USDT },
  { name: "Bybit USDT", kind: AccountKind.PLATFORM, currency: Currency.USDT },
];

const demoCategories = [
  "DEMO: Еда",
  "DEMO: Транспорт",
  "DEMO: Развлечения",
  "DEMO: Подписки",
  "DEMO: Здоровье",
  "DEMO: Стоматология",
];

type AccountByName = Record<string, Account>;
type CategoryByName = Record<string, Category>;
type TwoLegTransactionType =
  | (typeof TransactionType)["TRANSFER"]
  | (typeof TransactionType)["EXCHANGE"];

function at(date: string) {
  return new Date(`${date}T12:00:00.000Z`);
}

function note(text: string) {
  return `${DEMO_TAG} ${text}`;
}

async function ensureAccounts() {
  const entries = await Promise.all(
    accountSeeds.map((account) =>
      prisma.account.upsert({
        where: { name: account.name },
        update: {
          kind: account.kind,
          currency: account.currency,
          isArchived: false,
        },
        create: account,
      }),
    ),
  );

  return Object.fromEntries(entries.map((account) => [account.name, account])) as AccountByName;
}

async function ensureCategories() {
  const entries = await Promise.all(
    demoCategories.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {
          isDeleted: false,
          deletedAt: null,
        },
        create: { name },
      }),
    ),
  );

  const deletedCategory = await prisma.category.update({
    where: { name: "DEMO: Стоматология" },
    data: {
      isDeleted: true,
      deletedAt: at("2026-05-18"),
    },
  });

  return Object.fromEntries(
    entries.map((category) => [
      category.name,
      category.name === deletedCategory.name ? deletedCategory : category,
    ]),
  ) as CategoryByName;
}

async function createExpense(
  accounts: AccountByName,
  categories: CategoryByName,
  data: {
    date: string;
    account: string;
    category: string;
    amount: string;
    note: string;
  },
) {
  const account = accounts[data.account];
  const category = categories[data.category];

  await prisma.transaction.create({
    data: {
      type: TransactionType.EXPENSE,
      occurredAt: at(data.date),
      note: note(data.note),
      categoryId: category.id,
      categorySnapshotName: category.name,
      legs: {
        create: {
          accountId: account.id,
          direction: LegDirection.OUT,
          amountDecimal: data.amount,
          currency: account.currency,
        },
      },
    },
  });
}

async function createIncome(
  accounts: AccountByName,
  data: {
    date: string;
    account: string;
    amount: string;
    note: string;
  },
) {
  const account = accounts[data.account];

  await prisma.transaction.create({
    data: {
      type: TransactionType.INCOME,
      occurredAt: at(data.date),
      note: note(data.note),
      legs: {
        create: {
          accountId: account.id,
          direction: LegDirection.IN,
          amountDecimal: data.amount,
          currency: account.currency,
        },
      },
    },
  });
}

async function createTwoLegTransaction(
  accounts: AccountByName,
  data: {
    type: TwoLegTransactionType;
    date: string;
    from: string;
    to: string;
    fromAmount: string;
    toAmount: string;
    note: string;
  },
) {
  const fromAccount = accounts[data.from];
  const toAccount = accounts[data.to];

  await prisma.transaction.create({
    data: {
      type: data.type,
      occurredAt: at(data.date),
      note: note(data.note),
      legs: {
        create: [
          {
            accountId: fromAccount.id,
            direction: LegDirection.OUT,
            amountDecimal: data.fromAmount,
            currency: fromAccount.currency,
          },
          {
            accountId: toAccount.id,
            direction: LegDirection.IN,
            amountDecimal: data.toAmount,
            currency: toAccount.currency,
          },
        ],
      },
    },
  });
}

async function seedDemoData() {
  const existingDemoTransactions = await prisma.transaction.count({
    where: { note: { contains: DEMO_TAG } },
  });

  if (existingDemoTransactions > 0) {
    throw new Error(
      `Demo data already exists (${existingDemoTransactions} transactions). Run "npm run demo:cleanup" before seeding again.`,
    );
  }

  const accounts = await ensureAccounts();
  const categories = await ensureCategories();

  await createIncome(accounts, {
    date: "2026-05-02",
    account: "Binance USDT",
    amount: "5200",
    note: "Доход за проект на Binance",
  });
  await createIncome(accounts, {
    date: "2026-04-03",
    account: "Binance USDT",
    amount: "4300",
    note: "Прошломесячный доход на Binance",
  });

  await createTwoLegTransaction(accounts, {
    type: TransactionType.EXCHANGE,
    date: "2026-05-04",
    from: "Binance USDT",
    to: "UAH card",
    fromAmount: "1200",
    toAmount: "48600",
    note: "P2P вывод USDT на гривневую карту",
  });
  await createTwoLegTransaction(accounts, {
    type: TransactionType.EXCHANGE,
    date: "2026-05-06",
    from: "UAH card",
    to: "Cash USD",
    fromAmount: "8200",
    toAmount: "200",
    note: "Покупка наличного доллара",
  });
  await createTwoLegTransaction(accounts, {
    type: TransactionType.EXCHANGE,
    date: "2026-04-07",
    from: "Binance USDT",
    to: "UAH card",
    fromAmount: "850",
    toAmount: "34425",
    note: "Прошломесячный P2P вывод",
  });

  await createTwoLegTransaction(accounts, {
    type: TransactionType.TRANSFER,
    date: "2026-05-08",
    from: "UAH card",
    to: "Cash UAH",
    fromAmount: "3000",
    toAmount: "3000",
    note: "Оплата картой за соседа, возврат наличкой",
  });
  await createTwoLegTransaction(accounts, {
    type: TransactionType.TRANSFER,
    date: "2026-05-12",
    from: "Binance USDT",
    to: "Bybit USDT",
    fromAmount: "700",
    toAmount: "700",
    note: "Перевод части средств на Bybit",
  });

  const expenses = [
    ["2026-05-03", "UAH card", "DEMO: Еда", "950.50", "Супермаркет и продукты"],
    ["2026-05-05", "UAH card", "DEMO: Транспорт", "420", "Такси и метро"],
    ["2026-05-09", "Cash UAH", "DEMO: Еда", "680", "Кофе и обед наличкой"],
    ["2026-05-10", "Bybit USDT", "DEMO: Подписки", "39.99", "Подписка оплачена Bybit"],
    ["2026-05-13", "Cash USD", "DEMO: Развлечения", "55", "Выходные наличным долларом"],
    ["2026-05-16", "UAH card", "DEMO: Здоровье", "1850", "Аптека и анализы"],
    ["2026-05-17", "Cash UAH", "DEMO: Развлечения", "1250", "Кино и ужин"],
    ["2026-05-20", "UAH card", "DEMO: Стоматология", "3200", "Старая категория уже удалена"],
    ["2026-04-04", "UAH card", "DEMO: Еда", "2200", "Прошлый месяц продукты"],
    ["2026-04-10", "Bybit USDT", "DEMO: Подписки", "25", "Прошлый месяц подписка"],
    ["2026-04-14", "Cash USD", "DEMO: Развлечения", "80", "Прошлый месяц досуг"],
  ] as const;

  for (const [date, account, category, amount, expenseNote] of expenses) {
    await createExpense(accounts, categories, {
      date,
      account,
      category,
      amount,
      note: expenseNote,
    });
  }

  console.log(`Seeded demo data with tag ${DEMO_TAG}`);
}

async function cleanupDemoData() {
  const transactions = await prisma.transaction.findMany({
    where: { note: { contains: DEMO_TAG } },
    select: { id: true },
  });

  const deletedTransactions = await prisma.transaction.deleteMany({
    where: { id: { in: transactions.map((transaction) => transaction.id) } },
  });

  const deletedCategories = await prisma.category.deleteMany({
    where: { name: { startsWith: "DEMO: " } },
  });

  console.log(
    `Deleted ${deletedTransactions.count} demo transactions and ${deletedCategories.count} demo categories.`,
  );
}

async function main() {
  const command = process.argv[2];

  if (command === "seed") {
    await seedDemoData();
    return;
  }

  if (command === "cleanup") {
    await cleanupDemoData();
    return;
  }

  throw new Error('Usage: tsx prisma/demo-data.ts "seed" | "cleanup"');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
