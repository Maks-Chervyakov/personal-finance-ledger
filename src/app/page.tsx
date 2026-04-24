import Link from "next/link";
import { Currency } from "@prisma/client";

import { PieChart } from "@/components/pie-chart";
import { TransactionList } from "@/components/transaction-list";
import { ACCOUNT_KIND_LABELS } from "@/lib/constants";
import {
  getOverviewData,
  parseOverviewMonth,
  type SearchParamMap,
} from "@/lib/data";
import { formatCount, formatMoney, getMonthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<SearchParamMap>;
};

const currencyCardClasses: Record<
  Currency,
  { accent: string; chip: string; glow: string }
> = {
  [Currency.UAH]: {
    accent: "from-cyan-400/30 via-cyan-400/8 to-transparent",
    chip: "bg-cyan-400/12 text-cyan-50 border-cyan-300/25",
    glow: "shadow-cyan-950/40",
  },
  [Currency.USD]: {
    accent: "from-emerald-400/30 via-emerald-400/8 to-transparent",
    chip: "bg-emerald-400/12 text-emerald-50 border-emerald-300/25",
    glow: "shadow-emerald-950/35",
  },
  [Currency.USDT]: {
    accent: "from-amber-300/28 via-amber-300/8 to-transparent",
    chip: "bg-amber-300/12 text-amber-50 border-amber-200/25",
    glow: "shadow-amber-950/30",
  },
};

export default async function Home({ searchParams }: HomePageProps) {
  const month = parseOverviewMonth(await searchParams);
  const overview = await getOverviewData(month);
  const operationsHref = `/operations?month=${month}`;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/72 p-6 shadow-2xl shadow-slate-950/30 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">
            Обзор
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold text-white sm:text-4xl">
            {getMonthLabel(month)}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Основные показатели за выбранный период: доходы, расходы, счета и
            последние операции.
          </p>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-900/58 p-5 shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Период
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Для детальной выборки используйте фильтры в журнале операций.
              </p>
            </div>
            <Link
              href="/operations/new"
              className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-300/60 hover:bg-cyan-400/15"
            >
              Новая операция
            </Link>
          </div>

          <form method="get" className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="min-w-0 flex-1 space-y-2 text-sm text-slate-300">
              <span className="block text-xs uppercase tracking-[0.22em] text-slate-500">
                Месяц
              </span>
              <input
                type="month"
                name="month"
                defaultValue={month}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300"
              />
            </label>
            <div className="sm:self-end">
              <button
                type="submit"
                className="w-full rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-50 sm:w-auto"
              >
                Показать
              </button>
            </div>
          </form>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/8 bg-slate-950/45 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Счета
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {overview.activeAccountsCount}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Архивных: {overview.archivedAccountsCount}
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/45 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Категории
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {overview.totalCategoriesCount}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Удаленных: {overview.deletedCategoriesCount}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
              Сводка по валютам
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Доходы, расходы и итог
            </h2>
          </div>
          <Link
            href={operationsHref}
            className="hidden rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            Открыть журнал
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {overview.currencySummaries.map((summary) => {
            const cardStyles = currencyCardClasses[summary.currency];

            return (
              <article
                key={summary.currency}
                className={`relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/70 p-5 shadow-2xl ${cardStyles.glow}`}
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${cardStyles.accent}`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] ${cardStyles.chip}`}
                    >
                      {summary.currency}
                    </span>
                    <span className="text-sm text-slate-400">
                      {formatCount(
                        summary.expenseCount + summary.incomeCount,
                        "операция",
                        "операции",
                        "операций",
                      )}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Расход
                      </div>
                      <div className="mt-2 text-lg font-semibold text-rose-100">
                        {formatMoney(summary.expenseTotal, summary.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Доход
                      </div>
                      <div className="mt-2 text-lg font-semibold text-emerald-100">
                        {formatMoney(summary.incomeTotal, summary.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Итог
                      </div>
                      <div
                        className={`mt-2 text-lg font-semibold ${
                          summary.netTotal >= 0 ? "text-cyan-100" : "text-amber-100"
                        }`}
                      >
                        {formatMoney(summary.netTotal, summary.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
              Структура расходов
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Диаграммы по валютам
            </h2>
          </div>
          <div className="grid gap-4 2xl:grid-cols-2">
            {overview.charts.length > 0 ? (
              overview.charts.map((chart) => (
                <PieChart
                  key={chart.currency}
                  title={chart.title}
                  currency={chart.currency}
                  total={chart.total}
                  slices={chart.slices}
                />
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-900/60 px-5 py-10 text-sm text-slate-400">
                За выбранный период данные для диаграммы отсутствуют.
              </div>
            )}
          </div>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-slate-900/62 p-5 shadow-2xl shadow-slate-950/20 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
                Счета
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Балансы и статус
              </h2>
            </div>
            <Link
              href="/manage/accounts"
              className="rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
            >
              Открыть
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {overview.accounts.length > 0 ? (
              overview.accounts.map((account) => (
                <article
                  key={account.id}
                  className="rounded-3xl border border-white/8 bg-slate-950/45 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
                      {ACCOUNT_KIND_LABELS[account.kind]}
                    </span>
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                      {account.currency}
                    </span>
                    {account.isArchived ? (
                      <span className="rounded-full bg-amber-400/12 px-3 py-1 text-xs font-medium text-amber-100">
                        Архив
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-medium text-emerald-100">
                        Активный
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {account.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                    <span>{formatMoney(account.balance, account.currency)}</span>
                    <span className="text-slate-500">•</span>
                    <span>
                      {formatCount(
                        account.transactionCount,
                        "операция",
                        "операции",
                        "операций",
                      )}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/45 px-4 py-8 text-sm leading-6 text-slate-400">
                Счета не созданы.
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
              Последние операции
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Последние записи
            </h2>
          </div>
          <Link
            href={operationsHref}
            className="rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
          >
            Полный журнал
          </Link>
        </div>

        <TransactionList
          transactions={overview.recentTransactions}
          variant="preview"
          emptyTitle="Операции отсутствуют"
          emptyDescription="За выбранный период записи не найдены."
          emptyCtaHref="/operations/new"
          emptyCtaLabel="Добавить операцию"
          footerHref={operationsHref}
          footerLabel="Открыть журнал операций"
        />
      </section>
    </div>
  );
}
