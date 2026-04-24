import Link from "next/link";
import { type Account, type Category } from "@prisma/client";

import { OperationFilters } from "@/components/operation-filters";
import { TransactionEditorSheet } from "@/components/transaction-editor-sheet";
import { TransactionList } from "@/components/transaction-list";
import {
  getOperationsData,
  parseDashboardFilters,
  type AccountOverview,
  type CategoryOverview,
  type SearchParamMap,
} from "@/lib/data";
import { formatCount } from "@/lib/utils";

export const dynamic = "force-dynamic";

type OperationsPageProps = {
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

function buildOperationsHref(
  filters: {
    month: string;
    type?: string;
    accountIds: string[];
    categoryIds: string[];
  },
  editId?: string,
) {
  const params = new URLSearchParams();
  params.set("month", filters.month);

  if (filters.type) {
    params.set("type", filters.type);
  }

  for (const accountId of filters.accountIds) {
    params.append("accountId", accountId);
  }

  for (const categoryId of filters.categoryIds) {
    params.append("categoryId", categoryId);
  }

  if (editId) {
    params.set("edit", editId);
  }

  return `/operations?${params.toString()}`;
}

export default async function OperationsPage({
  searchParams,
}: OperationsPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseDashboardFilters(resolvedSearchParams);
  const operationsData = await getOperationsData(filters);
  const editId =
    typeof resolvedSearchParams.edit === "string"
      ? resolvedSearchParams.edit
      : undefined;
  const selectedTransaction = editId
    ? operationsData.transactions.find((transaction) => transaction.id === editId)
    : undefined;
  const rawAccounts = toRawAccounts(operationsData.accounts);
  const rawCategories = toRawCategories(operationsData.categories);
  const baseHref = buildOperationsHref({
    month: filters.month,
    type: filters.type,
    accountIds: filters.accountIds,
    categoryIds: filters.categoryIds,
  });

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/25 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">
                Операции
              </p>
              <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                Журнал операций
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Просмотр, фильтрация и редактирование операций за выбранный период.
              </p>
            </div>

            <Link
              href="/operations/new"
              className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:border-cyan-300/60 hover:bg-cyan-400/15"
            >
              Добавить операцию
            </Link>
          </div>
        </section>

        <OperationFilters
          filters={operationsData.filters}
          accounts={operationsData.accounts}
          categories={operationsData.categories}
        />

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
                Результаты
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Найдено{" "}
                {formatCount(
                  operationsData.transactions.length,
                  "запись",
                  "записи",
                  "записей",
                )}
              </h2>
            </div>
          </div>

          <TransactionList
            transactions={operationsData.transactions}
            activeTransactionId={selectedTransaction?.id}
            buildEditHref={(transactionId) =>
              buildOperationsHref(
                {
                  month: filters.month,
                  type: filters.type,
                  accountIds: filters.accountIds,
                  categoryIds: filters.categoryIds,
                },
                transactionId,
              )
            }
            emptyTitle="Операции не найдены"
            emptyDescription="По выбранным параметрам записи отсутствуют. Измените фильтры или добавьте новую операцию."
            emptyCtaHref="/operations/new"
            emptyCtaLabel="Добавить операцию"
          />
        </section>
      </div>

      {selectedTransaction ? (
        <TransactionEditorSheet
          transaction={selectedTransaction}
          accounts={rawAccounts}
          categories={rawCategories}
          closeHref={baseHref}
        />
      ) : null}
    </>
  );
}
