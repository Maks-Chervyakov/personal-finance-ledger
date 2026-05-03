import Link from "next/link";
import { Currency } from "@prisma/client";

import { BalanceDonutGrid } from "@/components/balance-donut-grid";
import { InfoTooltip } from "@/components/info-tooltip";
import { MonthPickerField } from "@/components/month-picker-field";
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

function FlowMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "income" | "expense" | "movement";
}) {
  const toneClassName = {
    default: "text-white",
    income: "text-emerald-100",
    expense: "text-rose-100",
    movement: "text-amber-100",
  }[tone];

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className={`mt-2 text-lg font-semibold ${toneClassName}`}>{value}</div>
    </div>
  );
}

function getFlowTooltip(flow: MonthlyCurrencyFlow) {
  return (
    <span>
      Осталось = было + прямые доходы + входящие переводы/обмены − расходы −
      исходящие переводы/обмены. Для {flow.currency}: было{" "}
      {formatMoney(flow.openingBalance, flow.currency)}, пришло{" "}
      {formatMoney(flow.movementInTotal, flow.currency)}, прямой доход{" "}
      {formatMoney(flow.incomeTotal, flow.currency)}, ушло{" "}
      {formatMoney(flow.movementOutTotal, flow.currency)}, расходы{" "}
      {formatMoney(flow.expenseTotal, flow.currency)}.
    </span>
  );
}

function FlowCard({ flow }: { flow: MonthlyCurrencyFlow }) {
  const cardStyles = currencyCardClasses[flow.currency];
  const closingTone = flow.closingBalance >= flow.openingBalance ? "income" : "movement";

  return (
    <article
      className={`relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/70 p-5 shadow-2xl ${cardStyles.glow}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${cardStyles.accent}`}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] ${cardStyles.chip}`}
            >
              {flow.currency}
            </span>
            <InfoTooltip label={`Формула движения ${flow.currency}`}>
              {getFlowTooltip(flow)}
            </InfoTooltip>
          </div>
          <span className="text-sm text-slate-400">
            {formatCount(flow.transactionCount, "операция", "операции", "операций")}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <FlowMetric label="Было" value={formatMoney(flow.openingBalance, flow.currency)} />
          {flow.movementInTotal > 0 ? (
            <FlowMetric
              label="Пришло переводом/обменом"
              value={formatMoney(flow.movementInTotal, flow.currency)}
              tone="income"
            />
          ) : null}
          {flow.incomeTotal > 0 ? (
            <FlowMetric
              label="Прямой доход"
              value={formatMoney(flow.incomeTotal, flow.currency)}
              tone="income"
            />
          ) : null}
          {flow.movementOutTotal > 0 ? (
            <FlowMetric
              label="Ушло переводом/обменом"
              value={formatMoney(flow.movementOutTotal, flow.currency)}
              tone="movement"
            />
          ) : null}
          {flow.expenseTotal > 0 ? (
            <FlowMetric
              label="Расходы"
              value={formatMoney(flow.expenseTotal, flow.currency)}
              tone="expense"
            />
          ) : null}
          <FlowMetric
            label="Осталось"
            value={formatMoney(flow.closingBalance, flow.currency)}
            tone={closingTone}
          />
        </div>
      </div>
    </article>
  );
}

export default async function Home({ searchParams }: HomePageProps) {
  const month = parseOverviewMonth(await searchParams);
  const overview = await getOverviewData(month);
  const operationsHref = `/operations?month=${month}`;
  const analyticsHref = `/analytics?month=${month}`;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:-mx-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.65fr)] 2xl:-mx-16 min-[1800px]:-mx-40">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/72 p-6 shadow-2xl shadow-slate-950/30 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">
            Обзор
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold text-white sm:text-4xl">
            {getMonthLabel(month)}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Остатки на конец выбранного месяца, движение средств и последние
            операции.
          </p>

          <BalanceDonutGrid groups={overview.balanceCharts} />

          <Link
            href={analyticsHref}
            className="mt-5 inline-flex rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white"
          >
            Детальная аналитика
          </Link>
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
              <MonthPickerField
                key={month}
                name="month"
                defaultValue={month}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm font-medium text-white outline-none transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20"
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
          {overview.monthlyFlows.map((flow) => (
            <FlowCard key={flow.currency} flow={flow} />
          ))}
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
          <div className="grid min-w-0 gap-4">
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
