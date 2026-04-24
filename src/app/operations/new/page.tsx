import Link from "next/link";
import { TransactionType, type Account, type Category } from "@prisma/client";

import {
  createExchange,
  createExpense,
  createIncome,
  createTransfer,
} from "@/app/actions";
import {
  ExchangeForm,
  ExpenseForm,
  IncomeForm,
  TransferForm,
} from "@/components/transaction-forms";
import { TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import {
  getAccountsOverview,
  getCategoriesOverview,
  type AccountOverview,
  type CategoryOverview,
  type SearchParamMap,
} from "@/lib/data";
import { getCurrentMonthValue } from "@/lib/utils";

export const dynamic = "force-dynamic";

type NewOperationPageProps = {
  searchParams: Promise<SearchParamMap>;
};

type OperationMeta = {
  title: string;
  description: string;
  hints: string[];
};

const operationMeta: Record<TransactionType, OperationMeta> = {
  [TransactionType.EXPENSE]: {
    title: "Расход",
    description: "Списание средств с выбранного счета по категории расхода.",
    hints: [
      "Используется для покупок, оплаты услуг и любых повседневных расходов.",
      "Категория сохраняется в операции, поэтому история остается корректной даже после изменений в справочнике.",
      "Для расхода указывается один счет списания.",
    ],
  },
  [TransactionType.INCOME]: {
    title: "Доход",
    description: "Поступление средств на выбранный счет.",
    hints: [
      "Подходит для зарплаты, пополнений, возвратов и прочих поступлений.",
      "Для дохода категория не требуется.",
      "При наличии счет по умолчанию подставляется автоматически.",
    ],
  },
  [TransactionType.TRANSFER]: {
    title: "Перевод",
    description: "Перемещение средств между своими счетами в одной валюте.",
    hints: [
      "Перевод не влияет на аналитику расходов и доходов.",
      "Оба счета должны быть в одной валюте.",
      "Используется для перемещений между картой, наличными и другими своими счетами.",
    ],
  },
  [TransactionType.EXCHANGE]: {
    title: "Обмен",
    description: "Обмен средств между своими счетами в разных валютах.",
    hints: [
      "Подходит для обмена валют, P2P и подобных операций.",
      "Обе стороны обмена сохраняются в одной операции.",
      "Суммы списания и зачисления указываются отдельно.",
    ],
  },
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

function parseOperationType(searchParams: SearchParamMap): TransactionType {
  const rawType = typeof searchParams.type === "string" ? searchParams.type : undefined;

  if (
    rawType &&
    Object.values(TransactionType).includes(rawType as TransactionType)
  ) {
    return rawType as TransactionType;
  }

  return TransactionType.EXPENSE;
}

function getDefaultIncomeAccountId(accounts: AccountOverview[]) {
  return (
    accounts.find((account) => account.name === "Binance USDT" && !account.isArchived)
      ?.id ?? accounts.find((account) => !account.isArchived)?.id
  );
}

export default async function NewOperationPage({
  searchParams,
}: NewOperationPageProps) {
  const resolvedSearchParams = await searchParams;
  const activeType = parseOperationType(resolvedSearchParams);
  const [accounts, categories] = await Promise.all([
    getAccountsOverview(),
    getCategoriesOverview(),
  ]);
  const rawAccounts = toRawAccounts(accounts);
  const rawCategories = toRawCategories(categories);
  const returnTo = `/operations?month=${getCurrentMonthValue()}`;
  const hiddenFields = [{ name: "redirectTo", value: returnTo }];
  const meta = operationMeta[activeType];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/25 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href={returnTo}
              className="inline-flex text-sm text-cyan-100 transition hover:text-white"
            >
              ← К журналу операций
            </Link>
            <p className="mt-4 text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">
              Новая операция
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Создание операции
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Выберите тип операции и заполните форму.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {Object.values(TransactionType).map((type) => {
            const isActive = type === activeType;

            return (
              <Link
                key={type}
                href={`/operations/new?type=${type}`}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-cyan-300/70 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30"
                    : "border-white/14 bg-white/6 text-slate-100 hover:border-white/25 hover:bg-white/10 hover:text-white"
                }`}
              >
                {TRANSACTION_TYPE_LABELS[type]}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {activeType === TransactionType.EXPENSE ? (
            <ExpenseForm
              accounts={rawAccounts}
              categories={rawCategories}
              action={createExpense}
              title={meta.title}
              submitLabel="Сохранить расход"
              pendingLabel="Сохранение..."
              hiddenFields={hiddenFields}
            />
          ) : null}

          {activeType === TransactionType.INCOME ? (
            <IncomeForm
              accounts={rawAccounts}
              action={createIncome}
              title={meta.title}
              submitLabel="Сохранить доход"
              pendingLabel="Сохранение..."
              hiddenFields={hiddenFields}
              defaultAccountId={getDefaultIncomeAccountId(accounts)}
            />
          ) : null}

          {activeType === TransactionType.TRANSFER ? (
            <TransferForm
              accounts={rawAccounts}
              action={createTransfer}
              title={meta.title}
              submitLabel="Сохранить перевод"
              pendingLabel="Сохранение..."
              hiddenFields={hiddenFields}
            />
          ) : null}

          {activeType === TransactionType.EXCHANGE ? (
            <ExchangeForm
              accounts={rawAccounts}
              action={createExchange}
              title={meta.title}
              submitLabel="Сохранить обмен"
              pendingLabel="Сохранение..."
              hiddenFields={hiddenFields}
            />
          ) : null}
        </div>

        <aside className="rounded-[32px] border border-white/10 bg-slate-900/62 p-6 shadow-2xl shadow-slate-950/20">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
            Подсказки
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{meta.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{meta.description}</p>

          <div className="mt-5 space-y-3">
            {meta.hints.map((hint) => (
              <div
                key={hint}
                className="rounded-3xl border border-white/8 bg-slate-950/45 px-4 py-3 text-sm leading-6 text-slate-300"
              >
                {hint}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
