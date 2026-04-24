import Link from "next/link";
import { TransactionType } from "@prisma/client";

import { TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import type {
  AccountOverview,
  CategoryOverview,
  DashboardFilters,
} from "@/lib/data";

type OperationFiltersProps = {
  filters: DashboardFilters;
  accounts: AccountOverview[];
  categories: CategoryOverview[];
};

function getSelectedSummary(
  selectedIds: string[],
  items: Array<{ id: string; name: string }>,
  emptyLabel: string,
) {
  if (selectedIds.length === 0) {
    return emptyLabel;
  }

  if (selectedIds.length === 1) {
    return items.find((item) => item.id === selectedIds[0])?.name ?? emptyLabel;
  }

  return `${selectedIds.length} выбрано`;
}

export function OperationFilters({
  filters,
  accounts,
  categories,
}: OperationFiltersProps) {
  return (
    <section className="sticky top-[90px] z-20 rounded-[28px] border border-white/10 bg-slate-950/82 p-4 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
            Фильтры
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Месяц, тип операции, счета и категории.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/operations?month=${filters.month}`}
            className="rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
          >
            Сбросить
          </Link>
          <Link
            href="/operations/new"
            className="rounded-full border border-cyan-400/40 bg-cyan-400/12 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-300/70 hover:bg-cyan-400/18"
          >
            Новая операция
          </Link>
        </div>
      </div>

      <form
        method="get"
        className="grid gap-3 lg:grid-cols-[180px_180px_1fr_1fr_auto] lg:items-start"
      >
        <label className="space-y-2 text-sm text-slate-300">
          <span className="block text-xs uppercase tracking-[0.22em] text-slate-500">
            Месяц
          </span>
          <input
            type="month"
            name="month"
            defaultValue={filters.month}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm font-medium text-white outline-none transition focus:border-cyan-300 focus:bg-white/8"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="block text-xs uppercase tracking-[0.22em] text-slate-500">
            Тип операции
          </span>
          <select
            name="type"
            defaultValue={filters.type ?? ""}
            className="w-full rounded-2xl border border-white/12 bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-50 outline-none transition focus:border-cyan-300 focus:bg-slate-800"
          >
            <option value="">Все типы</option>
            {Object.values(TransactionType).map((type) => (
              <option key={type} value={type}>
                {TRANSACTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        <details className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
          <summary className="cursor-pointer list-none">
            <span className="block text-xs uppercase tracking-[0.22em] text-slate-500">
              Счета
            </span>
            <span className="mt-2 block text-sm font-medium text-white">
              {getSelectedSummary(filters.accountIds, accounts, "Все счета")}
            </span>
          </summary>
          <div className="mt-3 grid gap-2">
            {accounts.map((account) => (
              <label
                key={account.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {account.name}
                  {account.isArchived ? (
                    <span className="ml-2 text-xs text-amber-300">Архив</span>
                  ) : null}
                </span>
                <input
                  type="checkbox"
                  name="accountId"
                  value={account.id}
                  defaultChecked={filters.accountIds.includes(account.id)}
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>
            ))}
          </div>
        </details>

        <details className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
          <summary className="cursor-pointer list-none">
            <span className="block text-xs uppercase tracking-[0.22em] text-slate-500">
              Категории
            </span>
            <span className="mt-2 block text-sm font-medium text-white">
              {getSelectedSummary(filters.categoryIds, categories, "Все категории")}
            </span>
          </summary>
          <div className="mt-3 grid gap-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {category.name}
                  {category.isDeleted ? (
                    <span className="ml-2 text-xs text-amber-300">Удалена</span>
                  ) : null}
                </span>
                <input
                  type="checkbox"
                  name="categoryId"
                  value={category.id}
                  defaultChecked={filters.categoryIds.includes(category.id)}
                  className="h-4 w-4 accent-cyan-400"
                />
              </label>
            ))}
          </div>
        </details>

        <div className="lg:self-end">
          <button
            type="submit"
            className="w-full rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-50 lg:w-auto"
          >
            Применить
          </button>
        </div>
      </form>
    </section>
  );
}
