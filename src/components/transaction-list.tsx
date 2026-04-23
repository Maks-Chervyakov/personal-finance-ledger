import { LegDirection, TransactionType, type Account, type Category } from "@prisma/client";

import {
  deleteTransaction,
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
import { SubmitButton } from "@/components/submit-button";
import { TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import type { TransactionWithDetails } from "@/lib/data";
import { decimalToNumber, decimalToString, formatDate, formatMoney } from "@/lib/utils";

type TransactionListProps = {
  transactions: TransactionWithDetails[];
  accounts: Account[];
  categories: Category[];
};

function getLegs(transaction: TransactionWithDetails) {
  return {
    out: transaction.legs.find((leg) => leg.direction === LegDirection.OUT),
    incoming: transaction.legs.find((leg) => leg.direction === LegDirection.IN),
  };
}

function getSummary(transaction: TransactionWithDetails): string {
  const { out, incoming } = getLegs(transaction);

  switch (transaction.type) {
    case TransactionType.EXPENSE:
      return `${out?.account.name ?? "Счет"} -> ${transaction.categorySnapshotName ?? "Без категории"} (${out ? formatMoney(out.amountDecimal, out.currency) : "—"})`;
    case TransactionType.INCOME:
      return `${incoming?.account.name ?? "Счет"} <- доход (${incoming ? formatMoney(incoming.amountDecimal, incoming.currency) : "—"})`;
    case TransactionType.TRANSFER:
      return `${out?.account.name ?? "Счет"} -> ${incoming?.account.name ?? "Счет"} (${out ? formatMoney(out.amountDecimal, out.currency) : "—"})`;
    case TransactionType.EXCHANGE:
      return `${out?.account.name ?? "Счет"} -> ${incoming?.account.name ?? "Счет"} (${out ? formatMoney(out.amountDecimal, out.currency) : "—"} -> ${incoming ? formatMoney(incoming.amountDecimal, incoming.currency) : "—"})`;
    default:
      return TRANSACTION_TYPE_LABELS[transaction.type];
  }
}

function getRateLabel(transaction: TransactionWithDetails): string | null {
  if (transaction.type !== TransactionType.EXCHANGE) {
    return null;
  }

  const { out, incoming } = getLegs(transaction);
  if (!out || !incoming) {
    return null;
  }

  const fromAmount = decimalToNumber(out.amountDecimal);
  const toAmount = decimalToNumber(incoming.amountDecimal);
  if (fromAmount === 0) {
    return null;
  }

  const rate = toAmount / fromAmount;
  return `Курс: 1 ${out.currency} = ${rate.toFixed(4)} ${incoming.currency}`;
}

export function TransactionList({ transactions, accounts, categories }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
        За выбранный период нет операций. Добавь первую запись выше.
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const { out, incoming } = getLegs(transaction);
        const categoryDeleted = Boolean(transaction.category?.isDeleted);
        const rateLabel = getRateLabel(transaction);

        return (
          <article key={transaction.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
                    {TRANSACTION_TYPE_LABELS[transaction.type]}
                  </span>
                  <span className="text-sm text-slate-400">{formatDate(transaction.occurredAt)}</span>
                  {categoryDeleted ? <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">Категория удалена</span> : null}
                </div>
                <h3 className="text-lg font-semibold text-white">{getSummary(transaction)}</h3>
                {transaction.note ? <p className="text-sm text-slate-300">{transaction.note}</p> : null}
                {rateLabel ? <p className="text-sm text-blue-300">{rateLabel}</p> : null}
              </div>

              <form action={deleteTransaction}>
                <input type="hidden" name="transactionId" value={transaction.id} />
                <SubmitButton
                  label="Удалить"
                  pendingLabel="Удаляю..."
                  className="rounded-xl border border-rose-500/40 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </form>
            </div>

            <details className="mt-5 rounded-2xl border border-white/6 bg-slate-950/40 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-200">Редактировать операцию</summary>
              <div className="mt-4">
                {transaction.type === TransactionType.EXPENSE && out ? (
                  <ExpenseForm
                    accounts={accounts}
                    categories={categories}
                    action={updateExpense}
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
                    action={updateIncome}
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
                    action={updateTransfer}
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
                    action={updateExchange}
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
            </details>
          </article>
        );
      })}
    </div>
  );
}
