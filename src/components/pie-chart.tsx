"use client";

import { useMemo, useState } from "react";

type Slice = {
  label: string;
  value: number;
  color: string;
};

type PieChartProps = {
  title: string;
  currency: string;
  total: number;
  slices: Slice[];
};

function formatMoney(value: number, currency: string) {
  return `${new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value)} ${currency}`;
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeDonutSegment(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const safeEndAngle = endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle;
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, safeEndAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, safeEndAngle);
  const largeArcFlag = safeEndAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function buildSegments(slices: Slice[], total: number) {
  let cursor = 0;

  return slices.map((slice) => {
    const angle = total > 0 ? (slice.value / total) * 360 : 0;
    const segment = {
      ...slice,
      startAngle: cursor,
      endAngle: cursor + angle,
    };

    cursor += angle;
    return segment;
  });
}

export function PieChart({ title, currency, total, slices }: PieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const segments = useMemo(() => buildSegments(slices, total), [slices, total]);
  const activeSlice = activeIndex === null ? null : slices[activeIndex];

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-black/6 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-950">{title}</h3>
          <p className="text-sm text-stone-500">Всего: {formatMoney(total, currency)}</p>
        </div>
      </div>

      {slices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/8 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">
          Нет расходных данных для диаграммы в этой валюте.
        </div>
      ) : (
        <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-center">
          <div className="relative mx-auto h-52 w-52 sm:h-56 sm:w-56">
            <svg viewBox="0 0 220 220" className="h-full w-full" role="img" aria-label={title}>
              <circle cx="110" cy="110" r="88" fill="#f5f3ed" />
              {segments.map((segment, index) => {
                const isActive = activeIndex === index;

                return (
                  <path
                    key={segment.label}
                    d={describeDonutSegment(110, 110, isActive ? 92 : 88, 55, segment.startAngle, segment.endAngle)}
                    fill={segment.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    tabIndex={0}
                    role="button"
                    aria-label={`${segment.label}: ${formatMoney(segment.value, currency)}`}
                    className="cursor-pointer transition-opacity outline-none"
                    style={{ opacity: activeIndex === null || isActive ? 1 : 0.42 }}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onFocus={() => setActiveIndex(index)}
                    onBlur={() => setActiveIndex(null)}
                  />
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="grid h-28 w-28 place-items-center rounded-full border border-black/8 bg-white text-center shadow-sm">
                <div className="px-3">
                  <div className="text-xs uppercase tracking-[0.08em] text-stone-500">
                    {activeSlice ? "Сектор" : "Итого"}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-stone-950">
                    {activeSlice ? formatMoney(activeSlice.value, currency) : formatMoney(total, currency)}
                  </div>
                </div>
              </div>
            </div>
            {activeSlice ? (
              <div className="absolute left-1/2 top-2 z-10 w-52 -translate-x-1/2 rounded-2xl border border-black/8 bg-stone-950 px-3 py-2 text-center text-xs leading-5 text-white shadow-xl">
                <div className="font-semibold">{activeSlice.label}</div>
                <div>
                  {formatMoney(activeSlice.value, currency)} · {((activeSlice.value / total) * 100).toFixed(1)}%
                </div>
              </div>
            ) : null}
          </div>

          <div className="min-w-0 space-y-3">
            {slices.map((slice, index) => {
              const percent = total === 0 ? 0 : (slice.value / total) * 100;
              const isActive = activeIndex === index;

              return (
                <button
                  key={slice.label}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  className={`min-w-0 w-full rounded-xl border p-3 text-left transition ${
                    isActive ? "border-black/15 bg-white shadow-sm" : "border-black/6 bg-stone-50"
                  }`}
                >
                  <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                      <span className="min-w-0 break-words font-medium text-stone-900">{slice.label}</span>
                    </div>
                    <span className="shrink-0 text-stone-600 sm:text-right">{formatMoney(slice.value, currency)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percent}%`, backgroundColor: slice.color }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-stone-500">{percent.toFixed(1)}%</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
