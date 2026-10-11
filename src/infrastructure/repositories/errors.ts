import type { PostgrestError } from "@supabase/supabase-js";

/** Error raised by repositories; message is safe to show to users. */
export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

/** Throws a RepositoryError with a friendly message for common Postgres errors. */
export function raise(error: PostgrestError, context: string): never {
  const friendly: Record<string, string> = {
    "23505": "That already exists — it must be unique.",
    "23503": "A related record could not be found.",
    "23514": "Some values are out of the allowed range.",
    "42501": "You do not have permission to do that.",
    PGRST116: "Not found.",
  };
  console.error(`[repository] ${context}:`, error.code, error.message);
  throw new RepositoryError(friendly[error.code] ?? `Could not ${context}.`, error.code);
}
