import { TransactionType } from "@prisma/client";

import { MonthPickerField } from "@/components/month-picker-field";
import type { AccountOverview, CategoryOverview, DashboardFilters } from "@/lib/data";
import { TRANSACTION_TYPE_LABELS } from "@/lib/constants";

type DashboardFiltersProps = {
  filters: DashboardFilters;
  accounts: AccountOverview[];
  categories: CategoryOverview[];
};

export function DashboardFilters({ filters, accounts, categories }: DashboardFiltersProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/30">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Фильтры</h2>
          <p className="text-sm text-slate-400">Месяц, счета, категории и тип операции.</p>
        </div>
        <a
          href={`/?month=${filters.month}`}
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          Сбросить
        </a>
      </div>

      <form className="space-y-5" method="get">
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Месяц</span>
            <MonthPickerField
              key={filters.month}
              name="month"
              defaultValue={filters.month}
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Тип операции</span>
            <select
              name="type"
              defaultValue={filters.type ?? ""}
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400"
            >
              <option value="">Все типы</option>
              {Object.values(TransactionType).map((type) => (
                <option key={type} value={type}>
                  {TRANSACTION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <fieldset className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
            <legend className="px-2 text-sm font-medium text-slate-200">Счета</legend>
            <div className="mt-3 grid gap-2">
              {accounts.map((account) => (
                <label key={account.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/4 px-3 py-2 text-sm text-slate-300">
                  <span>
                    {account.name}
                    {account.isArchived ? <span className="ml-2 text-xs text-amber-300">Архив</span> : null}
                  </span>
                  <input
                    type="checkbox"
                    name="accountId"
                    value={account.id}
                    defaultChecked={filters.accountIds.includes(account.id)}
                    className="h-4 w-4 accent-blue-500"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
            <legend className="px-2 text-sm font-medium text-slate-200">Категории</legend>
            <div className="mt-3 grid gap-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/4 px-3 py-2 text-sm text-slate-300">
                  <span>
                    {category.name}
                    {category.isDeleted ? <span className="ml-2 text-xs text-amber-300">Удалена</span> : null}
                  </span>
                  <input
                    type="checkbox"
                    name="categoryId"
                    value={category.id}
                    defaultChecked={filters.categoryIds.includes(category.id)}
                    className="h-4 w-4 accent-blue-500"
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
        >
          Применить фильтры
        </button>
      </form>
    </section>
  );
}
