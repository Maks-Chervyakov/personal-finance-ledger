import { type Currency } from "@prisma/client";

import { formatMoney } from "@/lib/utils";

type Slice = {
  label: string;
  value: number;
  color: string;
};

type PieChartProps = {
  title: string;
  currency: Currency;
  total: number;
  slices: Slice[];
};

function buildGradient(slices: Slice[]): string {
  if (slices.length === 0) {
    return "conic-gradient(#1e293b 0deg 360deg)";
  }

  let offset = 0;
  const parts = slices.map((slice) => {
    const angle = slice.value === 0 ? 0 : (slice.value / slices.reduce((sum, item) => sum + item.value, 0)) * 360;
    const start = offset;
    offset += angle;
    return `${slice.color} ${start}deg ${offset}deg`;
  });

  return `conic-gradient(${parts.join(", ")})`;
}

export function PieChart({ title, currency, total, slices }: PieChartProps) {
  const gradient = buildGradient(slices);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/30">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">Всего: {formatMoney(total, currency)}</p>
        </div>
      </div>

      {slices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-10 text-center text-sm text-slate-400">
          Нет расходных данных для диаграммы в этой валюте.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
          <div className="mx-auto grid h-56 w-56 place-items-center rounded-full border border-white/10 bg-slate-950/60" style={{ backgroundImage: gradient }}>
            <div className="grid h-28 w-28 place-items-center rounded-full border border-white/10 bg-slate-950 text-center shadow-inner shadow-black/30">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Итого</div>
                <div className="mt-1 text-sm font-semibold text-white">{formatMoney(total, currency)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {slices.map((slice) => {
              const percent = total === 0 ? 0 : (slice.value / total) * 100;
              return (
                <div key={slice.label} className="rounded-xl border border-white/8 bg-white/4 p-3">
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
                      <span className="font-medium text-slate-100">{slice.label}</span>
                    </div>
                    <span className="text-slate-300">{formatMoney(slice.value, currency)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: slice.color }} />
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{percent.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
