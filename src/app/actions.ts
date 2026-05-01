"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AccountKind, LegDirection, Prisma, TransactionType, type Currency } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { parseOccurredOn, toOptionalText } from "@/lib/utils";
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

const APP_PATHS = [
  "/",
  "/operations",
  "/operations/new",
  "/analytics",
  "/manage/accounts",
  "/manage/categories",
];

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

  return new Error("Непредвиденная ошибка");
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
  const redirectTo = toOptionalText(formData.get("redirectTo"));

  try {
    const data = expenseTransactionSchema.parse(toDataObject(formData));
    const [account, category] = await prisma.$transaction([
      prisma.account.findUnique({ where: { id: data.accountId } }),
      prisma.category.findUnique({ where: { id: data.categoryId } }),
    ]);

    ensure(account, "Счет не найден");
    ensure(!account.isArchived, "Нельзя создавать запись в архивном счете");
    ensure(category, "Категория не найдена");
    ensure(!category.isDeleted, "Нельзя создавать расход в удаленной категории");

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

  if (redirectTo) {
    redirect(redirectTo);
  }
}

export async function updateExpense(formData: FormData) {
  const redirectTo = toOptionalText(formData.get("redirectTo"));

  try {
    const data = expenseTransactionSchema.parse(toDataObject(formData));
    ensure(data.transactionId, "Нет id транзакции");

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

    ensure(existing, "Транзакция не найдена");
    ensure(account, "Счет не найден");
    ensure(category, "Категория не найдена");

    if (category.isDeleted) {
      ensure(existing.categoryId === category.id, "Нельзя менять удаленную категорию на другую");
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

  if (redirectTo) {
    redirect(redirectTo);
  }
}

export async function createIncome(formData: FormData) {
  const redirectTo = toOptionalText(formData.get("redirectTo"));

  try {
    const data = incomeTransactionSchema.parse(toDataObject(formData));
    const account = await prisma.account.findUnique({ where: { id: data.accountId } });

    ensure(account, "Счет не найден");
    ensure(!account.isArchived, "Нельзя создавать запись в архивном счете");

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

  if (redirectTo) {
    redirect(redirectTo);
  }
}

export async function updateIncome(formData: FormData) {
  const redirectTo = toOptionalText(formData.get("redirectTo"));

  try {
    const data = incomeTransactionSchema.parse(toDataObject(formData));
    ensure(data.transactionId, "Нет id транзакции");

    const account = await prisma.account.findUnique({ where: { id: data.accountId } });
    ensure(account, "Счет не найден");

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

  if (redirectTo) {
    redirect(redirectTo);
  }
}

export async function createTransfer(formData: FormData) {
  const redirectTo = toOptionalText(formData.get("redirectTo"));

  try {
    const data = transferTransactionSchema.parse(toDataObject(formData));
    const [fromAccount, toAccount] = await prisma.$transaction([
      prisma.account.findUnique({ where: { id: data.fromAccountId } }),
      prisma.account.findUnique({ where: { id: data.toAccountId } }),
    ]);

    ensure(fromAccount, "Счет списания не найден");
    ensure(toAccount, "Счет зачисления не найден");
    ensure(!fromAccount.isArchived && !toAccount.isArchived, "Нельзя создавать перевод из или в архивный счет");
    ensure(fromAccount.id !== toAccount.id, "Нельзя переводить на тот же счет");
    ensure(fromAccount.currency === toAccount.currency, "Перевод возможен только между счетами одной валюты");

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

  if (redirectTo) {
    redirect(redirectTo);
  }
}

export async function updateTransfer(formData: FormData) {
  const redirectTo = toOptionalText(formData.get("redirectTo"));

  try {
    const data = transferTransactionSchema.parse(toDataObject(formData));
    ensure(data.transactionId, "Нет id транзакции");

    const [fromAccount, toAccount] = await prisma.$transaction([
      prisma.account.findUnique({ where: { id: data.fromAccountId } }),
      prisma.account.findUnique({ where: { id: data.toAccountId } }),
    ]);

    ensure(fromAccount, "Счет списания не найден");
    ensure(toAccount, "Счет зачисления не найден");
    ensure(fromAccount.id !== toAccount.id, "Нельзя переводить на тот же счет");
    ensure(fromAccount.currency === toAccount.currency, "Перевод возможен только между счетами одной валюты");

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

  if (redirectTo) {
    redirect(redirectTo);
  }
}

export async function createExchange(formData: FormData) {
  const redirectTo = toOptionalText(formData.get("redirectTo"));

  try {
    const data = exchangeTransactionSchema.parse(toDataObject(formData));
    const [fromAccount, toAccount] = await prisma.$transaction([
      prisma.account.findUnique({ where: { id: data.fromAccountId } }),
      prisma.account.findUnique({ where: { id: data.toAccountId } }),
    ]);

    ensure(fromAccount, "Счет списания не найден");
    ensure(toAccount, "Счет зачисления не найден");
    ensure(!fromAccount.isArchived && !toAccount.isArchived, "Нельзя создавать обмен из или в архивный счет");
    ensure(fromAccount.id !== toAccount.id, "Нельзя использовать один и тот же счет");
    ensure(fromAccount.currency !== toAccount.currency, "Для обмена нужны счета в разных валютах");

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

  if (redirectTo) {
    redirect(redirectTo);
  }
}

export async function updateExchange(formData: FormData) {
  const redirectTo = toOptionalText(formData.get("redirectTo"));

  try {
    const data = exchangeTransactionSchema.parse(toDataObject(formData));
    ensure(data.transactionId, "Нет id транзакции");

    const [fromAccount, toAccount] = await prisma.$transaction([
      prisma.account.findUnique({ where: { id: data.fromAccountId } }),
      prisma.account.findUnique({ where: { id: data.toAccountId } }),
    ]);

    ensure(fromAccount, "Счет списания не найден");
    ensure(toAccount, "Счет зачисления не найден");
    ensure(fromAccount.id !== toAccount.id, "Нельзя использовать один и тот же счет");
    ensure(fromAccount.currency !== toAccount.currency, "Для обмена нужны счета в разных валютах");

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

  if (redirectTo) {
    redirect(redirectTo);
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

export async function hardDeleteCategory(formData: FormData) {
  try {
    const data = categoryMutationSchema.parse(toDataObject(formData));
    await prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });

      ensure(category, "РљР°С‚РµРіРѕСЂРёСЏ РЅРµ РЅР°Р№РґРµРЅР°");

      await tx.transaction.deleteMany({
        where: {
          categoryId: category.id,
        },
      });
      await tx.category.delete({
        where: {
          id: category.id,
        },
      });
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

    ensure(existing, "Счет не найден");
    if (existing._count.legs > 0) {
      ensure(existing.currency === data.currency, "Нельзя менять валюту счета с историей операций");
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
