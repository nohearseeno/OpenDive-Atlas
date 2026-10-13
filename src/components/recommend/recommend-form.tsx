"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SiteCard } from "@/components/sites/site-card";
import { recommendAction, type RecommendState } from "@/application/actions/recommendations";

const EXAMPLES = [
  "Warm water and sharks, I'm a beginner, travelling in December",
  "Big wrecks in Europe for an advanced diver",
  "Macro critters and nudibranchs, calm conditions",
  "Mantas or whale sharks, somewhere in Asia",
];

const storageKey = (query: string) => `recommend:${query.trim().replace(/\s+/g, " ").toLowerCase()}`;

export function RecommendForm({
  initialQuery = "",
  initialResult,
}: {
  initialQuery?: string;
  /** A saved answer rendered on the server (from the cache or the diver's history). */
  initialResult?: RecommendState;
}) {
  const [state, formAction, pending] = useActionState<RecommendState, FormData>(
    recommendAction,
    initialResult ?? { status: "idle" },
  );
  // Results kept in this tab, so Back from a site page shows them again without a new request.
  const [restored, setRestored] = useState<RecommendState | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.status !== "idle") return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q) return;
    try {
      const saved = sessionStorage.getItem(storageKey(q));
      if (!saved) return;
      const result = JSON.parse(saved) as RecommendState;
      if (result.status !== "ok") return;
      setRestored(result);
      if (input.current && result.query) input.current.value = result.query;
    } catch {
      // Storage unavailable or corrupt: just show the empty form.
    }
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.status !== "ok" || !state.query) return;
    // Put the search in the URL so Back, reload and shared links come back to it.
    const url = `/recommend?q=${encodeURIComponent(state.query)}`;
    if (window.location.pathname + window.location.search !== url) window.history.replaceState(null, "", url);
    try {
      sessionStorage.setItem(storageKey(state.query), JSON.stringify(state));
    } catch {
      // Storage full or blocked; the server cache still covers Back.
    }
  }, [state]);

  const shown = state.status === "idle" && restored ? restored : state;

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-3">
        <label htmlFor="query" className="text-sm font-medium">
          Describe your ideal dive
        </label>
        <Textarea
          ref={input}
          id="query"
          name="query"
          rows={3}
          maxLength={600}
          required
          defaultValue={shown.query ?? initialQuery}
          placeholder="e.g. Colourful reefs and turtles, warm water, I'm newly certified and going in March"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" variant="sponge" disabled={pending}>
            <Sparkles /> {pending ? "Finding sites…" : "Recommend sites"}
          </Button>
          <span className="text-muted-foreground text-xs">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                if (input.current) input.current.value = ex;
                input.current?.focus();
              }}
              className="hover:bg-accent rounded-full border px-3 py-1 text-xs"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>

      <div aria-live="polite" className="space-y-4">
        {pending && <p className="text-muted-foreground text-sm">Looking through the atlas for you…</p>}
        {!pending && shown.status === "error" && (
          <Alert variant="destructive">
            <AlertDescription>{shown.message}</AlertDescription>
          </Alert>
        )}
        {!pending && shown.status === "ok" && (
          <>
            {shown.intro && <p className="text-lg">{shown.intro}</p>}
            {shown.picks?.length ? (
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shown.picks.map(({ site, reason }) => (
                  <li key={site.id} className="flex flex-col gap-2">
                    <SiteCard site={site} />
                    <p className="text-muted-foreground px-1 text-sm">{reason}</p>
                  </li>
                ))}
              </ol>
            ) : null}
            {shown.tip && (
              <p className="bg-sponge/10 flex gap-2 rounded-lg p-3 text-sm">
                <Lightbulb className="text-sponge-ink mt-0.5 size-4 shrink-0" aria-hidden /> {shown.tip}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Recommendations are generated by AI from the sites in the atlas. Always check conditions and seasons with a
              local dive operator.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
