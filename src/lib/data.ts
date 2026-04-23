import "server-only";

import {
  LegDirection,
  TransactionType,
  type Account,
  type Category,
  type Currency,
  type Prisma,
} from "@prisma/client";

import { CURRENCY_LABELS, PIE_COLORS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, getCurrentMonthValue, getMonthRange, parseMultiValue } from "@/lib/utils";
import { dashboardFiltersSchema } from "@/lib/validation";

export type SearchParamMap = Record<string, string | string[] | undefined>;

export type DashboardFilters = {
  month: string;
  accountIds: string[];
  categoryIds: string[];
  type?: TransactionType;
};

export type TransactionWithDetails = Prisma.TransactionGetPayload<{
  include: {
    category: true;
    legs: {
      include: {
        account: true;
      };
    };
  };
}>;

export type AccountOverview = Account & {
  balance: number;
  transactionCount: number;
  currencyLocked: boolean;
};

export type CategoryOverview = Category & {
  expenseCount: number;
};

export type ChartSlice = {
  label: string;
  value: number;
  color: string;
};

export type ExpenseChartGroup = {
  currency: Currency;
  title: string;
  total: number;
  slices: ChartSlice[];
};

export type DashboardData = {
  filters: DashboardFilters;
  accounts: AccountOverview[];
  categories: CategoryOverview[];
  transactions: TransactionWithDetails[];
  charts: ExpenseChartGroup[];
  defaultIncomeAccountId?: string;
};

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

export function parseDashboardFilters(searchParams: SearchParamMap): DashboardFilters {
  const rawMonth = typeof searchParams.month === "string" ? searchParams.month : getCurrentMonthValue();
  const rawType = typeof searchParams.type === "string" && searchParams.type.length > 0 ? searchParams.type : undefined;
  const parsed = dashboardFiltersSchema.safeParse({
    month: rawMonth,
    type: rawType,
  });

  return {
    month: parsed.success ? parsed.data.month : getCurrentMonthValue(),
    type: parsed.success ? (parsed.data.type as TransactionType | undefined) : undefined,
    accountIds: dedupe(parseMultiValue(searchParams.accountId)),
    categoryIds: dedupe(parseMultiValue(searchParams.categoryId)),
  };
}

function mapAccounts(accounts: Array<Account & { legs: { direction: LegDirection; amountDecimal: Prisma.Decimal }[]; _count: { legs: number } }>): AccountOverview[] {
  return accounts.map((account) => {
    const { legs, _count, ...accountBase } = account;
    const balance = legs.reduce((sum, leg) => {
      const amount = decimalToNumber(leg.amountDecimal);
      return sum + (leg.direction === LegDirection.IN ? amount : -amount);
    }, 0);

    return {
      ...accountBase,
      balance,
      transactionCount: _count.legs,
      currencyLocked: _count.legs > 0,
    };
  });
}

function mapCategories(categories: Array<Category & { _count: { transactions: number } }>): CategoryOverview[] {
  return categories.map((category) => {
    const { _count, ...categoryBase } = category;

    return {
      ...categoryBase,
      expenseCount: _count.transactions,
    };
  });
}

function buildExpenseCharts(transactions: TransactionWithDetails[]): ExpenseChartGroup[] {
  const grouped = new Map<Currency, Map<string, number>>();

  for (const transaction of transactions) {
    if (transaction.type !== TransactionType.EXPENSE) {
      continue;
    }

    const leg = transaction.legs.find((item) => item.direction === LegDirection.OUT);
    if (!leg) {
      continue;
    }

    const label = transaction.categorySnapshotName ?? transaction.category?.name ?? "??? ?????????";
    const currencyGroup = grouped.get(leg.currency) ?? new Map<string, number>();
    currencyGroup.set(label, (currencyGroup.get(label) ?? 0) + decimalToNumber(leg.amountDecimal));
    grouped.set(leg.currency, currencyGroup);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, values]) => {
      const slices = [...values.entries()]
        .sort((left, right) => right[1] - left[1])
        .map(([label, value], index) => ({
          label,
          value,
          color: PIE_COLORS[index % PIE_COLORS.length],
        }));

      return {
        currency,
        title: `??????? ? ${CURRENCY_LABELS[currency]}`,
        total: slices.reduce((sum, slice) => sum + slice.value, 0),
        slices,
      };
    });
}

export async function getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
  const { start, end } = getMonthRange(filters.month);

  const where: Prisma.TransactionWhereInput = {
    occurredAt: {
      gte: start,
      lt: end,
    },
  };

  if (filters.accountIds.length > 0) {
    where.legs = {
      some: {
        accountId: {
          in: filters.accountIds,
        },
      },
    };
  }

  if (filters.categoryIds.length > 0) {
    where.categoryId = {
      in: filters.categoryIds,
    };
  }

  if (filters.type) {
    where.type = filters.type;
  }

  const [accountRows, categoryRows, transactions] = await prisma.$transaction([
    prisma.account.findMany({
      orderBy: [{ isArchived: "asc" }, { createdAt: "asc" }],
      include: {
        legs: {
          select: {
            direction: true,
            amountDecimal: true,
          },
        },
        _count: {
          select: {
            legs: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: [{ isDeleted: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    }),
    prisma.transaction.findMany({
      where,
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      include: {
        category: true,
        legs: {
          include: {
            account: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    }),
  ]);

  const accounts = mapAccounts(accountRows);
  const categories = mapCategories(categoryRows);

  return {
    filters,
    accounts,
    categories,
    transactions,
    charts: buildExpenseCharts(transactions),
    defaultIncomeAccountId:
      accounts.find((account) => account.name === "Binance USDT" && !account.isArchived)?.id ??
      accounts.find((account) => !account.isArchived)?.id,
  };
}

export async function getAccountsOverview(): Promise<AccountOverview[]> {
  const accounts = await prisma.account.findMany({
    orderBy: [{ isArchived: "asc" }, { createdAt: "asc" }],
    include: {
      legs: {
        select: {
          direction: true,
          amountDecimal: true,
        },
      },
      _count: {
        select: {
          legs: true,
        },
      },
    },
  });

  return mapAccounts(accounts);
}

export async function getCategoriesOverview(): Promise<CategoryOverview[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ isDeleted: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  return mapCategories(categories);
}
