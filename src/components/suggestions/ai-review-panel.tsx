import { Bot, CheckCircle2, CircleHelp, ExternalLink, XCircle } from "lucide-react";
import { SubmitButton } from "@/components/shared/submit-button";
import type { AiReview } from "@/domain/entities";
import { runAiReviewAction } from "@/application/actions/site-suggestions";
import { cn } from "@/lib/utils";

const STATUS = {
  approved: { label: "AI approved", className: "border-reef/50 bg-reef/10" },
  needs_human: { label: "AI: needs a human", className: "border-sponge/60 bg-sponge/10" },
  rejected: { label: "AI rejected", className: "border-destructive/40 bg-destructive/5" },
  failed: { label: "AI review failed", className: "border-border bg-muted" },
} as const;

const RESULT_ICON = { pass: CheckCircle2, fail: XCircle, unclear: CircleHelp };

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** The AI moderator's verdict on a suggestion, with a button to (re)run it. */
export function AiReviewPanel({
  review,
  kind,
  id,
  pending,
  enabled,
}: {
  review: AiReview | null;
  kind: "site" | "species";
  id: string;
  pending: boolean;
  enabled: boolean;
}) {
  const rerun = enabled && pending && (!review || review.status === "failed" || review.status === "needs_human");
  return (
    <div className={cn("space-y-2 rounded-lg border p-3 text-sm", review ? STATUS[review.status].className : "border-dashed")}>
      <div className="flex flex-wrap items-center gap-2">
        <Bot className="size-4" aria-hidden />
        <span className="font-medium">{review ? STATUS[review.status].label : pending ? "AI review not run yet" : "No AI review"}</span>
        {review?.confidence != null && review.status !== "failed" && (
          <span className="text-muted-foreground text-xs">confidence {Math.round(review.confidence * 100)}%</span>
        )}
        {rerun && (
          <form action={runAiReviewAction} className="ml-auto">
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="id" value={id} />
            <SubmitButton size="sm" variant="outline" pendingLabel="Reviewing… (about a minute)">
              {review ? "Run AI review again" : "Run AI review"}
            </SubmitButton>
          </form>
        )}
      </div>
      {review?.summary && <p className="whitespace-pre-line">{review.summary}</p>}
      {review && review.checks.length > 0 && (
        <ul className="space-y-1">
          {review.checks.map((c, i) => {
            const Icon = RESULT_ICON[c.result] ?? CircleHelp;
            return (
              <li key={i} className="flex gap-1.5 text-xs">
                <Icon
                  className={cn(
                    "mt-0.5 size-3.5 shrink-0",
                    c.result === "pass" ? "text-reef" : c.result === "fail" ? "text-destructive" : "text-muted-foreground",
                  )}
                  aria-label={c.result}
                />
                <span>
                  <span className="font-medium">{c.check}</span>
                  {c.note && <span className="text-muted-foreground">: {c.note}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {review && review.sources.length > 0 && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {review.sources.map((url) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer noopener" className="text-wall inline-flex items-center gap-1 hover:underline">
                {host(url)} <ExternalLink className="size-3" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
