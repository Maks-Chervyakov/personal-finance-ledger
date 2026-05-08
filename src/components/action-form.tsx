"use client";

import { useActionState, type ReactNode } from "react";

import {
  initialFormActionState,
  type FormAction,
  type FormActionState,
} from "@/lib/form-state";

type ActionFormProps = {
  action: FormAction;
  className?: string;
  errorClassName?: string;
  children: ReactNode;
};

function ActionFormMessage({
  state,
  className,
}: {
  state: FormActionState;
  className?: string;
}) {
  if (state.status !== "error" || !state.message) {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={
        className ??
        "rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100"
      }
    >
      {state.message}
    </p>
  );
}

export function ActionForm({
  action,
  className,
  errorClassName,
  children,
}: ActionFormProps) {
  const [state, formAction] = useActionState(action, initialFormActionState);

  return (
    <form action={formAction} className={className}>
      {children}
      <ActionFormMessage state={state} className={errorClassName} />
    </form>
  );
}
