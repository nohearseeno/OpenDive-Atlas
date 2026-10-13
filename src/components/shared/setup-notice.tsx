import { Database } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** Shown when Supabase environment variables are missing (fresh clone). */
export function SetupNotice() {
  return (
    <Alert>
      <Database />
      <AlertTitle>Connect a Supabase project to load data</AlertTitle>
      <AlertDescription>
        <p>
          Copy <code>.env.example</code> to <code>.env.local</code> and set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. See the README for the local Supabase quick start.
        </p>
      </AlertDescription>
    </Alert>
  );
}
