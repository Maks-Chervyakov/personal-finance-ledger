"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
  confirmMessage?: string;
  ariaLabel?: string;
};

export function SubmitButton({
  label,
  pendingLabel = "Сохраняю...",
  className,
  disabled = false,
  confirmMessage,
  ariaLabel,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-label={ariaLabel}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={
        className ??
        "rounded-full border border-black/8 bg-stone-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
