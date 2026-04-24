import { AccountKind, Currency, TransactionType } from "@prisma/client";

export const CURRENCY_LABELS: Record<Currency, string> = {
  [Currency.UAH]: "UAH",
  [Currency.USD]: "USD",
  [Currency.USDT]: "USDT",
};

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  [AccountKind.CARD]: "Карта",
  [AccountKind.CASH]: "Наличные",
  [AccountKind.PLATFORM]: "Платформа",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.EXPENSE]: "Расход",
  [TransactionType.INCOME]: "Доход",
  [TransactionType.TRANSFER]: "Перевод",
  [TransactionType.EXCHANGE]: "Обмен",
};

export const PIE_COLORS = [
  "#3b82f6",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];
