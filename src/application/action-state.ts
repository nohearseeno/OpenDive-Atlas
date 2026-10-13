import { z } from "zod";
import { RepositoryError } from "@/infrastructure/repositories/errors";

/** Uniform result for form-backed server actions (used with useActionState). */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialActionState: ActionState = { ok: false };

export function fromZodError(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
}

export function fromUnknownError(error: unknown): ActionState {
  if (error instanceof RepositoryError) return { ok: false, message: error.message };
  console.error("[action] unexpected error", error);
  return { ok: false, message: "Something went wrong. Please try again." };
}

/** Re-throws Next.js control-flow errors (redirect/notFound) so they are not swallowed. */
export function rethrowIfNavigation(error: unknown): void {
  if (
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    ((error as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
      (error as { digest: string }).digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"))
  ) {
    throw error;
  }
}

export function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}
