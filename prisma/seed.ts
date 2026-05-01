import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, AccountKind, Currency } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const accounts = [
  { name: "UAH card", kind: AccountKind.CARD, currency: Currency.UAH },
  { name: "Cash UAH", kind: AccountKind.CASH, currency: Currency.UAH },
  { name: "Cash USD", kind: AccountKind.CASH, currency: Currency.USD },
  { name: "Binance USDT", kind: AccountKind.PLATFORM, currency: Currency.USDT },
  { name: "Bybit USDT", kind: AccountKind.PLATFORM, currency: Currency.USDT },
];

const categories = ["Еда", "Транспорт", "Подписки"];

async function main() {
  for (const account of accounts) {
    await prisma.account.upsert({
      where: { name: account.name },
      update: {
        kind: account.kind,
        currency: account.currency,
        isArchived: false,
      },
      create: account,
    });
  }

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {
        isDeleted: false,
        deletedAt: null,
      },
      create: { name },
    });
  }
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
