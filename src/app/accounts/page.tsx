import { AccountKind, Currency } from "@prisma/client";

import { archiveAccount, createAccount, restoreAccount, updateAccount } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { ACCOUNT_KIND_LABELS, CURRENCY_LABELS } from "@/lib/constants";
import { getAccountsOverview } from "@/lib/data";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400";

export default async function AccountsPage() {
  const accounts = await getAccountsOverview();
  const activeAccounts = accounts.filter((account) => !account.isArchived);
  const archivedAccounts = accounts.filter((account) => account.isArchived);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-white">Новый счет</h2>
          <p className="text-sm text-slate-400">Источники денег живут именно здесь: карта, наличка, Binance, Bybit и так далее.</p>
        </div>

        <form action={createAccount} className="grid gap-4 lg:grid-cols-4">
          <label className="space-y-2 text-sm text-slate-300 lg:col-span-2">
            <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Название</span>
            <input type="text" name="name" className={inputClassName} placeholder="Например: Monobank UAH" required maxLength={80} />
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Тип</span>
            <select name="kind" className={inputClassName} defaultValue={AccountKind.CARD}>
              {Object.values(AccountKind).map((kind) => (
                <option key={kind} value={kind}>
                  {ACCOUNT_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Валюта</span>
            <select name="currency" className={inputClassName} defaultValue={Currency.UAH}>
              {Object.values(Currency).map((currency) => (
                <option key={currency} value={currency}>
                  {CURRENCY_LABELS[currency]}
                </option>
              ))}
            </select>
          </label>

          <div className="lg:col-span-4">
            <SubmitButton label="Добавить счет" pendingLabel="Добавляю..." />
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Активные счета</h2>
          <p className="text-sm text-slate-400">Валюту счета с историей операций менять нельзя, иначе баланс превратится в мусор.</p>
        </div>

        <div className="space-y-4">
          {activeAccounts.map((account) => (
            <article key={account.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
                      {ACCOUNT_KIND_LABELS[account.kind]}
                    </span>
                    <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">{CURRENCY_LABELS[account.currency]}</span>
                    {account.currencyLocked ? <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">Валюта заблокирована историей</span> : null}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                  <p className="text-sm text-slate-300">Баланс: {formatMoney(account.balance, account.currency)}</p>
                  <p className="text-sm text-slate-400">Операций: {account.transactionCount}</p>
                </div>

                <form action={archiveAccount}>
                  <input type="hidden" name="accountId" value={account.id} />
                  <SubmitButton
                    label="Архивировать"
                    pendingLabel="Архивирую..."
                    className="rounded-xl border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </form>
              </div>

              <details className="mt-5 rounded-2xl border border-white/6 bg-slate-950/40 p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-200">Редактировать счет</summary>
                <form action={updateAccount} className="mt-4 grid gap-4 lg:grid-cols-4">
                  <input type="hidden" name="accountId" value={account.id} />

                  <label className="space-y-2 text-sm text-slate-300 lg:col-span-2">
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Название</span>
                    <input type="text" name="name" className={inputClassName} defaultValue={account.name} required maxLength={80} />
                  </label>

                  <label className="space-y-2 text-sm text-slate-300">
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Тип</span>
                    <select name="kind" className={inputClassName} defaultValue={account.kind}>
                      {Object.values(AccountKind).map((kind) => (
                        <option key={kind} value={kind}>
                          {ACCOUNT_KIND_LABELS[kind]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm text-slate-300">
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Валюта</span>
                    {account.currencyLocked ? (
                      <>
                        <input type="hidden" name="currency" value={account.currency} />
                        <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">{CURRENCY_LABELS[account.currency]}</div>
                      </>
                    ) : (
                      <select name="currency" className={inputClassName} defaultValue={account.currency}>
                        {Object.values(Currency).map((currency) => (
                          <option key={currency} value={currency}>
                            {CURRENCY_LABELS[currency]}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>

                  <div className="lg:col-span-4">
                    <SubmitButton label="Сохранить счет" pendingLabel="Сохраняю..." />
                  </div>
                </form>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Архивные счета</h2>
          <p className="text-sm text-slate-400">Старые операции не ломаются, но новые записи в такие счета не создаются.</p>
        </div>

        {archivedAccounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/70 px-4 py-8 text-sm text-slate-400">
            Архивных счетов пока нет.
          </div>
        ) : (
          <div className="space-y-4">
            {archivedAccounts.map((account) => (
              <article key={account.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                    <p className="text-sm text-slate-300">
                      {ACCOUNT_KIND_LABELS[account.kind]} • {CURRENCY_LABELS[account.currency]} • Баланс {formatMoney(account.balance, account.currency)}
                    </p>
                  </div>

                  <form action={restoreAccount}>
                    <input type="hidden" name="accountId" value={account.id} />
                    <SubmitButton
                      label="Вернуть из архива"
                      pendingLabel="Возвращаю..."
                      className="rounded-xl border border-emerald-500/40 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
