// Sends Top Contributor Moderator invitation emails via Resend.
//
// Invitations are created in the database (see migration
// 20261013000013_top_contributors.sql). The app calls this function after a
// moderator approves a suggestion; it emails every invitation that has not
// been emailed yet. Each invitation is claimed atomically before sending, so
// concurrent calls never send the same email twice.
//
// Callers: a signed-in moderator/admin (user JWT), or the AI moderator using
// the 'ai-review' token from public.maintenance_tokens.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY      required to send; without it the function does nothing
//   INVITE_FROM_EMAIL   optional, default "OpenDive Atlas <invites@opendiveatlas.org>"
//   SITE_URL            optional, default "https://opendiveatlas.org"
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function emailHtml(name: string, approved: number, link: string) {
  return `<!doctype html>
<html><body style="margin:0;background:#fbf7f0;font-family:Poppins,Arial,sans-serif;color:#0d1129">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden">
        <tr><td style="background:#13497f;color:#fff6ea;padding:28px 32px">
          <p style="margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#5cc3f0">OpenDive Atlas</p>
          <h1 style="margin:8px 0 0;font-size:26px;line-height:1.2;color:#f79a6b">You're a Top Contributor</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;font-size:15px;line-height:1.6">
          <p style="margin:0 0 16px">Hi ${escape(name)},</p>
          <p style="margin:0 0 16px">Moderators have approved <strong>${approved} new dive sites</strong> you added to the atlas. Thank you! That puts you among our top contributors.</p>
          <p style="margin:0 0 16px">We'd like to invite you to become a <strong>Top Contributor Moderator</strong>. You'll get a squirrelfish badge on your avatar and moderator access: reviewing site suggestions from other divers, adding and editing dive sites, and keeping community sightings and reviews tidy.</p>
          <p style="margin:24px 0"><a href="${link}" style="display:inline-block;background:#f79a6b;color:#0d1129;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">Review and accept the invitation</a></p>
          <p style="margin:0;font-size:13px;color:#56607a">You'll be asked to sign in, then confirm. If you'd rather not, just ignore this email. The invitation stays on your profile page.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Only signed-in moderators/admins, or the AI moderator (with its job
  // token from public.maintenance_tokens), may trigger a send.
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);
  const { data: aiJob } = await admin
    .from("maintenance_tokens")
    .select("job")
    .eq("job", "ai-review")
    .eq("token", token)
    .maybeSingle();
  if (!aiJob) {
    const { data: caller } = await admin.auth.getUser(token);
    if (!caller.user) return json({ error: "Unauthorized" }, 401);
    const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", caller.user.id).maybeSingle();
    if (!callerProfile || callerProfile.role === "user") return json({ error: "Forbidden" }, 403);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json({ sent: 0, skipped: "RESEND_API_KEY is not set" });
  const from = Deno.env.get("INVITE_FROM_EMAIL") ?? "OpenDive Atlas <invites@opendiveatlas.org>";
  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://opendiveatlas.org").replace(/\/$/, "");

  // Claim unsent invitations so a concurrent call can't send them again.
  const { data: invites, error } = await admin
    .from("contributor_invites")
    .update({ email_sent_at: new Date().toISOString() })
    .is("email_sent_at", null)
    .eq("status", "pending")
    .select("id, user_id, approved_sites");
  if (error) return json({ error: error.message }, 500);

  let sent = 0;
  const failed: string[] = [];
  for (const invite of invites ?? []) {
    try {
      const [{ data: user }, { data: profile }] = await Promise.all([
        admin.auth.admin.getUserById(invite.user_id),
        admin.from("profiles").select("username, display_name").eq("id", invite.user_id).maybeSingle(),
      ]);
      const to = user.user?.email;
      if (!to) throw new Error("no email address");
      const name = profile?.display_name || profile?.username || "diver";
      const link = `${siteUrl}/contributor/invite/${invite.id}`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to,
          subject: "You're invited to be a Top Contributor Moderator",
          html: emailHtml(name, invite.approved_sites, link),
          text: `Hi ${name},\n\nModerators have approved ${invite.approved_sites} new dive sites you added to OpenDive Atlas. We'd like to invite you to become a Top Contributor Moderator, with a badge on your avatar and moderator access.\n\nReview and accept: ${link}\n`,
        }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
      sent++;
    } catch (e) {
      console.error(`invite ${invite.id}:`, e);
      failed.push(invite.id);
      // Release the claim so the next call retries.
      await admin.from("contributor_invites").update({ email_sent_at: null }).eq("id", invite.id);
    }
  }
  return json({ sent, failed: failed.length });
});
