import { NavLink } from "@/components/nav-link";

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/25 sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">
          Управление
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          Счета и категории
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          Настройка счетов и категорий, используемых в операциях и отчетах.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <NavLink href="/manage/accounts" label="Счета" />
          <NavLink href="/manage/categories" label="Категории" />
        </div>
      </section>

      {children}
    </div>
  );
}
