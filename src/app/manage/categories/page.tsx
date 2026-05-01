import {
  createCategory,
  deleteCategory,
  hardDeleteCategory,
  restoreCategory,
  updateCategory,
} from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { getCategoriesOverview } from "@/lib/data";

export const dynamic = "force-dynamic";

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300";

export default async function ManageCategoriesPage() {
  const categories = await getCategoriesOverview();
  const activeCategories = categories.filter((category) => !category.isDeleted);
  const deletedCategories = categories.filter((category) => category.isDeleted);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border border-white/10 bg-slate-900/62 p-5 shadow-2xl shadow-slate-950/20 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
            Сводка по категориям
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/8 bg-slate-950/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Всего
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {categories.length}
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Активные
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {activeCategories.length}
              </div>
            </div>
            <div className="rounded-3xl border border-white/8 bg-slate-950/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Удаленные
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {deletedCategories.length}
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-[30px] border border-white/10 bg-slate-900/72 p-5 shadow-2xl shadow-slate-950/25 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">Новая категория</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Удаление мягкое: история расходов не теряет snapshot имени категории.
            </p>
          </div>

          <form action={createCategory} className="grid gap-4 md:grid-cols-[1fr_auto]">
            <label className="space-y-2 text-sm text-slate-300">
              <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                Название
              </span>
              <input
                type="text"
                name="name"
                className={inputClassName}
                placeholder="Например: Стоматология"
                required
                maxLength={80}
              />
            </label>
            <div className="md:self-end">
              <SubmitButton label="Добавить категорию" pendingLabel="Добавляю..." />
            </div>
          </form>
        </section>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Активные категории</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Переименование не переписывает старые операции: у каждой остается свой
            snapshot.
          </p>
        </div>

        <div className="space-y-4">
          {activeCategories.map((category) => (
            <article
              key={category.id}
              className="rounded-[30px] border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Связанных расходных операций: {category.expenseCount}
                  </p>
                </div>

                <form action={deleteCategory}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <SubmitButton
                    label="Удалить"
                    pendingLabel="Удаляю..."
                    className="rounded-full border border-amber-500/35 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </form>
              </div>

              <details className="mt-5 rounded-[26px] border border-white/8 bg-slate-950/45 p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-200">
                  Переименовать категорию
                </summary>
                <form action={updateCategory} className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <label className="space-y-2 text-sm text-slate-300">
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                      Новое имя
                    </span>
                    <input
                      type="text"
                      name="name"
                      className={inputClassName}
                      defaultValue={category.name}
                      required
                      maxLength={80}
                    />
                  </label>
                  <div className="md:self-end">
                    <SubmitButton label="Сохранить" pendingLabel="Сохраняю..." />
                  </div>
                </form>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Удаленные категории</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Старые операции все равно показывают их историческое имя и статус удаления.
          </p>
        </div>

        {deletedCategories.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-900/60 px-5 py-8 text-sm text-slate-400">
            Удаленных категорий пока нет.
          </div>
        ) : (
          <div className="space-y-4">
            {deletedCategories.map((category) => (
              <article
                key={category.id}
                className="rounded-[28px] border border-white/10 bg-slate-900/65 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Исторических операций: {category.expenseCount}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <form action={restoreCategory}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <SubmitButton
                        label={"\u0412\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c"}
                        pendingLabel={"\u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0430\u044e..."}
                        className="rounded-full border border-emerald-500/35 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </form>
                    <form action={hardDeleteCategory}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <SubmitButton
                        label={"\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e"}
                        pendingLabel={"\u0423\u0434\u0430\u043b\u044f\u044e..."}
                        className="rounded-full border border-rose-500/40 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
