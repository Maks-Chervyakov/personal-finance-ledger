import { AccountKind, Currency } from "@prisma/client";

import {
  archiveAccount,
  createAccount,
  restoreAccount,
  updateAccount,
} from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { ACCOUNT_KIND_LABELS, CURRENCY_LABELS } from "@/lib/constants";
import { getAccountsOverview } from "@/lib/data";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300";
const gridErrorClassName =
  "rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100 md:col-span-2";

export default async function ManageAccountsPage() {
  const accounts = await getAccountsOverview();
  const activeAccounts = accounts.filter((account) => !account.isArchived);
  const archivedAccounts = accounts.filter((account) => account.isArchived);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border border-white/10 bg-slate-900/62 p-5 shadow-2xl shadow-slate-950/20 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
            Сводка по счетам
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/8 bg-slate-950/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Всего
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {accounts.length}
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Активные
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {activeAccounts.length}
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Архив
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {archivedAccounts.length}
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-slate-900/72 p-5 shadow-2xl shadow-slate-950/25 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">Новый счет</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Карта, наличка, Binance, Bybit и остальные точки хранения денег.
            </p>
          </div>

          <ActionForm action={createAccount} className="grid gap-4 md:grid-cols-2" errorClassName={gridErrorClassName}>
            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                Название
              </span>
              <input
                type="text"
                name="name"
                className={inputClassName}
                placeholder="Например: Monobank UAH"
                required
                maxLength={80}
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                Тип
              </span>
              <select
                name="kind"
                className={inputClassName}
                defaultValue={AccountKind.CARD}
              >
                {Object.values(AccountKind).map((kind) => (
                  <option key={kind} value={kind}>
                    {ACCOUNT_KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                Валюта
              </span>
              <select
                name="currency"
                className={inputClassName}
                defaultValue={Currency.UAH}
              >
                {Object.values(Currency).map((currency) => (
                  <option key={currency} value={currency}>
                    {CURRENCY_LABELS[currency]}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2">
              <SubmitButton label="Добавить счет" pendingLabel="Добавляю..." />
            </div>
          </ActionForm>
        </section>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Активные счета</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Валюту счета с историей менять нельзя, иначе баланс теряет смысл.
          </p>
        </div>

        <div className="space-y-4">
          {activeAccounts.map((account) => (
            <article
              key={account.id}
              className="rounded-[30px] border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
                      {ACCOUNT_KIND_LABELS[account.kind]}
                    </span>
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                      {CURRENCY_LABELS[account.currency]}
                    </span>
                    {account.currencyLocked ? (
                      <span className="rounded-full bg-amber-500/14 px-3 py-1 text-xs font-medium text-amber-200">
                        Валюта заблокирована историей
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-white">{account.name}</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      Баланс: {formatMoney(account.balance, account.currency)}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Операций: {account.transactionCount}
                    </p>
                  </div>
                </div>

                <ActionForm action={archiveAccount}>
                  <input type="hidden" name="accountId" value={account.id} />
                  <SubmitButton
                    label="Архивировать"
                    pendingLabel="Архивирую..."
                    ariaLabel={`Архивировать счет ${account.name}`}
                    confirmMessage={`Архивировать счет "${account.name}"? Новые операции больше нельзя будет создавать на этот счет.`}
                    className="rounded-full border border-amber-500/35 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </ActionForm>
              </div>

              <details className="mt-5 rounded-[26px] border border-white/8 bg-slate-950/45 p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-200">
                  Редактировать счет
                </summary>
                <ActionForm action={updateAccount} className="mt-4 grid gap-4 md:grid-cols-2" errorClassName={gridErrorClassName}>
                  <input type="hidden" name="accountId" value={account.id} />

                  <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                      Название
                    </span>
                    <input
                      type="text"
                      name="name"
                      className={inputClassName}
                      defaultValue={account.name}
                      required
                      maxLength={80}
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-300">
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                      Тип
                    </span>
                    <select
                      name="kind"
                      className={inputClassName}
                      defaultValue={account.kind}
                    >
                      {Object.values(AccountKind).map((kind) => (
                        <option key={kind} value={kind}>
                          {ACCOUNT_KIND_LABELS[kind]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm text-slate-300">
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                      Валюта
                    </span>
                    {account.currencyLocked ? (
                      <>
                        <input type="hidden" name="currency" value={account.currency} />
                        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-300">
                          {CURRENCY_LABELS[account.currency]}
                        </div>
                      </>
                    ) : (
                      <select
                        name="currency"
                        className={inputClassName}
                        defaultValue={account.currency}
                      >
                        {Object.values(Currency).map((currency) => (
                          <option key={currency} value={currency}>
                            {CURRENCY_LABELS[currency]}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>

                  <div className="md:col-span-2">
                    <SubmitButton label="Сохранить счет" pendingLabel="Сохраняю..." />
                  </div>
                </ActionForm>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Архивные счета</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Старые операции не ломаются, но новые записи туда больше не создаются.
          </p>
        </div>

        {archivedAccounts.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-900/60 px-5 py-8 text-sm text-slate-400">
            Архивных счетов пока нет.
          </div>
        ) : (
          <div className="space-y-4">
            {archivedAccounts.map((account) => (
              <article
                key={account.id}
                className="rounded-[28px] border border-white/10 bg-slate-900/65 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      {ACCOUNT_KIND_LABELS[account.kind]} • {CURRENCY_LABELS[account.currency]} •{" "}
                      Баланс {formatMoney(account.balance, account.currency)}
                    </p>
                  </div>

                  <ActionForm action={restoreAccount}>
                    <input type="hidden" name="accountId" value={account.id} />
                    <SubmitButton
                      label="Вернуть из архива"
                      pendingLabel="Возвращаю..."
                      ariaLabel={`Вернуть из архива счет ${account.name}`}
                      confirmMessage={`Вернуть счет "${account.name}" из архива?`}
                      className="rounded-full border border-emerald-500/35 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </ActionForm>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
