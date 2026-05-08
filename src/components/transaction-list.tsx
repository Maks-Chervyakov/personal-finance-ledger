import Link from "next/link";
import { LegDirection, TransactionType } from "@prisma/client";

import { deleteTransaction } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import type { TransactionWithDetails } from "@/lib/data";
import { decimalToNumber, formatDate, formatMoney } from "@/lib/utils";

type TransactionListProps = {
  transactions: TransactionWithDetails[];
  variant?: "feed" | "preview";
  activeTransactionId?: string;
  buildEditHref?: (transactionId: string) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyCtaHref?: string;
  emptyCtaLabel?: string;
  footerHref?: string;
  footerLabel?: string;
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
      return `${out?.account.name ?? "Счет"} -> ${
        transaction.categorySnapshotName ?? "Без категории"
      } (${out ? formatMoney(out.amountDecimal, out.currency) : "—"})`;
    case TransactionType.INCOME:
      return `${incoming?.account.name ?? "Счет"} <- доход (${
        incoming ? formatMoney(incoming.amountDecimal, incoming.currency) : "—"
      })`;
    case TransactionType.TRANSFER:
      return `${out?.account.name ?? "Счет"} -> ${
        incoming?.account.name ?? "Счет"
      } (${out ? formatMoney(out.amountDecimal, out.currency) : "—"})`;
    case TransactionType.EXCHANGE:
      return `${out?.account.name ?? "Счет"} -> ${
        incoming?.account.name ?? "Счет"
      } (${out ? formatMoney(out.amountDecimal, out.currency) : "—"} -> ${
        incoming ? formatMoney(incoming.amountDecimal, incoming.currency) : "—"
      })`;
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

export function TransactionList({
  transactions,
  variant = "feed",
  activeTransactionId,
  buildEditHref,
  emptyTitle = "Операций пока нет",
  emptyDescription = "Создай первую запись, чтобы журнал и аналитика ожили.",
  emptyCtaHref,
  emptyCtaLabel,
  footerHref,
  footerLabel,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <section className="rounded-[28px] border border-dashed border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300 shadow-xl shadow-slate-950/20">
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-white">{emptyTitle}</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {emptyDescription}
            </p>
          </div>
          {emptyCtaHref && emptyCtaLabel ? (
            <Link
              href={emptyCtaHref}
              className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-300/60 hover:bg-cyan-400/15"
            >
              {emptyCtaLabel}
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const categoryDeleted = Boolean(transaction.category?.isDeleted);
        const rateLabel = getRateLabel(transaction);
        const isPreview = variant === "preview";
        const editHref = buildEditHref?.(transaction.id);
        const isActive = transaction.id === activeTransactionId;
        const summary = getSummary(transaction);

        return (
          <article
            key={transaction.id}
            className={`rounded-[28px] border p-4 transition sm:p-5 ${
              isPreview
                ? "border-white/8 bg-slate-900/55"
                : "bg-slate-900/70 shadow-xl shadow-slate-950/20"
            } ${
              isActive
                ? "border-cyan-300/40 shadow-2xl shadow-cyan-950/30"
                : "border-white/10"
            }`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 font-medium uppercase tracking-[0.24em] text-slate-100">
                    {TRANSACTION_TYPE_LABELS[transaction.type]}
                  </span>
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 font-medium text-cyan-100/90">
                    {formatDate(transaction.occurredAt)}
                  </span>
                  {categoryDeleted ? (
                    <span className="rounded-full bg-amber-500/14 px-3 py-1 font-medium text-amber-200">
                      Категория удалена
                    </span>
                  ) : null}
                </div>

                <h3
                  className={`text-white ${
                    isPreview ? "text-base font-medium" : "text-lg font-semibold"
                  }`}
                >
                  {summary}
                </h3>

                {transaction.note ? (
                  <p className="max-w-3xl text-sm leading-6 text-slate-300">
                    {transaction.note}
                  </p>
                ) : null}

                {rateLabel ? (
                  <p className="text-sm text-cyan-200">{rateLabel}</p>
                ) : null}
              </div>

              {!isPreview ? (
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {editHref ? (
                    <Link
                      href={editHref}
                      className="rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/5"
                    >
                      Редактировать
                    </Link>
                  ) : null}
                  <ActionForm action={deleteTransaction}>
                    <input
                      type="hidden"
                      name="transactionId"
                      value={transaction.id}
                    />
                    <SubmitButton
                      label="Удалить"
                      pendingLabel="Удаляю..."
                      ariaLabel={`Удалить операцию ${summary}`}
                      confirmMessage={`Удалить операцию "${summary}"? Это действие нельзя отменить.`}
                      className="rounded-full border border-rose-500/35 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </ActionForm>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}

      {footerHref && footerLabel ? (
        <div className="pt-2">
          <Link
            href={footerHref}
            className="inline-flex rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
          >
            {footerLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
