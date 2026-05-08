export type FormActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type FormAction = (
  prevState: FormActionState,
  formData: FormData,
) => Promise<FormActionState>;

export const initialFormActionState: FormActionState = {
  status: "idle",
  message: "",
};

export function formActionSuccess(): FormActionState {
  return { status: "success", message: "" };
}

export function formActionError(message: string): FormActionState {
  return { status: "error", message };
}
