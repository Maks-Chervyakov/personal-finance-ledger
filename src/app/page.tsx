import Link from "next/link";
import { Currency } from "@prisma/client";

import { PieChart } from "@/components/pie-chart";
import { TransactionList } from "@/components/transaction-list";
import { ACCOUNT_KIND_LABELS } from "@/lib/constants";
import {
  getOverviewData,
  parseOverviewMonth,
  type MonthlyCurrencyFlow,
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

function getLargestBalance(flows: MonthlyCurrencyFlow[]) {
  return flows.reduce(
    (best, flow) => (flow.closingBalance > best.closingBalance ? flow : best),
    flows[0],
  );
}

export default async function Home({ searchParams }: HomePageProps) {
  const month = parseOverviewMonth(await searchParams);
  const overview = await getOverviewData(month);
  const operationsHref = `/operations?month=${month}`;
  const analyticsHref = `/analytics?month=${month}`;
  const largestBalance = getLargestBalance(overview.monthlyFlows);
  const maxBalance = Math.max(
    ...overview.monthlyFlows.map((flow) => Math.abs(flow.closingBalance)),
    1,
  );

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

          <div className="mt-8 grid gap-3 md:grid-cols-[220px_1fr] md:items-center">
            <div className="rounded-2xl border border-black/6 bg-stone-50 p-4">
              <div className="text-xs uppercase tracking-[0.08em] text-stone-500">
                Самый крупный остаток
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-950">
                {formatMoney(largestBalance.closingBalance, largestBalance.currency)}
              </div>
              <Link
                href={analyticsHref}
                className="mt-4 inline-flex rounded-full border border-black/8 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-white"
              >
                Детальная аналитика
              </Link>
            </div>

            <div className="space-y-3">
              {overview.monthlyFlows.map((flow) => {
                const width = Math.max(4, (Math.abs(flow.closingBalance) / maxBalance) * 100);

                return (
                  <div key={flow.currency}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-stone-900">{flow.currency}</span>
                      <span className="text-stone-600">
                        {formatMoney(flow.closingBalance, flow.currency)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                      <div
                        className={`h-full rounded-full ${flow.closingBalance >= 0 ? "bg-emerald-400" : "bg-amber-400"}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
              className="inline-flex items-center justify-center rounded-full border border-black/8 bg-stone-950 px-4 py-2 text-sm font-semibold leading-none text-white shadow-sm transition hover:bg-stone-800"
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
                Балансы считаются по всем операциям
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/45 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Категории
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {overview.totalCategoriesCount - overview.deletedCategoriesCount}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                Используются для новых расходов
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
              Движение и остатки
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
          {overview.monthlyFlows.map((flow) => {
            const cardStyles = currencyCardClasses[flow.currency];

            return (
              <article
                key={flow.currency}
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
                      {flow.currency}
                    </span>
                    <span className="text-sm text-slate-400">
                      {formatCount(
                        flow.transactionCount,
                        "\u043e\u043f\u0435\u0440\u0430\u0446\u0438\u044f",
                        "\u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0438",
                        "\u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0439",
                      )}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {"\u0411\u044b\u043b\u043e"}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {formatMoney(flow.openingBalance, flow.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {"\u0420\u0430\u0441\u0445\u043e\u0434\u044b"}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-rose-100">
                        {formatMoney(flow.expenseTotal, flow.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {"\u041e\u0441\u0442\u0430\u0442\u043e\u043a"}
                      </div>
                      <div
                        className={`mt-2 text-lg font-semibold ${
                          flow.closingBalance >= flow.openingBalance ? "text-emerald-100" : "text-amber-100"
                        }`}
                      >
                        {formatMoney(flow.closingBalance, flow.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-black/6 bg-white/70 p-3 text-xs leading-5 text-stone-600">
                    {"\u0414\u043e\u0445\u043e\u0434\u044b"}: {formatMoney(flow.incomeTotal, flow.currency)}. {"\u041f\u0435\u0440\u0435\u0432\u043e\u0434\u044b/\u043e\u0431\u043c\u0435\u043d\u044b"}: +{formatMoney(flow.movementInTotal, flow.currency)} / -{formatMoney(flow.movementOutTotal, flow.currency)}.
                  </div>
                </div>
              </article>
            );
          })}        </div>
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
