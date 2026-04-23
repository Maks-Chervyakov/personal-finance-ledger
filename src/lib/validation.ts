import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, "???????????? ????");
const monthSchema = z.string().regex(/^\d{4}-\d{2}$/u, "???????????? ?????");
const idSchema = z.string().min(1, "Id ??????????");

const positiveDecimalString = z
  .string()
  .trim()
  .transform((value) => value.replace(",", "."))
  .refine((value) => /^\d+(\.\d{1,4})?$/u.test(value), "???????????? ?????")
  .refine((value) => Number(value) > 0, "????? ?????? ???? ?????? ????");

const optionalNoteSchema = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => (typeof value === "string" ? value.trim() : ""))
  .transform((value) => (value.length > 0 ? value : undefined))
  .refine((value) => !value || value.length <= 200, "??????? ??????? ???????");

export const expenseTransactionSchema = z.object({
  transactionId: idSchema.optional(),
  occurredOn: dateSchema,
  note: optionalNoteSchema,
  accountId: idSchema,
  categoryId: idSchema,
  amount: positiveDecimalString,
});

export const incomeTransactionSchema = z.object({
  transactionId: idSchema.optional(),
  occurredOn: dateSchema,
  note: optionalNoteSchema,
  accountId: idSchema,
  amount: positiveDecimalString,
});

export const transferTransactionSchema = z.object({
  transactionId: idSchema.optional(),
  occurredOn: dateSchema,
  note: optionalNoteSchema,
  fromAccountId: idSchema,
  toAccountId: idSchema,
  amount: positiveDecimalString,
});

export const exchangeTransactionSchema = z.object({
  transactionId: idSchema.optional(),
  occurredOn: dateSchema,
  note: optionalNoteSchema,
  fromAccountId: idSchema,
  toAccountId: idSchema,
  fromAmount: positiveDecimalString,
  toAmount: positiveDecimalString,
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "???????? ???????????").max(80, "??????? ??????? ????????"),
});

export const updateCategorySchema = z.object({
  categoryId: idSchema,
  name: z.string().trim().min(1, "???????? ???????????").max(80, "??????? ??????? ????????"),
});

export const categoryMutationSchema = z.object({
  categoryId: idSchema,
});

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "???????? ???????????").max(80, "??????? ??????? ????????"),
  kind: z.enum(["CARD", "CASH", "PLATFORM"]),
  currency: z.enum(["UAH", "USD", "USDT"]),
});

export const updateAccountSchema = z.object({
  accountId: idSchema,
  name: z.string().trim().min(1, "???????? ???????????").max(80, "??????? ??????? ????????"),
  kind: z.enum(["CARD", "CASH", "PLATFORM"]),
  currency: z.enum(["UAH", "USD", "USDT"]),
});

export const accountMutationSchema = z.object({
  accountId: idSchema,
});

export const deleteTransactionSchema = z.object({
  transactionId: idSchema,
});

export const dashboardFiltersSchema = z.object({
  month: monthSchema,
  type: z.enum(["EXPENSE", "INCOME", "TRANSFER", "EXCHANGE"]).optional(),
});
