import type { ReactNode } from "react";

type InfoTooltipProps = {
  label?: string;
  children: ReactNode;
};

export function InfoTooltip({ label = "Пояснение", children }: InfoTooltipProps) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        className="grid h-6 w-6 place-items-center rounded-full border border-black/8 bg-white text-xs font-semibold text-stone-600 shadow-sm transition hover:border-black/15 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        i
      </button>
      <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 w-72 translate-y-1 rounded-2xl border border-black/8 bg-stone-950 px-3 py-2 text-left text-xs leading-5 text-white opacity-0 shadow-xl transition group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100">
        {children}
      </span>
    </span>
  );
}
