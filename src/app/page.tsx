import { type Account, type Category } from "@prisma/client";

import {
  createExchange,
  createExpense,
  createIncome,
  createTransfer,
} from "@/app/actions";
import { DashboardFilters as DashboardFiltersForm } from "@/components/dashboard-filters";
import { PieChart } from "@/components/pie-chart";
import {
  ExchangeForm,
  ExpenseForm,
  IncomeForm,
  TransferForm,
} from "@/components/transaction-forms";
import { TransactionList } from "@/components/transaction-list";
import { getDashboardData, parseDashboardFilters, type SearchParamMap, type AccountOverview, type CategoryOverview } from "@/lib/data";
import { getMonthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<SearchParamMap>;
};

function toRawAccounts(accounts: AccountOverview[]): Account[] {
  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    kind: account.kind,
    currency: account.currency,
    isArchived: account.isArchived,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }));
}

function toRawCategories(categories: CategoryOverview[]): Category[] {
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    isDeleted: category.isDeleted,
    deletedAt: category.deletedAt,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  }));
}

export default async function Home({ searchParams }: HomePageProps) {
  const filters = parseDashboardFilters(await searchParams);
  const dashboard = await getDashboardData(filters);
  const rawAccounts = toRawAccounts(dashboard.accounts);
  const rawCategories = toRawCategories(dashboard.categories);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-slate-950/30">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Обзор</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">{getMonthLabel(dashboard.filters.month)}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Здесь живут расходы, доходы, переводы и обмены. P2P вывод из Binance в гривну — это обмен, а не трата. Переводы между твоими счетами в одной валюте тоже не попадают в расходную аналитику.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Счета</div>
            <div className="mt-2 text-2xl font-semibold text-white">{dashboard.accounts.length}</div>
            <div className="mt-1 text-sm text-slate-400">Активных: {dashboard.accounts.filter((account) => !account.isArchived).length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Категории</div>
            <div className="mt-2 text-2xl font-semibold text-white">{dashboard.categories.length}</div>
            <div className="mt-1 text-sm text-slate-400">Удаленных: {dashboard.categories.filter((category) => category.isDeleted).length}</div>
          </div>
        </div>
      </section>

      <DashboardFiltersForm filters={dashboard.filters} accounts={dashboard.accounts} categories={dashboard.categories} />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Новые операции</h2>
          <p className="text-sm text-slate-400">Четыре разные формы, чтобы не мешать расход, доход, перевод и обмен.</p>
        </div>
        <div className="grid gap-4 2xl:grid-cols-2">
          <ExpenseForm
            accounts={rawAccounts}
            categories={rawCategories}
            action={createExpense}
            title="Расход"
            submitLabel="Добавить расход"
            pendingLabel="Добавляю..."
          />
          <IncomeForm
            accounts={rawAccounts}
            action={createIncome}
            title="Доход"
            submitLabel="Добавить доход"
            pendingLabel="Добавляю..."
            defaultAccountId={dashboard.defaultIncomeAccountId}
          />
          <TransferForm
            accounts={rawAccounts}
            action={createTransfer}
            title="Перевод"
            submitLabel="Добавить перевод"
            pendingLabel="Добавляю..."
          />
          <ExchangeForm
            accounts={rawAccounts}
            action={createExchange}
            title="Обмен"
            submitLabel="Добавить обмен"
            pendingLabel="Добавляю..."
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Диаграммы расходов</h2>
          <p className="text-sm text-slate-400">Каждая валюта отображается отдельно, без смешивания UAH, USD и USDT.</p>
        </div>
        <div className="grid gap-4 2xl:grid-cols-3">
          {dashboard.charts.length > 0 ? (
            dashboard.charts.map((chart) => (
              <PieChart
                key={chart.currency}
                title={chart.title}
                currency={chart.currency}
                total={chart.total}
                slices={chart.slices}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/70 px-4 py-10 text-sm text-slate-400 2xl:col-span-3">
              Пока нечего рисовать: в выбранном периоде нет расходных операций.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Список операций</h2>
          <p className="text-sm text-slate-400">Любую запись можно открыть, отредактировать или удалить.</p>
        </div>
        <TransactionList transactions={dashboard.transactions} accounts={rawAccounts} categories={rawCategories} />
      </section>
    </div>
  );
}
