import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ActionState } from "@/application/action-state";

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <Alert variant={state.ok ? "success" : "destructive"} aria-live="polite">
      {state.ok ? <CheckCircle2 /> : <AlertCircle />}
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
