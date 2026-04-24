import { Currency, LegDirection, type Prisma } from "@prisma/client";

type DecimalLike = Prisma.Decimal | { toNumber(): number } | number | string;

const numberFormatter = new Intl.NumberFormat("uk-UA", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const monthLabelFormatter = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
  year: "numeric",
});

export function decimalToNumber(value: DecimalLike): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  if ("toNumber" in value) {
    return value.toNumber();
  }

  return Number(value);
}

export function decimalToString(value: DecimalLike): string {
  const amount = decimalToNumber(value);
  return Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatMoney(value: DecimalLike, currency: Currency): string {
  return `${numberFormatter.format(decimalToNumber(value))} ${currency}`;
}

export function formatSignedAmount(value: DecimalLike, currency: Currency, direction: LegDirection): string {
  const sign = direction === LegDirection.OUT ? "-" : "+";
  return `${sign}${formatMoney(value, currency)}`;
}

export function formatDate(value: Date): string {
  return dateFormatter.format(value);
}

export function getCurrentMonthValue(reference = new Date()): string {
  return `${reference.getUTCFullYear()}-${String(reference.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getMonthRange(monthValue: string): { start: Date; end: Date } {
  const [year, month] = monthValue.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

  return { start, end };
}

export function getMonthLabel(monthValue: string): string {
  const [year, month] = monthValue.split("-").map(Number);
  return monthLabelFormatter.format(new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)));
}

export function toDateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function parseOccurredOn(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

export function toOptionalText(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseMultiValue(value: string | string[] | undefined): string[] {
  if (typeof value === "undefined") {
    return [];
  }

  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
}

export function formatCount(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const absolute = Math.abs(count);
  const lastTwoDigits = absolute % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} ${many}`;
  }

  const lastDigit = absolute % 10;
  if (lastDigit === 1) {
    return `${count} ${one}`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} ${few}`;
  }

  return `${count} ${many}`;
}
