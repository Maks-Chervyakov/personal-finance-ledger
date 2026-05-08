import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LegDirection,
  TransactionType,
  type Account,
  type Category,
} from "@prisma/client";

import {
  updateExchange,
  updateExpense,
  updateIncome,
  updateTransfer,
} from "@/app/actions";
import {
  ExchangeForm,
  ExpenseForm,
  IncomeForm,
  TransferForm,
} from "@/components/transaction-forms";
import { TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import type { TransactionWithDetails } from "@/lib/data";
import type { FormActionState } from "@/lib/form-state";
import { decimalToString, formatDate } from "@/lib/utils";

type TransactionEditorSheetProps = {
  transaction: TransactionWithDetails;
  accounts: Account[];
  categories: Category[];
  closeHref: string;
};

function getLegs(transaction: TransactionWithDetails) {
  return {
    out: transaction.legs.find((leg) => leg.direction === LegDirection.OUT),
    incoming: transaction.legs.find((leg) => leg.direction === LegDirection.IN),
  };
}

export function TransactionEditorSheet({
  transaction,
  accounts,
  categories,
  closeHref,
}: TransactionEditorSheetProps) {
  const { out, incoming } = getLegs(transaction);

  async function updateExpenseAndClose(prevState: FormActionState, formData: FormData): Promise<FormActionState> {
    "use server";

    const result = await updateExpense(prevState, formData);
    if (result.status === "error") {
      return result;
    }

    redirect(closeHref);
  }

  async function updateIncomeAndClose(prevState: FormActionState, formData: FormData): Promise<FormActionState> {
    "use server";

    const result = await updateIncome(prevState, formData);
    if (result.status === "error") {
      return result;
    }

    redirect(closeHref);
  }

  async function updateTransferAndClose(prevState: FormActionState, formData: FormData): Promise<FormActionState> {
    "use server";

    const result = await updateTransfer(prevState, formData);
    if (result.status === "error") {
      return result;
    }

    redirect(closeHref);
  }

  async function updateExchangeAndClose(prevState: FormActionState, formData: FormData): Promise<FormActionState> {
    "use server";

    const result = await updateExchange(prevState, formData);
    if (result.status === "error") {
      return result;
    }

    redirect(closeHref);
  }

  return (
    <div className="fixed inset-0 z-50">
      <Link
        href={closeHref}
        aria-label="Закрыть редактирование"
        className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm"
      />

      <aside className="absolute inset-x-0 bottom-0 top-0 ml-auto flex w-full max-w-[640px] flex-col border-l border-white/10 bg-slate-950/96 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
              Редактирование
            </p>
            <h2 className="text-xl font-semibold text-white">
              {TRANSACTION_TYPE_LABELS[transaction.type]}
            </h2>
            <p className="text-sm text-slate-400">
              Дата операции: {formatDate(transaction.occurredAt)}
            </p>
          </div>

          <Link
            href={closeHref}
            className="rounded-full border border-white/12 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
          >
            Закрыть
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {transaction.type === TransactionType.EXPENSE && out ? (
            <ExpenseForm
              accounts={accounts}
              categories={categories}
              action={updateExpenseAndClose}
              submitLabel="Сохранить расход"
              pendingLabel="Сохраняю..."
              compact
              initial={{
                transactionId: transaction.id,
                occurredOn: transaction.occurredAt.toISOString().slice(0, 10),
                note: transaction.note ?? "",
                accountId: out.accountId,
                categoryId: transaction.categoryId ?? undefined,
                amount: decimalToString(out.amountDecimal),
              }}
            />
          ) : null}

          {transaction.type === TransactionType.INCOME && incoming ? (
            <IncomeForm
              accounts={accounts}
              action={updateIncomeAndClose}
              submitLabel="Сохранить доход"
              pendingLabel="Сохраняю..."
              compact
              initial={{
                transactionId: transaction.id,
                occurredOn: transaction.occurredAt.toISOString().slice(0, 10),
                note: transaction.note ?? "",
                accountId: incoming.accountId,
                amount: decimalToString(incoming.amountDecimal),
              }}
            />
          ) : null}

          {transaction.type === TransactionType.TRANSFER && out && incoming ? (
            <TransferForm
              accounts={accounts}
              action={updateTransferAndClose}
              submitLabel="Сохранить перевод"
              pendingLabel="Сохраняю..."
              compact
              initial={{
                transactionId: transaction.id,
                occurredOn: transaction.occurredAt.toISOString().slice(0, 10),
                note: transaction.note ?? "",
                fromAccountId: out.accountId,
                toAccountId: incoming.accountId,
                amount: decimalToString(out.amountDecimal),
              }}
            />
          ) : null}

          {transaction.type === TransactionType.EXCHANGE && out && incoming ? (
            <ExchangeForm
              accounts={accounts}
              action={updateExchangeAndClose}
              submitLabel="Сохранить обмен"
              pendingLabel="Сохраняю..."
              compact
              initial={{
                transactionId: transaction.id,
                occurredOn: transaction.occurredAt.toISOString().slice(0, 10),
                note: transaction.note ?? "",
                fromAccountId: out.accountId,
                toAccountId: incoming.accountId,
                fromAmount: decimalToString(out.amountDecimal),
                toAmount: decimalToString(incoming.amountDecimal),
              }}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}
