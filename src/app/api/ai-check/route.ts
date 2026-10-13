import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { AI_MODEL, createAnonSupabase, getAnthropic, isAiConfigured } from "@/infrastructure/ai/client";
import { runAiReview } from "@/infrastructure/ai/moderator";
import { recommendSites } from "@/infrastructure/ai/recommender";
import { searchDiveSites } from "@/infrastructure/repositories/dive-sites";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function tokenOk(given: string | null): boolean {
  const expected = process.env.AI_REVIEW_TOKEN;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Preview-only diagnostics for the AI features: checks Claude access
 * (federation or API key) and can run one recommendation or AI review.
 * Requires ?token=<AI_REVIEW_TOKEN>. Disabled in production.
 */
export async function GET(request: Request) {
  if (process.env.VERCEL_ENV === "production") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const url = new URL(request.url);
  if (!tokenOk(url.searchParams.get("token"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const credential = process.env.ANTHROPIC_API_KEY ? "api_key" : isAiConfigured() ? "federation" : "none";
  const test = url.searchParams.get("test") ?? "ping";
  const started = Date.now();
  try {
    if (test === "ping") {
      const res = await getAnthropic().messages.create({
        model: AI_MODEL,
        max_tokens: 64,
        output_config: { effort: "low" },
        messages: [{ role: "user", content: "Reply with the single word: ok" }],
      });
      const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      return NextResponse.json({ ok: true, credential, test, reply: text, usage: res.usage, ms: Date.now() - started });
    }
    if (test === "claims") {
      // Shows the identity-token claims Anthropic will see (never the token itself).
      const { getVercelOidcToken } = await import("@vercel/oidc");
      const { randomUUID } = await import("node:crypto");
      const decode = (t: string) => JSON.parse(Buffer.from(t.split(".")[1]!, "base64url").toString("utf8"));
      const pick = (c: Record<string, unknown>) => ({
        iss: c.iss, sub: c.sub, aud: c.aud, has_jti: "jti" in c,
        lifetime_s: typeof c.exp === "number" && typeof c.iat === "number" ? c.exp - c.iat : null,
      });
      const plain = decode(await getVercelOidcToken());
      const exchanged = decode(
        await getVercelOidcToken({ audience: "https://api.anthropic.com", jti: randomUUID(), skipCache: true }),
      );
      return NextResponse.json({ ok: true, credential, test, default_token: pick(plain), anthropic_token: pick(exchanged) });
    }
    if (test === "recommend") {
      const q = url.searchParams.get("q") ?? "Warm water, turtles and sharks for a beginner in winter";
      const sites = await searchDiveSites(createAnonSupabase() as never);
      const r = await recommendSites(q, sites);
      return NextResponse.json({
        ok: true,
        credential,
        test,
        intro: r.intro,
        picks: r.picks.map((p) => ({ slug: p.site.slug, reason: p.reason })),
        tip: r.tip,
        ms: Date.now() - started,
      });
    }
    if (test === "review") {
      const kind = url.searchParams.get("kind") === "species" ? "species" : "site";
      const id = url.searchParams.get("id") ?? "";
      const result = await runAiReview(kind, id);
      return NextResponse.json({ ok: true, credential, test, result, ms: Date.now() - started });
    }
    return NextResponse.json({ error: "Unknown test" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, credential, test, error: (e as Error).message, ms: Date.now() - started },
      { status: 500 },
    );
  }
}
