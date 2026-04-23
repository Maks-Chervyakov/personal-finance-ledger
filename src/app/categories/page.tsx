import { createCategory, deleteCategory, restoreCategory, updateCategory } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { getCategoriesOverview } from "@/lib/data";

export const dynamic = "force-dynamic";

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400";

export default async function CategoriesPage() {
  const categories = await getCategoriesOverview();
  const activeCategories = categories.filter((category) => !category.isDeleted);
  const deletedCategories = categories.filter((category) => category.isDeleted);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-white">Новая категория</h2>
          <p className="text-sm text-slate-400">Удаление мягкое: история трат хранит snapshot имени и не разваливается.</p>
        </div>

        <form action={createCategory} className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <label className="space-y-2 text-sm text-slate-300">
            <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Название</span>
            <input type="text" name="name" className={inputClassName} placeholder="Например: Стоматология" required maxLength={80} />
          </label>
          <div className="lg:self-end">
            <SubmitButton label="Добавить категорию" pendingLabel="Добавляю..." />
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Активные категории</h2>
          <p className="text-sm text-slate-400">Переименование не переписывает старые операции: у них свой snapshot.</p>
        </div>

        <div className="space-y-4">
          {activeCategories.map((category) => (
            <article key={category.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                  <p className="text-sm text-slate-400">Связанных расходных операций: {category.expenseCount}</p>
                </div>

                <form action={deleteCategory}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <SubmitButton
                    label="Удалить"
                    pendingLabel="Удаляю..."
                    className="rounded-xl border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </form>
              </div>

              <details className="mt-5 rounded-2xl border border-white/6 bg-slate-950/40 p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-200">Переименовать категорию</summary>
                <form action={updateCategory} className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <label className="space-y-2 text-sm text-slate-300">
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Новое имя</span>
                    <input type="text" name="name" className={inputClassName} defaultValue={category.name} required maxLength={80} />
                  </label>
                  <div className="lg:self-end">
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
          <h2 className="text-xl font-semibold text-white">Удаленные категории</h2>
          <p className="text-sm text-slate-400">Старые операции продолжают показывать старое имя и бейдж удаления.</p>
        </div>

        {deletedCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/70 px-4 py-8 text-sm text-slate-400">
            Удаленных категорий пока нет.
          </div>
        ) : (
          <div className="space-y-4">
            {deletedCategories.map((category) => (
              <article key={category.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                    <p className="text-sm text-slate-400">Исторических операций: {category.expenseCount}</p>
                  </div>

                  <form action={restoreCategory}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <SubmitButton
                      label="Восстановить"
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
