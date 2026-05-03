import "server-only";

import {
  Currency,
  LegDirection,
  TransactionType,
  type Account,
  type Category,
  type Prisma,
} from "@prisma/client";

import { CURRENCY_LABELS, PIE_COLORS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  decimalToNumber,
  getCurrentMonthValue,
  getMonthRange,
  parseMultiValue,
} from "@/lib/utils";
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

export type BalanceChartSlice = ChartSlice & {
  accountId: string;
};

export type BalanceChartGroup = {
  currency: Currency;
  totalPositiveBalance: number;
  slices: BalanceChartSlice[];
  nonPositiveAccounts: BalanceChartSlice[];
};

export type ExpenseChartGroup = {
  currency: Currency;
  title: string;
  total: number;
  slices: ChartSlice[];
};

export type CurrencySummary = {
  currency: Currency;
  expenseTotal: number;
  incomeTotal: number;
  netTotal: number;
  expenseCount: number;
  incomeCount: number;
};

export type MonthlyCurrencyFlow = {
  currency: Currency;
  openingBalance: number;
  incomeTotal: number;
  expenseTotal: number;
  movementInTotal: number;
  movementOutTotal: number;
  closingBalance: number;
  balanceChange: number;
  incomeExpenseDelta: number;
  transactionCount: number;
};

export type OverviewData = {
  month: string;
  currencySummaries: CurrencySummary[];
  monthlyFlows: MonthlyCurrencyFlow[];
  balanceCharts: BalanceChartGroup[];
  charts: ExpenseChartGroup[];
  accounts: AccountOverview[];
  recentTransactions: TransactionWithDetails[];
  activeAccountsCount: number;
  archivedAccountsCount: number;
  totalCategoriesCount: number;
  deletedCategoriesCount: number;
};

export type OperationsData = {
  filters: DashboardFilters;
  accounts: AccountOverview[];
  categories: CategoryOverview[];
  transactions: TransactionWithDetails[];
  defaultIncomeAccountId?: string;
};

export type AnalyticsData = {
  month: string;
  flows: MonthlyCurrencyFlow[];
  charts: ExpenseChartGroup[];
  transactions: TransactionWithDetails[];
};

const CURRENCY_ORDER: Currency[] = [Currency.UAH, Currency.USD, Currency.USDT];

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

function buildTransactionWhere(filters: DashboardFilters): Prisma.TransactionWhereInput {
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

  return where;
}

function getReferenceQueries() {
  return [
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
  ] as const;
}

function mapAccounts(
  accounts: Array<
    Account & {
      legs: { direction: LegDirection; amountDecimal: Prisma.Decimal }[];
      _count: { legs: number };
    }
  >,
): AccountOverview[] {
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

function mapCategories(
  categories: Array<Category & { _count: { transactions: number } }>,
): CategoryOverview[] {
  return categories.map((category) => {
    const { _count, ...categoryBase } = category;

    return {
      ...categoryBase,
      expenseCount: _count.transactions,
    };
  });
}

function buildExpenseCharts(
  transactions: TransactionWithDetails[],
): ExpenseChartGroup[] {
  const grouped = new Map<Currency, Map<string, number>>();

  for (const transaction of transactions) {
    if (transaction.type !== TransactionType.EXPENSE) {
      continue;
    }

    const leg = transaction.legs.find((item) => item.direction === LegDirection.OUT);
    if (!leg) {
      continue;
    }

    const label =
      transaction.categorySnapshotName ??
      transaction.category?.name ??
      "Без категории";
    const currencyGroup = grouped.get(leg.currency) ?? new Map<string, number>();

    currencyGroup.set(
      label,
      (currencyGroup.get(label) ?? 0) + decimalToNumber(leg.amountDecimal),
    );
    grouped.set(leg.currency, currencyGroup);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
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
        title: `Расходы в ${CURRENCY_LABELS[currency]}`,
        total: slices.reduce((sum, slice) => sum + slice.value, 0),
        slices,
      };
    });
}

function buildCurrencySummaries(
  transactions: TransactionWithDetails[],
): CurrencySummary[] {
  const summaryMap = new Map<Currency, CurrencySummary>(
    CURRENCY_ORDER.map((currency) => [
      currency,
      {
        currency,
        expenseTotal: 0,
        incomeTotal: 0,
        netTotal: 0,
        expenseCount: 0,
        incomeCount: 0,
      },
    ]),
  );

  for (const transaction of transactions) {
    if (transaction.type === TransactionType.EXPENSE) {
      const out = transaction.legs.find((leg) => leg.direction === LegDirection.OUT);
      if (!out) {
        continue;
      }

      const summary = summaryMap.get(out.currency);
      if (!summary) {
        continue;
      }

      summary.expenseTotal += decimalToNumber(out.amountDecimal);
      summary.expenseCount += 1;
      summary.netTotal = summary.incomeTotal - summary.expenseTotal;
      continue;
    }

    if (transaction.type === TransactionType.INCOME) {
      const incoming = transaction.legs.find(
        (leg) => leg.direction === LegDirection.IN,
      );
      if (!incoming) {
        continue;
      }

      const summary = summaryMap.get(incoming.currency);
      if (!summary) {
        continue;
      }

      summary.incomeTotal += decimalToNumber(incoming.amountDecimal);
      summary.incomeCount += 1;
      summary.netTotal = summary.incomeTotal - summary.expenseTotal;
    }
  }

  return CURRENCY_ORDER.map((currency) => summaryMap.get(currency)!);
}

function buildBalanceCharts(
  accounts: AccountOverview[],
  transactionsBeforeMonthEnd: TransactionWithDetails[],
): BalanceChartGroup[] {
  const balanceMap = new Map<string, AccountOverview & { endBalance: number }>(
    accounts.map((account) => [account.id, { ...account, endBalance: 0 }]),
  );

  for (const transaction of transactionsBeforeMonthEnd) {
    for (const leg of transaction.legs) {
      const account = balanceMap.get(leg.accountId);
      if (!account) {
        continue;
      }

      const amount = decimalToNumber(leg.amountDecimal);
      account.endBalance += leg.direction === LegDirection.IN ? amount : -amount;
    }
  }

  return CURRENCY_ORDER.map((currency) => {
    const accountBalances = [...balanceMap.values()]
      .filter((account) => account.currency === currency)
      .sort((left, right) => right.endBalance - left.endBalance);

    const slices = accountBalances
      .filter((account) => account.endBalance > 0)
      .map((account, index) => ({
        accountId: account.id,
        label: account.name,
        value: account.endBalance,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }));

    const nonPositiveAccounts = accountBalances
      .filter((account) => account.endBalance <= 0)
      .map((account, index) => ({
        accountId: account.id,
        label: account.name,
        value: account.endBalance,
        color: PIE_COLORS[(slices.length + index) % PIE_COLORS.length],
      }));

    return {
      currency,
      totalPositiveBalance: slices.reduce((sum, slice) => sum + slice.value, 0),
      slices,
      nonPositiveAccounts,
    };
  });
}

function createEmptyFlow(currency: Currency): MonthlyCurrencyFlow {
  return {
    currency,
    openingBalance: 0,
    incomeTotal: 0,
    expenseTotal: 0,
    movementInTotal: 0,
    movementOutTotal: 0,
    closingBalance: 0,
    balanceChange: 0,
    incomeExpenseDelta: 0,
    transactionCount: 0,
  };
}

function buildMonthlyFlows(
  month: string,
  transactionsBeforeMonthEnd: TransactionWithDetails[],
): MonthlyCurrencyFlow[] {
  const { start, end } = getMonthRange(month);
  const flowMap = new Map<Currency, MonthlyCurrencyFlow>(
    CURRENCY_ORDER.map((currency) => [currency, createEmptyFlow(currency)]),
  );

  for (const transaction of transactionsBeforeMonthEnd) {
    const isBeforeMonth = transaction.occurredAt < start;
    const isInMonth =
      transaction.occurredAt >= start && transaction.occurredAt < end;

    for (const leg of transaction.legs) {
      const flow = flowMap.get(leg.currency);
      if (!flow) {
        continue;
      }

      const amount = decimalToNumber(leg.amountDecimal);
      const signedAmount = leg.direction === LegDirection.IN ? amount : -amount;

      if (isBeforeMonth) {
        flow.openingBalance += signedAmount;
        flow.closingBalance += signedAmount;
        continue;
      }

      if (!isInMonth) {
        continue;
      }

      flow.closingBalance += signedAmount;

      if (transaction.type === TransactionType.INCOME && leg.direction === LegDirection.IN) {
        flow.incomeTotal += amount;
      } else if (transaction.type === TransactionType.EXPENSE && leg.direction === LegDirection.OUT) {
        flow.expenseTotal += amount;
      } else if (leg.direction === LegDirection.IN) {
        flow.movementInTotal += amount;
      } else {
        flow.movementOutTotal += amount;
      }
    }

    if (isInMonth) {
      const currencies = new Set(transaction.legs.map((leg) => leg.currency));
      for (const currency of currencies) {
        const flow = flowMap.get(currency);
        if (flow) {
          flow.transactionCount += 1;
        }
      }
    }
  }

  for (const flow of flowMap.values()) {
    flow.balanceChange = flow.closingBalance - flow.openingBalance;
    flow.incomeExpenseDelta = flow.incomeTotal - flow.expenseTotal;
  }

  return CURRENCY_ORDER.map((currency) => flowMap.get(currency)!);
}

function getDefaultIncomeAccountId(accounts: AccountOverview[]): string | undefined {
  return (
    accounts.find(
      (account) => account.name === "Binance USDT" && !account.isArchived,
    )?.id ?? accounts.find((account) => !account.isArchived)?.id
  );
}

export function parseDashboardFilters(searchParams: SearchParamMap): DashboardFilters {
  const rawMonth =
    typeof searchParams.month === "string"
      ? searchParams.month
      : getCurrentMonthValue();
  const rawType =
    typeof searchParams.type === "string" && searchParams.type.length > 0
      ? searchParams.type
      : undefined;
  const parsed = dashboardFiltersSchema.safeParse({
    month: rawMonth,
    type: rawType,
  });

  return {
    month: parsed.success ? parsed.data.month : getCurrentMonthValue(),
    type: parsed.success
      ? (parsed.data.type as TransactionType | undefined)
      : undefined,
    accountIds: dedupe(parseMultiValue(searchParams.accountId)),
    categoryIds: dedupe(parseMultiValue(searchParams.categoryId)),
  };
}

export function parseOverviewMonth(searchParams: SearchParamMap): string {
  return parseDashboardFilters(searchParams).month;
}

export async function getOverviewData(month: string): Promise<OverviewData> {
  const filters: DashboardFilters = {
    month,
    accountIds: [],
    categoryIds: [],
  };

  const { end } = getMonthRange(month);
  const [accountRows, categoryRows, transactions, transactionsBeforeMonthEnd] = await prisma.$transaction([
    ...getReferenceQueries(),
    prisma.transaction.findMany({
      where: buildTransactionWhere(filters),
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
    prisma.transaction.findMany({
      where: {
        occurredAt: {
          lt: end,
        },
      },
      orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
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
    month,
    currencySummaries: buildCurrencySummaries(transactions),
    monthlyFlows: buildMonthlyFlows(month, transactionsBeforeMonthEnd),
    balanceCharts: buildBalanceCharts(accounts, transactionsBeforeMonthEnd),
    charts: buildExpenseCharts(transactions),
    accounts,
    recentTransactions: transactions.slice(0, 5),
    activeAccountsCount: accounts.filter((account) => !account.isArchived).length,
    archivedAccountsCount: accounts.filter((account) => account.isArchived).length,
    totalCategoriesCount: categories.length,
    deletedCategoriesCount: categories.filter((category) => category.isDeleted).length,
  };
}

export async function getAnalyticsData(month: string): Promise<AnalyticsData> {
  const { start, end } = getMonthRange(month);
  const [transactions, transactionsBeforeMonthEnd] = await prisma.$transaction([
    prisma.transaction.findMany({
      where: {
        occurredAt: {
          gte: start,
          lt: end,
        },
      },
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
    prisma.transaction.findMany({
      where: {
        occurredAt: {
          lt: end,
        },
      },
      orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }],
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

  return {
    month,
    flows: buildMonthlyFlows(month, transactionsBeforeMonthEnd),
    charts: buildExpenseCharts(transactions),
    transactions,
  };
}

export async function getOperationsData(
  filters: DashboardFilters,
): Promise<OperationsData> {
  const [accountRows, categoryRows, transactions] = await prisma.$transaction([
    ...getReferenceQueries(),
    prisma.transaction.findMany({
      where: buildTransactionWhere(filters),
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

  return {
    filters,
    accounts,
    categories: mapCategories(categoryRows),
    transactions,
    defaultIncomeAccountId: getDefaultIncomeAccountId(accounts),
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
