"use client";

import { type KeyboardEvent, useMemo, useState } from "react";

type BalanceSlice = {
  accountId: string;
  label: string;
  value: number;
  color: string;
};

type BalanceGroup = {
  currency: string;
  totalPositiveBalance: number;
  slices: BalanceSlice[];
  nonPositiveAccounts: BalanceSlice[];
};

type BalanceDonutGridProps = {
  groups: BalanceGroup[];
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

function buildSegments(slices: BalanceSlice[], total: number) {
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

function BalanceDonutCard({ group }: { group: BalanceGroup }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const segments = useMemo(
    () => buildSegments(group.slices, group.totalPositiveBalance),
    [group.slices, group.totalPositiveBalance],
  );
  const activeIndex = hoveredIndex ?? selectedIndex;
  const activeSlice = activeIndex === null ? null : group.slices[activeIndex];
  const activePercent =
    activeSlice && group.totalPositiveBalance > 0
      ? (activeSlice.value / group.totalPositiveBalance) * 100
      : 0;
  const toggleSelected = (index: number) => {
    setSelectedIndex((current) => (current === index ? null : index));
  };
  const handleActivationKey = (event: KeyboardEvent<SVGPathElement | HTMLButtonElement>, index: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleSelected(index);
    }
  };

  return (
    <article className="min-w-0 rounded-2xl border border-black/6 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full border border-black/8 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-stone-900">
          {group.currency}
        </span>
        <span className="text-xs text-stone-500">по счетам</span>
      </div>

      <div className="grid gap-4">
        <div className="relative mx-auto h-36 w-36">
          <svg viewBox="0 0 140 140" className="h-full w-full" role="img" aria-label={`Остатки ${group.currency}`}>
            <circle cx="70" cy="70" r="54" fill="#f5f3ed" />
            {segments.length > 0 ? (
              segments.map((segment, index) => {
                const isActive = activeIndex === index;

                return (
                  <path
                    key={segment.accountId}
                    d={describeDonutSegment(70, 70, isActive ? 58 : 54, 35, segment.startAngle, segment.endAngle)}
                    fill={segment.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    tabIndex={0}
                    role="button"
                    aria-label={`${segment.label}: ${formatMoney(segment.value, group.currency)}`}
                    className="cursor-pointer outline-none transition-opacity"
                    style={{ opacity: activeIndex === null || isActive ? 1 : 0.38 }}
                    onPointerDown={() => toggleSelected(index)}
                    onKeyDown={(event) => handleActivationKey(event, index)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(index)}
                    onBlur={() => setHoveredIndex(null)}
                  />
                );
              })
            ) : (
              <circle cx="70" cy="70" r="54" fill="none" stroke="#d8d3c8" strokeWidth="18" />
            )}
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-stone-500">Всего</div>
              <div className="mt-1 text-xs font-semibold text-stone-950">
                {formatMoney(group.totalPositiveBalance, group.currency)}
              </div>
            </div>
          </div>
        </div>

        {activeSlice ? (
          <div className="rounded-2xl border border-black/8 bg-stone-950 px-3 py-2 text-xs leading-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 break-words font-semibold">{activeSlice.label}</span>
              <span className="shrink-0 text-white/70">{activePercent.toFixed(1)}%</span>
            </div>
            <div className="mt-1 text-white/80">{formatMoney(activeSlice.value, group.currency)}</div>
          </div>
        ) : null}

        <div className="space-y-2">
          {group.slices.slice(0, 3).map((slice, index) => (
            <button
              key={slice.accountId}
              type="button"
              onPointerDown={() => toggleSelected(index)}
              onKeyDown={(event) => handleActivationKey(event, index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-black/6 bg-stone-50 px-3 py-2 text-left text-xs transition hover:border-black/10 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="min-w-0 break-words font-medium text-stone-900">{slice.label}</span>
              </span>
              <span className="shrink-0 text-stone-600">{formatMoney(slice.value, group.currency)}</span>
            </button>
          ))}
          {group.nonPositiveAccounts.length > 0 ? (
            <div className="rounded-2xl border border-dashed border-black/8 bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-500">
              Без положительного остатка: {group.nonPositiveAccounts.length}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function BalanceDonutGrid({ groups }: BalanceDonutGridProps) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {groups.map((group) => (
        <BalanceDonutCard key={group.currency} group={group} />
      ))}
    </div>
  );
}
