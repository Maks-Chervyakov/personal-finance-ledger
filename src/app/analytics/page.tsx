import Link from "next/link";

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

const TEXT = {
  analytics: "\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430",
  titlePrefix: "\u0414\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u0441\u0440\u0435\u0434\u0441\u0442\u0432 \u0437\u0430",
  intro:
    "\u041c\u0435\u0441\u044f\u0446 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044f \u0447\u0435\u0440\u0435\u0437 \u043d\u0430\u0447\u0430\u043b\u044c\u043d\u044b\u0439 \u043e\u0441\u0442\u0430\u0442\u043e\u043a, \u0434\u043e\u0445\u043e\u0434\u044b, \u0440\u0430\u0441\u0445\u043e\u0434\u044b, \u043f\u0435\u0440\u0435\u0432\u043e\u0434\u044b/\u043e\u0431\u043c\u0435\u043d\u044b \u0438 \u043a\u043e\u043d\u0435\u0447\u043d\u044b\u0439 \u043e\u0441\u0442\u0430\u0442\u043e\u043a. \u0422\u0430\u043a \u0432\u0438\u0434\u043d\u043e, \u0442\u0440\u0430\u0442\u0438\u043b\u0438\u0441\u044c \u043b\u0438 \u0434\u0435\u043d\u044c\u0433\u0438 \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e \u043c\u0435\u0441\u044f\u0446\u0430 \u0438\u043b\u0438 \u043e\u0441\u0442\u0430\u0442\u043a\u0438 \u043f\u0440\u043e\u0448\u043b\u044b\u0445 \u043f\u0435\u0440\u0438\u043e\u0434\u043e\u0432.",
  month: "\u041c\u0435\u0441\u044f\u0446",
  show: "\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c",
  endBalance: "\u041e\u0441\u0442\u0430\u0442\u043e\u043a \u043d\u0430 \u043a\u043e\u043d\u0435\u0446 \u043c\u0435\u0441\u044f\u0446\u0430",
  overspend: "\u0421\u0432\u0435\u0440\u0445 \u0442\u0440\u0430\u0442\u044b",
  saved: "\u0423\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043b\u043e\u0436\u0438\u0442\u044c",
  balanced: "\u0412 \u043d\u043e\u043b\u044c",
  overspendDescription:
    "\u0420\u0430\u0441\u0445\u043e\u0434\u044b \u0432\u044b\u0448\u0435 \u043f\u0440\u044f\u043c\u044b\u0445 \u0434\u043e\u0445\u043e\u0434\u043e\u0432. \u0420\u0430\u0437\u043d\u0438\u0446\u0430 \u043f\u043e\u043a\u0440\u044b\u0442\u0430 \u043e\u0441\u0442\u0430\u0442\u043a\u043e\u043c \u043f\u0440\u043e\u0448\u043b\u044b\u0445 \u043c\u0435\u0441\u044f\u0446\u0435\u0432 \u0438\u043b\u0438 \u043f\u0435\u0440\u0435\u0432\u043e\u0434\u0430\u043c\u0438/\u043e\u0431\u043c\u0435\u043d\u0430\u043c\u0438.",
  savedDescription:
    "\u041f\u0440\u044f\u043c\u044b\u0435 \u0434\u043e\u0445\u043e\u0434\u044b \u0432\u044b\u0448\u0435 \u0440\u0430\u0441\u0445\u043e\u0434\u043e\u0432. \u042d\u0442\u043e \u043f\u043e\u0442\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u0430\u044f \u0441\u0443\u043c\u043c\u0430 \u043d\u0430\u043a\u043e\u043f\u043b\u0435\u043d\u0438\u044f \u0432 \u044d\u0442\u043e\u0439 \u0432\u0430\u043b\u044e\u0442\u0435.",
  balancedDescription: "\u041f\u0440\u044f\u043c\u044b\u0435 \u0434\u043e\u0445\u043e\u0434\u044b \u0438 \u0440\u0430\u0441\u0445\u043e\u0434\u044b \u0437\u0430 \u043c\u0435\u0441\u044f\u0446 \u0441\u0431\u0430\u043b\u0430\u043d\u0441\u0438\u0440\u043e\u0432\u0430\u043d\u044b.",
  opening: "\u0411\u044b\u043b\u043e",
  change: "\u0418\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0435",
  income: "\u0414\u043e\u0445\u043e\u0434\u044b",
  expenses: "\u0420\u0430\u0441\u0445\u043e\u0434\u044b",
  movement: "\u0414\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u043c\u0435\u0436\u0434\u0443 \u0441\u0447\u0435\u0442\u0430\u043c\u0438",
  came: "\u043f\u0440\u0438\u0448\u043b\u043e",
  left: "\u0443\u0448\u043b\u043e",
  categories: "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438",
  monthExpenses: "\u0420\u0430\u0441\u0445\u043e\u0434\u044b \u0437\u0430 \u043c\u0435\u0441\u044f\u0446",
  noExpenses: "\u0417\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u043c\u0435\u0441\u044f\u0446 \u0440\u0430\u0441\u0445\u043e\u0434\u043e\u0432 \u043d\u0435\u0442.",
  howToRead: "\u041a\u0430\u043a \u0447\u0438\u0442\u0430\u0442\u044c",
  monthLogic: "\u041b\u043e\u0433\u0438\u043a\u0430 \u043c\u0435\u0441\u044f\u0446\u0430",
  rule1: "\u041d\u0430\u0447\u0430\u043b\u044c\u043d\u044b\u0439 \u043e\u0441\u0442\u0430\u0442\u043e\u043a ? \u0432\u0441\u0435 \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0438 \u0434\u043e \u043f\u0435\u0440\u0432\u043e\u0433\u043e \u0434\u043d\u044f \u043c\u0435\u0441\u044f\u0446\u0430.",
  rule2: "\u041a\u043e\u043d\u0435\u0447\u043d\u044b\u0439 \u043e\u0441\u0442\u0430\u0442\u043e\u043a ? \u043d\u0430\u0447\u0430\u043b\u044c\u043d\u044b\u0439 \u043e\u0441\u0442\u0430\u0442\u043e\u043a \u043f\u043b\u044e\u0441 \u0432\u0441\u0435 \u0434\u0432\u0438\u0436\u0435\u043d\u0438\u044f \u0432\u043d\u0443\u0442\u0440\u0438 \u043c\u0435\u0441\u044f\u0446\u0430.",
  rule3: "\u0415\u0441\u043b\u0438 \u0440\u0430\u0441\u0445\u043e\u0434\u044b \u0431\u043e\u043b\u044c\u0448\u0435 \u0434\u043e\u0445\u043e\u0434\u043e\u0432, \u043c\u0435\u0441\u044f\u0446 \u0447\u0430\u0441\u0442\u0438\u0447\u043d\u043e \u043e\u043f\u043b\u0430\u0447\u0435\u043d \u043e\u0441\u0442\u0430\u0442\u043a\u0430\u043c\u0438 \u043f\u0440\u043e\u0448\u043b\u044b\u0445 \u043f\u0435\u0440\u0438\u043e\u0434\u043e\u0432 \u0438\u043b\u0438 \u043e\u0431\u043c\u0435\u043d\u0430\u043c\u0438.",
  rule4: "\u0415\u0441\u043b\u0438 \u0434\u043e\u0445\u043e\u0434\u044b \u0431\u043e\u043b\u044c\u0448\u0435 \u0440\u0430\u0441\u0445\u043e\u0434\u043e\u0432, \u0440\u0430\u0437\u043d\u0438\u0446\u0430 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044f \u043f\u043e\u0442\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u043c \u043d\u0430\u043a\u043e\u043f\u043b\u0435\u043d\u0438\u0435\u043c.",
  openOperations: "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0438",
};

function getFlowStatus(flow: MonthlyCurrencyFlow) {
  if (flow.incomeExpenseDelta < 0) {
    return {
      label: TEXT.overspend,
      className: "border-amber-500/35 bg-amber-300/12 text-amber-100",
      description: TEXT.overspendDescription,
    };
  }

  if (flow.incomeExpenseDelta > 0) {
    return {
      label: TEXT.saved,
      className: "border-emerald-500/35 bg-emerald-400/12 text-emerald-100",
      description: TEXT.savedDescription,
    };
  }

  return {
    label: TEXT.balanced,
    className: "border-black/8 bg-stone-100 text-stone-700",
    description: TEXT.balancedDescription,
  };
}

function FlowCard({ flow }: { flow: MonthlyCurrencyFlow }) {
  const status = getFlowStatus(flow);

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
          <p className="mt-1 text-sm text-stone-500">{TEXT.endBalance}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-black/6 bg-stone-50 p-3">
          <div className="text-xs uppercase tracking-[0.08em] text-stone-500">{TEXT.opening}</div>
          <div className="mt-1 font-semibold text-stone-950">
            {formatMoney(flow.openingBalance, flow.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-black/6 bg-stone-50 p-3">
          <div className="text-xs uppercase tracking-[0.08em] text-stone-500">{TEXT.change}</div>
          <div className={`mt-1 font-semibold ${flow.balanceChange >= 0 ? "text-emerald-100" : "text-amber-100"}`}>
            {formatMoney(flow.balanceChange, flow.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-400/12 p-3">
          <div className="text-xs uppercase tracking-[0.08em] text-stone-500">{TEXT.income}</div>
          <div className="mt-1 font-semibold text-emerald-100">
            {formatMoney(flow.incomeTotal, flow.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-3">
          <div className="text-xs uppercase tracking-[0.08em] text-stone-500">{TEXT.expenses}</div>
          <div className="mt-1 font-semibold text-rose-100">
            {formatMoney(flow.expenseTotal, flow.currency)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-black/6 bg-white p-3 text-sm leading-6 text-stone-600">
        {status.description}
        {(flow.movementInTotal > 0 || flow.movementOutTotal > 0) ? (
          <span>
            {" "}{TEXT.movement}: {TEXT.came} {formatMoney(flow.movementInTotal, flow.currency)}, {TEXT.left}{" "}
            {formatMoney(flow.movementOutTotal, flow.currency)}.
          </span>
        ) : null}
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
            <p className="text-xs uppercase tracking-[0.08em] text-cyan-200/70">{TEXT.analytics}</p>
            <h1 className="mt-3 text-3xl font-semibold text-stone-950 sm:text-4xl">
              {TEXT.titlePrefix} {getMonthLabel(month)}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 sm:text-base">
              {TEXT.intro}
            </p>
          </div>

          <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="space-y-2 text-sm text-stone-600">
              <span className="block text-xs uppercase tracking-[0.08em] text-stone-500">{TEXT.month}</span>
              <input
                type="month"
                name="month"
                defaultValue={month}
                className="w-full rounded-2xl border border-black/8 bg-white px-3 py-2.5 text-sm text-stone-950 outline-none transition focus:border-cyan-300 sm:w-56"
              />
            </label>
            <button
              type="submit"
              className="rounded-full border border-black/8 bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
            >
              {TEXT.show}
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
            <p className="text-xs uppercase tracking-[0.08em] text-cyan-200/70">{TEXT.categories}</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">{TEXT.monthExpenses}</h2>
          </div>
          <div className="grid gap-4 2xl:grid-cols-2">
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
                {TEXT.noExpenses}
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.08em] text-cyan-200/70">{TEXT.howToRead}</p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-950">{TEXT.monthLogic}</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
            <p>{TEXT.rule1}</p>
            <p>{TEXT.rule2}</p>
            <p>{TEXT.rule3}</p>
            <p>{TEXT.rule4}</p>
          </div>
          <Link
            href={`/operations?month=${month}`}
            className="mt-5 inline-flex rounded-full border border-black/8 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            {TEXT.openOperations}
          </Link>
        </aside>
      </section>
    </div>
  );
}
