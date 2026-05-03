"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MonthPickerFieldProps = {
  name: string;
  defaultValue: string;
  className?: string;
};

const MONTHS = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

function parseMonthValue(value: string) {
  const [rawYear, rawMonth] = value.split("-").map(Number);
  const year = Number.isFinite(rawYear) ? rawYear : new Date().getFullYear();
  const month = Number.isFinite(rawMonth) ? Math.min(Math.max(rawMonth, 1), 12) : new Date().getMonth() + 1;

  return { year, month };
}

function toMonthValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatMonthLabel(value: string) {
  const { year, month } = parseMonthValue(value);

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

export function MonthPickerField({ name, defaultValue, className }: MonthPickerFieldProps) {
  const initial = useMemo(() => parseMonthValue(defaultValue), [defaultValue]);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [visibleYear, setVisibleYear] = useState(initial.year);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selected = parseMonthValue(selectedValue);
  const monthLabel = formatMonthLabel(selectedValue);

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={selectedValue} />
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Открыть выбор месяца, сейчас ${monthLabel}`}
        onClick={() => setIsOpen((value) => !value)}
        className={
          className ??
          "flex w-full items-center justify-between gap-3 rounded-2xl border border-black/8 bg-white px-3 py-2.5 text-left text-sm font-medium text-stone-950 shadow-sm transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        }
      >
        <span>{monthLabel}</span>
        <span aria-hidden className="text-base text-stone-500">
          ▾
        </span>
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="Выбор месяца"
          className="absolute left-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-black/8 bg-white p-3 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setVisibleYear((year) => year - 1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-black/8 text-stone-700 transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20"
              aria-label="Предыдущий год"
            >
              ←
            </button>
            <div className="text-sm font-semibold text-stone-950">{visibleYear}</div>
            <button
              type="button"
              onClick={() => setVisibleYear((year) => year + 1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-black/8 text-stone-700 transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20"
              aria-label="Следующий год"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((label, index) => {
              const month = index + 1;
              const value = toMonthValue(visibleYear, month);
              const isSelected = selected.year === visibleYear && selected.month === month;

              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedValue(value);
                    setIsOpen(false);
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/20 ${
                    isSelected
                      ? "border-stone-950 bg-stone-950 text-white shadow-sm"
                      : "border-black/8 bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
