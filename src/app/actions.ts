"use server";

import { refresh, revalidatePath } from "next/cache";
import { AccountKind, LegDirection, Prisma, TransactionType, type Currency } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { parseOccurredOn } from "@/lib/utils";
import {
  accountMutationSchema,
  categoryMutationSchema,
  createAccountSchema,
  createCategorySchema,
  deleteTransactionSchema,
  exchangeTransactionSchema,
  expenseTransactionSchema,
  incomeTransactionSchema,
  transferTransactionSchema,
  updateAccountSchema,
  updateCategorySchema,
} from "@/lib/validation";

const APP_PATHS = ["/", "/accounts", "/categories"];

function revalidateApp() {
  for (const path of APP_PATHS) {
    revalidatePath(path);
  }

  refresh();
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error("??????????? ??????");
}

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function toDataObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function createLeg(accountId: string, direction: LegDirection, amountDecimal: string, currency: Currency) {
  return {
    accountId,
    direction,
    amountDecimal: new Prisma.Decimal(amountDecimal),
    currency,
  };
}

export async function createExpense(formData: FormData) {
  try {
    const data = expenseTransactionSchema.parse(toDataObject(formData));
    const [account, category] = await prisma.$transaction([
      prisma.account.findUnique({ where: { id: data.accountId } }),
      prisma.category.findUnique({ where: { id: data.categoryId } }),
    ]);

    ensure(account, "???? ?? ??????");
    ensure(!account.isArchived, "?????? ????????? ????? ???????? ? ???????? ?????");
    ensure(category, "????????? ?? ???????");
    ensure(!category.isDeleted, "?????? ????????? ????????? ????????? ????? ????????");

    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        occurredAt: parseOccurredOn(data.occurredOn),
        note: data.note,
        categoryId: category.id,
        categorySnapshotName: category.name,
        legs: {
          create: [createLeg(account.id, LegDirection.OUT, data.amount, account.currency)],
        },
      },
    });

    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateExpense(formData: FormData) {
  try {
    const data = expenseTransactionSchema.parse(toDataObject(formData));
    ensure(data.transactionId, "??? id ??????????");

    const existing = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      include: {
        legs: true,
      },
    });
    const [account, category] = await prisma.$transaction([
      prisma.account.findUnique({ where: { id: data.accountId } }),
      prisma.category.findUnique({ where: { id: data.categoryId } }),
    ]);

    ensure(existing, "?????????? ?? ???????");
    ensure(account, "???? ?? ??????");
    ensure(category, "????????? ?? ???????");

    if (category.isDeleted) {
      ensure(existing.categoryId === category.id, "?????? ????????? ????????? ????????? ?????? ????????");
    }

    await prisma.transaction.update({
      where: { id: data.transactionId },
      data: {
        type: TransactionType.EXPENSE,
        occurredAt: parseOccurredOn(data.occurredOn),
        note: data.note,
        categoryId: category.id,
        categorySnapshotName: category.name,
        legs: {
          deleteMany: {},
          create: [createLeg(account.id, LegDirection.OUT, data.amount, account.currency)],
        },
      },
    });

    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createIncome(formData: FormData) {
  try {
    const data = incomeTransactionSchema.parse(toDataObject(formData));
    const account = await prisma.account.findUnique({ where: { id: data.accountId } });

    ensure(account, "???? ?? ??????");
    ensure(!account.isArchived, "?????? ????????? ????? ???????? ? ???????? ?????");

    await prisma.transaction.create({
      data: {
        type: TransactionType.INCOME,
        occurredAt: parseOccurredOn(data.occurredOn),
        note: data.note,
        legs: {
          create: [createLeg(account.id, LegDirection.IN, data.amount, account.currency)],
        },
      },
    });

    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateIncome(formData: FormData) {
  try {
    const data = incomeTransactionSchema.parse(toDataObject(formData));
    ensure(data.transactionId, "??? id ??????????");

    const account = await prisma.account.findUnique({ where: { id: data.accountId } });
    ensure(account, "???? ?? ??????");

    await prisma.transaction.update({
      where: { id: data.transactionId },
      data: {
        type: TransactionType.INCOME,
        occurredAt: parseOccurredOn(data.occurredOn),
        note: data.note,
        categoryId: null,
        categorySnapshotName: null,
        legs: {
          deleteMany: {},
          create: [createLeg(account.id, LegDirection.IN, data.amount, account.currency)],
        },
      },
    });

    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createTransfer(formData: FormData) {
  try {
    const data = transferTransactionSchema.parse(toDataObject(formData));
    const [fromAccount, toAccount] = await prisma.$transaction([
      prisma.account.findUnique({ where: { id: data.fromAccountId } }),
      prisma.account.findUnique({ where: { id: data.toAccountId } }),
    ]);

    ensure(fromAccount, "???? ???????? ?? ??????");
    ensure(toAccount, "???? ?????????? ?? ??????");
    ensure(!fromAccount.isArchived && !toAccount.isArchived, "?????? ????????? ????? ??????? ? ????????? ???????");
    ensure(fromAccount.id !== toAccount.id, "????? ???????? ?????? ??????????");
    ensure(fromAccount.currency === toAccount.currency, "??????? ???????????? ?????? ???? ??????");

    await prisma.transaction.create({
      data: {
        type: TransactionType.TRANSFER,
        occurredAt: parseOccurredOn(data.occurredOn),
        note: data.note,
        legs: {
          create: [
            createLeg(fromAccount.id, LegDirection.OUT, data.amount, fromAccount.currency),
            createLeg(toAccount.id, LegDirection.IN, data.amount, toAccount.currency),
          ],
        },
      },
    });

    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateTransfer(formData: FormData) {
  try {
    const data = transferTransactionSchema.parse(toDataObject(formData));
    ensure(data.transactionId, "??? id ??????????");

    const [fromAccount, toAccount] = await prisma.$transaction([
      prisma.account.findUnique({ where: { id: data.fromAccountId } }),
      prisma.account.findUnique({ where: { id: data.toAccountId } }),
    ]);

    ensure(fromAccount, "???? ???????? ?? ??????");
    ensure(toAccount, "???? ?????????? ?? ??????");
    ensure(fromAccount.id !== toAccount.id, "????? ???????? ?????? ??????????");
    ensure(fromAccount.currency === toAccount.currency, "??????? ???????????? ?????? ???? ??????");

    await prisma.transaction.update({
      where: { id: data.transactionId },
      data: {
        type: TransactionType.TRANSFER,
        occurredAt: parseOccurredOn(data.occurredOn),
        note: data.note,
        categoryId: null,
        categorySnapshotName: null,
        legs: {
          deleteMany: {},
          create: [
            createLeg(fromAccount.id, LegDirection.OUT, data.amount, fromAccount.currency),
            createLeg(toAccount.id, LegDirection.IN, data.amount, toAccount.currency),
          ],
        },
      },
    });

    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createExchange(formData: FormData) {
  try {
    const data = exchangeTransactionSchema.parse(toDataObject(formData));
    const [fromAccount, toAccount] = await prisma.$transaction([
      prisma.account.findUnique({ where: { id: data.fromAccountId } }),
      prisma.account.findUnique({ where: { id: data.toAccountId } }),
    ]);

    ensure(fromAccount, "???? ???????? ?? ??????");
    ensure(toAccount, "???? ?????????? ?? ??????");
    ensure(!fromAccount.isArchived && !toAccount.isArchived, "?????? ????????? ????? ????? ? ????????? ???????");
    ensure(fromAccount.id !== toAccount.id, "????? ?????? ?????? ??????????");
    ensure(fromAccount.currency !== toAccount.currency, "????? ?????? ???? ????? ??????? ????????");

    await prisma.transaction.create({
      data: {
        type: TransactionType.EXCHANGE,
        occurredAt: parseOccurredOn(data.occurredOn),
        note: data.note,
        legs: {
          create: [
            createLeg(fromAccount.id, LegDirection.OUT, data.fromAmount, fromAccount.currency),
            createLeg(toAccount.id, LegDirection.IN, data.toAmount, toAccount.currency),
          ],
        },
      },
    });

    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateExchange(formData: FormData) {
  try {
    const data = exchangeTransactionSchema.parse(toDataObject(formData));
    ensure(data.transactionId, "??? id ??????????");

    const [fromAccount, toAccount] = await prisma.$transaction([
      prisma.account.findUnique({ where: { id: data.fromAccountId } }),
      prisma.account.findUnique({ where: { id: data.toAccountId } }),
    ]);

    ensure(fromAccount, "???? ???????? ?? ??????");
    ensure(toAccount, "???? ?????????? ?? ??????");
    ensure(fromAccount.id !== toAccount.id, "????? ?????? ?????? ??????????");
    ensure(fromAccount.currency !== toAccount.currency, "????? ?????? ???? ????? ??????? ????????");

    await prisma.transaction.update({
      where: { id: data.transactionId },
      data: {
        type: TransactionType.EXCHANGE,
        occurredAt: parseOccurredOn(data.occurredOn),
        note: data.note,
        categoryId: null,
        categorySnapshotName: null,
        legs: {
          deleteMany: {},
          create: [
            createLeg(fromAccount.id, LegDirection.OUT, data.fromAmount, fromAccount.currency),
            createLeg(toAccount.id, LegDirection.IN, data.toAmount, toAccount.currency),
          ],
        },
      },
    });

    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteTransaction(formData: FormData) {
  try {
    const data = deleteTransactionSchema.parse(toDataObject(formData));
    await prisma.transaction.delete({
      where: { id: data.transactionId },
    });
    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createCategory(formData: FormData) {
  try {
    const data = createCategorySchema.parse(toDataObject(formData));
    const existing = await prisma.category.findUnique({ where: { name: data.name } });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });
    } else {
      await prisma.category.create({
        data: { name: data.name },
      });
    }

    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateCategory(formData: FormData) {
  try {
    const data = updateCategorySchema.parse(toDataObject(formData));
    await prisma.category.update({
      where: { id: data.categoryId },
      data: {
        name: data.name,
      },
    });
    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteCategory(formData: FormData) {
  try {
    const data = categoryMutationSchema.parse(toDataObject(formData));
    await prisma.category.update({
      where: { id: data.categoryId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function restoreCategory(formData: FormData) {
  try {
    const data = categoryMutationSchema.parse(toDataObject(formData));
    await prisma.category.update({
      where: { id: data.categoryId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createAccount(formData: FormData) {
  try {
    const data = createAccountSchema.parse(toDataObject(formData));
    const existing = await prisma.account.findUnique({ where: { name: data.name } });

    if (existing) {
      await prisma.account.update({
        where: { id: existing.id },
        data: {
          kind: data.kind as AccountKind,
          currency: data.currency as Currency,
          isArchived: false,
        },
      });
    } else {
      await prisma.account.create({
        data: {
          name: data.name,
          kind: data.kind as AccountKind,
          currency: data.currency as Currency,
        },
      });
    }

    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateAccount(formData: FormData) {
  try {
    const data = updateAccountSchema.parse(toDataObject(formData));
    const existing = await prisma.account.findUnique({
      where: { id: data.accountId },
      include: {
        _count: {
          select: {
            legs: true,
          },
        },
      },
    });

    ensure(existing, "???? ?? ??????");
    if (existing._count.legs > 0) {
      ensure(existing.currency === data.currency, "?????? ?????? ?????? ????? ? ???????? ????????");
    }

    await prisma.account.update({
      where: { id: data.accountId },
      data: {
        name: data.name,
        kind: data.kind as AccountKind,
        currency: data.currency as Currency,
      },
    });

    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function archiveAccount(formData: FormData) {
  try {
    const data = accountMutationSchema.parse(toDataObject(formData));
    await prisma.account.update({
      where: { id: data.accountId },
      data: {
        isArchived: true,
      },
    });
    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function restoreAccount(formData: FormData) {
  try {
    const data = accountMutationSchema.parse(toDataObject(formData));
    await prisma.account.update({
      where: { id: data.accountId },
      data: {
        isArchived: false,
      },
    });
    revalidateApp();
  } catch (error) {
    throw normalizeError(error);
  }
}
