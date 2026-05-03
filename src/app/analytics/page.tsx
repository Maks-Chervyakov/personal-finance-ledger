import Link from "next/link";

import { InfoTooltip } from "@/components/info-tooltip";
import { MonthPickerField } from "@/components/month-picker-field";
import { PieChart } from "@/components/pie-chart";
import {
  getAnalyticsData,
  parseOverviewMonth,
  type MonthlyCurrencyFlow,
  type SearchParamMap,
} from "@/lib/data";
import { formatMoney, getMonthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AnalyticsPageProps = {
  searchParams: Promise<SearchParamMap>;
};

function getBalanceStatus(flow: MonthlyCurrencyFlow) {
  if (flow.balanceChange > 0) {
    return {
      label: "Баланс вырос",
      className: "border-emerald-500/35 bg-emerald-400/12 text-emerald-100",
      description:
        "Остаток на конец месяца выше начального. После всех доходов, расходов, переводов и обменов эта валюта увеличилась.",
    };
  }

  if (flow.balanceChange < 0) {
    return {
      label: "Баланс снизился",
      className: "border-amber-500/35 bg-amber-300/12 text-amber-100",
      description:
        "Остаток на конец месяца ниже начального. Это означает, что часть расходов или исходящих движений была покрыта средствами прошлых периодов.",
    };
  }

  return {
    label: "Без изменений",
    className: "border-black/8 bg-stone-100 text-stone-700",
    description: "Остаток на начало и конец месяца совпадает.",
  };
}

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
    default: "text-stone-950",
    income: "text-emerald-100",
    expense: "text-rose-100",
    movement: "text-amber-100",
  }[tone];

  return (
    <div className="rounded-xl border border-black/6 bg-stone-50 p-3">
      <div className="text-xs uppercase tracking-[0.08em] text-stone-500">{label}</div>
      <div className={`mt-1 font-semibold ${toneClassName}`}>{value}</div>
    </div>
  );
}

function FormulaTooltip({ flow }: { flow: MonthlyCurrencyFlow }) {
  return (
    <InfoTooltip label={`Формула ${flow.currency}`}>
      Осталось = было + прямые доходы + входящие переводы/обмены − расходы −
      исходящие переводы/обмены. Разница за месяц = осталось − было.
    </InfoTooltip>
  );
}

function FlowCard({ flow }: { flow: MonthlyCurrencyFlow }) {
  const status = getBalanceStatus(flow);

  return (
    <article className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="rounded-full border border-black/8 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-stone-900">
            {flow.currency}
          </span>
          <h2 className="mt-4 text-xl font-semibold text-stone-950">
            {formatMoney(flow.closingBalance, flow.currency)}
          </h2>
          <p className="mt-1 text-sm text-stone-500">Остаток на конец месяца</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
            {status.label}
          </span>
          <FormulaTooltip flow={flow} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <FlowMetric label="Было" value={formatMoney(flow.openingBalance, flow.currency)} />
        <FlowMetric
          label="Разница за месяц"
          value={`${flow.balanceChange > 0 ? "+" : ""}${formatMoney(flow.balanceChange, flow.currency)}`}
          tone={flow.balanceChange >= 0 ? "income" : "movement"}
        />
        {flow.movementInTotal > 0 ? (
          <FlowMetric
            label="Пришло переводом/обменом"
            value={formatMoney(flow.movementInTotal, flow.currency)}
            tone="income"
          />
        ) : null}
        {flow.incomeTotal > 0 ? (
          <FlowMetric label="Прямой доход" value={formatMoney(flow.incomeTotal, flow.currency)} tone="income" />
        ) : null}
        {flow.movementOutTotal > 0 ? (
          <FlowMetric
            label="Ушло переводом/обменом"
            value={formatMoney(flow.movementOutTotal, flow.currency)}
            tone="movement"
          />
        ) : null}
        {flow.expenseTotal > 0 ? (
          <FlowMetric label="Расходы" value={formatMoney(flow.expenseTotal, flow.currency)} tone="expense" />
        ) : null}
      </div>

      <div className="mt-4 rounded-xl border border-black/6 bg-white p-3 text-sm leading-6 text-stone-600">
        {status.description}
      </div>
    </article>
  );
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const month = parseOverviewMonth(await searchParams);
  const analytics = await getAnalyticsData(month);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-black/6 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-cyan-200/70">Аналитика</p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950 sm:text-4xl">
              Движение средств за {getMonthLabel(month)}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 sm:text-base">
              Месяц считается через начальный остаток, доходы, расходы,
              переводы/обмены и конечный остаток. Так видно, вырос баланс или
              были сверх траты за счет прошлых остатков.
            </p>
          </div>

          <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="space-y-2 text-sm text-stone-600">
              <span className="block text-xs uppercase tracking-[0.08em] text-stone-500">Месяц</span>
              <MonthPickerField
                key={month}
                name="month"
                defaultValue={month}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-black/8 bg-white px-3 py-2.5 text-left text-sm font-medium text-stone-950 shadow-sm transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20 sm:w-56"
              />
            </label>
            <button
              type="submit"
              className="rounded-full border border-black/8 bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
            >
              Показать
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {analytics.flows.map((flow) => (
          <FlowCard key={flow.currency} flow={flow} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-cyan-200/70">Категории</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">Расходы за месяц</h2>
          </div>
          <div className="grid min-w-0 gap-4">
            {analytics.charts.length > 0 ? (
              analytics.charts.map((chart) => (
                <PieChart
                  key={chart.currency}
                  title={chart.title}
                  currency={chart.currency}
                  total={chart.total}
                  slices={chart.slices}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-black/8 bg-white px-5 py-10 text-sm text-stone-500">
                За выбранный месяц расходов нет.
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.08em] text-cyan-200/70">Как читать</p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-950">Логика месяца</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
            <p>Начальный остаток — все операции до первого дня месяца.</p>
            <p>Конечный остаток — начальный остаток плюс все движения внутри месяца.</p>
            <p>Если баланс снизился, месяц частично оплачен остатками прошлых периодов или исходящими обменами.</p>
            <p>Если баланс вырос, разница считается потенциальным накоплением в этой валюте.</p>
          </div>
          <Link
            href={`/operations?month=${month}`}
            className="mt-5 inline-flex rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            Открыть операции
          </Link>
        </aside>
      </section>
    </div>
  );
}
