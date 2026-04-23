import type { Account, Category } from "@prisma/client";

import { SubmitButton } from "@/components/submit-button";
import { toDateInputValue } from "@/lib/utils";

type ServerAction = (formData: FormData) => Promise<void>;

type CommonFormProps = {
  action: ServerAction;
  submitLabel: string;
  pendingLabel: string;
  title?: string;
  compact?: boolean;
};

type ExpenseInitialValues = {
  transactionId?: string;
  occurredOn?: string;
  note?: string;
  accountId?: string;
  categoryId?: string;
  amount?: string;
};

type IncomeInitialValues = {
  transactionId?: string;
  occurredOn?: string;
  note?: string;
  accountId?: string;
  amount?: string;
};

type TransferInitialValues = {
  transactionId?: string;
  occurredOn?: string;
  note?: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount?: string;
};

type ExchangeInitialValues = {
  transactionId?: string;
  occurredOn?: string;
  note?: string;
  fromAccountId?: string;
  toAccountId?: string;
  fromAmount?: string;
  toAmount?: string;
};

type ExpenseFormProps = CommonFormProps & {
  accounts: Account[];
  categories: Category[];
  initial?: ExpenseInitialValues;
};

type IncomeFormProps = CommonFormProps & {
  accounts: Account[];
  defaultAccountId?: string;
  initial?: IncomeInitialValues;
};

type TransferFormProps = CommonFormProps & {
  accounts: Account[];
  initial?: TransferInitialValues;
};

type ExchangeFormProps = CommonFormProps & {
  accounts: Account[];
  initial?: ExchangeInitialValues;
};

function getTodayDate() {
  return toDateInputValue(new Date());
}

function getAccountOptions(accounts: Account[], selectedIds: string[] = []): Account[] {
  const activeAccounts = accounts.filter((account) => !account.isArchived);
  const selectedArchived = accounts.filter((account) => selectedIds.includes(account.id) && account.isArchived);

  return [...selectedArchived, ...activeAccounts.filter((account) => !selectedArchived.some((selected) => selected.id === account.id))];
}

function getCategoryOptions(categories: Category[], selectedId?: string): Category[] {
  const activeCategories = categories.filter((category) => !category.isDeleted);
  const selectedDeleted = categories.filter((category) => category.id === selectedId && category.isDeleted);

  return [...selectedDeleted, ...activeCategories.filter((category) => !selectedDeleted.some((selected) => selected.id === category.id))];
}

function FormCard({ title, compact, children }: { title?: string; compact?: boolean; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-slate-900/70 ${compact ? "p-4" : "p-5"}`}>
      {title ? <h3 className="mb-4 text-base font-semibold text-white">{title}</h3> : null}
      {children}
    </section>
  );
}

function FormGrid({ compact, children }: { compact?: boolean; children: React.ReactNode }) {
  return <div className={`grid gap-3 ${compact ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-sm text-slate-300">
      <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400";

export function ExpenseForm({ accounts, categories, action, submitLabel, pendingLabel, title, compact, initial }: ExpenseFormProps) {
  const accountOptions = getAccountOptions(accounts, initial?.accountId ? [initial.accountId] : []);
  const categoryOptions = getCategoryOptions(categories, initial?.categoryId);
  const disabled = accountOptions.length === 0 || categoryOptions.length === 0;

  return (
    <FormCard title={title} compact={compact}>
      <form action={action} className="space-y-4">
        {initial?.transactionId ? <input type="hidden" name="transactionId" value={initial.transactionId} /> : null}
        <FormGrid compact={compact}>
          <Field label="Дата">
            <input type="date" name="occurredOn" defaultValue={initial?.occurredOn ?? getTodayDate()} className={inputClassName} required />
          </Field>
          <Field label="Счет">
            <select name="accountId" defaultValue={initial?.accountId ?? accountOptions[0]?.id ?? ""} className={inputClassName} required>
              <option value="" disabled>
                Выбери счет
              </option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency}){account.isArchived ? " — архив" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Категория">
            <select name="categoryId" defaultValue={initial?.categoryId ?? categoryOptions[0]?.id ?? ""} className={inputClassName} required>
              <option value="" disabled>
                Выбери категорию
              </option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}{category.isDeleted ? " — удалена" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Сумма">
            <input type="number" name="amount" min="0.0001" step="0.0001" defaultValue={initial?.amount ?? ""} className={inputClassName} required />
          </Field>
          <Field label="Заметка">
            <input type="text" name="note" maxLength={200} defaultValue={initial?.note ?? ""} className={inputClassName} placeholder="Необязательно" />
          </Field>
        </FormGrid>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">Категория сохраняется snapshot-именем внутри операции.</p>
          <SubmitButton label={submitLabel} pendingLabel={pendingLabel} disabled={disabled} />
        </div>
      </form>
    </FormCard>
  );
}

export function IncomeForm({ accounts, action, submitLabel, pendingLabel, title, compact, defaultAccountId, initial }: IncomeFormProps) {
  const accountOptions = getAccountOptions(accounts, initial?.accountId ? [initial.accountId] : []);
  const defaultSelectedAccountId = initial?.accountId ?? defaultAccountId ?? accountOptions[0]?.id ?? "";

  return (
    <FormCard title={title} compact={compact}>
      <form action={action} className="space-y-4">
        {initial?.transactionId ? <input type="hidden" name="transactionId" value={initial.transactionId} /> : null}
        <FormGrid compact={compact}>
          <Field label="Дата">
            <input type="date" name="occurredOn" defaultValue={initial?.occurredOn ?? getTodayDate()} className={inputClassName} required />
          </Field>
          <Field label="Счет">
            <select name="accountId" defaultValue={defaultSelectedAccountId} className={inputClassName} required>
              <option value="" disabled>
                Выбери счет
              </option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency}){account.isArchived ? " — архив" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Сумма">
            <input type="number" name="amount" min="0.0001" step="0.0001" defaultValue={initial?.amount ?? ""} className={inputClassName} required />
          </Field>
          <Field label="Заметка">
            <input type="text" name="note" maxLength={200} defaultValue={initial?.note ?? ""} className={inputClassName} placeholder="Например: зарплата" />
          </Field>
        </FormGrid>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">Доход по умолчанию можно направлять на Binance USDT.</p>
          <SubmitButton label={submitLabel} pendingLabel={pendingLabel} disabled={accountOptions.length === 0} />
        </div>
      </form>
    </FormCard>
  );
}

export function TransferForm({ accounts, action, submitLabel, pendingLabel, title, compact, initial }: TransferFormProps) {
  const accountOptions = getAccountOptions(accounts, [initial?.fromAccountId ?? "", initial?.toAccountId ?? ""].filter(Boolean));

  return (
    <FormCard title={title} compact={compact}>
      <form action={action} className="space-y-4">
        {initial?.transactionId ? <input type="hidden" name="transactionId" value={initial.transactionId} /> : null}
        <FormGrid compact={compact}>
          <Field label="Дата">
            <input type="date" name="occurredOn" defaultValue={initial?.occurredOn ?? getTodayDate()} className={inputClassName} required />
          </Field>
          <Field label="Откуда">
            <select name="fromAccountId" defaultValue={initial?.fromAccountId ?? accountOptions[0]?.id ?? ""} className={inputClassName} required>
              <option value="" disabled>
                Счет списания
              </option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency}){account.isArchived ? " — архив" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Куда">
            <select name="toAccountId" defaultValue={initial?.toAccountId ?? accountOptions[1]?.id ?? accountOptions[0]?.id ?? ""} className={inputClassName} required>
              <option value="" disabled>
                Счет зачисления
              </option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency}){account.isArchived ? " — архив" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Сумма">
            <input type="number" name="amount" min="0.0001" step="0.0001" defaultValue={initial?.amount ?? ""} className={inputClassName} required />
          </Field>
          <Field label="Заметка">
            <input type="text" name="note" maxLength={200} defaultValue={initial?.note ?? ""} className={inputClassName} placeholder="Например: размен" />
          </Field>
        </FormGrid>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">Перевод разрешен только между счетами одной валюты.</p>
          <SubmitButton label={submitLabel} pendingLabel={pendingLabel} disabled={accountOptions.length < 2} />
        </div>
      </form>
    </FormCard>
  );
}

export function ExchangeForm({ accounts, action, submitLabel, pendingLabel, title, compact, initial }: ExchangeFormProps) {
  const accountOptions = getAccountOptions(accounts, [initial?.fromAccountId ?? "", initial?.toAccountId ?? ""].filter(Boolean));

  return (
    <FormCard title={title} compact={compact}>
      <form action={action} className="space-y-4">
        {initial?.transactionId ? <input type="hidden" name="transactionId" value={initial.transactionId} /> : null}
        <FormGrid compact={compact}>
          <Field label="Дата">
            <input type="date" name="occurredOn" defaultValue={initial?.occurredOn ?? getTodayDate()} className={inputClassName} required />
          </Field>
          <Field label="Откуда списать">
            <select name="fromAccountId" defaultValue={initial?.fromAccountId ?? accountOptions[0]?.id ?? ""} className={inputClassName} required>
              <option value="" disabled>
                Выбери счет
              </option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency}){account.isArchived ? " — архив" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Куда зачислить">
            <select name="toAccountId" defaultValue={initial?.toAccountId ?? accountOptions[1]?.id ?? accountOptions[0]?.id ?? ""} className={inputClassName} required>
              <option value="" disabled>
                Выбери счет
              </option>
              {accountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency}){account.isArchived ? " — архив" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Списать">
            <input type="number" name="fromAmount" min="0.0001" step="0.0001" defaultValue={initial?.fromAmount ?? ""} className={inputClassName} required />
          </Field>
          <Field label="Зачислить">
            <input type="number" name="toAmount" min="0.0001" step="0.0001" defaultValue={initial?.toAmount ?? ""} className={inputClassName} required />
          </Field>
          <Field label="Заметка">
            <input type="text" name="note" maxLength={200} defaultValue={initial?.note ?? ""} className={inputClassName} placeholder="Например: P2P вывод" />
          </Field>
        </FormGrid>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">Обмен не считается расходом и сохраняет обе стороны операции.</p>
          <SubmitButton label={submitLabel} pendingLabel={pendingLabel} disabled={accountOptions.length < 2} />
        </div>
      </form>
    </FormCard>
  );
}
