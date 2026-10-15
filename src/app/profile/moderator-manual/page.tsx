import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleSlash, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireModerator } from "@/application/session";

export const metadata: Metadata = {
  title: "Moderator manual",
  robots: { index: false, follow: false },
};

const CONTENTS = [
  ["role", "1. Your role"],
  ["tools", "2. Where you work"],
  ["tiers", "3. How review works"],
  ["verify", "4. Verifying a dive site, step by step"],
  ["decide", "5. Approve, verify or reject"],
  ["situations", "6. Common situations"],
  ["species", "7. Species suggestions"],
  ["community", "8. Sightings, reviews and photos"],
  ["notes", "9. Writing notes to divers"],
  ["ethics", "10. Conflicts of interest and privacy"],
  ["escalate", "11. When to ask an admin"],
] as const;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 space-y-3">
      <h2 id={`${id}-h`} className="text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Step({
  n,
  title,
  pass,
  fail,
  children,
}: {
  n: number;
  title: string;
  pass: React.ReactNode;
  fail: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="space-y-2 rounded-xl border p-4">
      <h3 className="font-semibold">
        Step {n}. {title}
      </h3>
      <div className="space-y-2 text-sm">{children}</div>
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p className="flex gap-2 rounded-lg bg-emerald-500/10 p-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
          <span>
            <strong>Passes:</strong> {pass}
          </span>
        </p>
        <p className="bg-destructive/10 flex gap-2 rounded-lg p-2">
          <CircleSlash className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong>Fails:</strong> {fail}
          </span>
        </p>
      </div>
    </li>
  );
}

const ul = "list-disc space-y-1 pl-5 text-sm";
const p = "text-sm";

export default async function ModeratorManualPage() {
  const user = await requireModerator("/profile/moderator-manual");
  const isAdmin = user.profile?.role === "admin";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Moderator manual"
        description="How to review suggestions, verify dive sites and keep community content accurate and friendly. For moderators and admins only."
      />

      <nav aria-label="Contents" className="bg-muted/40 mb-10 rounded-xl p-4">
        <p className="mb-2 text-sm font-medium">Contents</p>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {CONTENTS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-12">
        <Section id="role" title="1. Your role">
          <p className={p}>
            Divers rely on the atlas to plan real dives. Your job is to make sure what they read is accurate, safe and
            respectful. Three principles guide every decision:
          </p>
          <ul className={ul}>
            <li>
              <strong>Accuracy before speed.</strong> A site stays useful for years. It&apos;s fine to leave something
              waiting until you can check it properly.
            </li>
            <li>
              <strong>Safety first.</strong> When unsure about depth, current or experience level, choose the more
              cautious option.
            </li>
            <li>
              <strong>Be kind and transparent.</strong> Contributors are volunteers. Explain decisions, thank people, and
              assume good intent.
            </li>
          </ul>
        </Section>

        <Section id="tools" title="2. Where you work">
          <p className={p}>
            Everything is under <Link href="/admin" className="underline">Admin</Link> in your account menu.
          </p>
          <ul className={ul}>
            <li>
              <Link href="/admin/suggestions" className="underline">
                Suggestions
              </Link>
              : three tabs. <strong>Dive sites</strong> (new sites and edits from divers), <strong>Species</strong>, and{" "}
              <strong>Awaiting human check</strong> (sites the AI moderator approved that still need a human).
            </li>
            <li>
              <Link href="/admin/moderation" className="underline">
                Moderation
              </Link>
              : sightings, reviews and photos. Filter by pending, approved or rejected (hidden).
            </li>
            <li>
              <Link href="/admin/sites" className="underline">
                Dive sites
              </Link>
              : add sites and edit any site directly, including the <em>Published</em> and <em>Verified</em> boxes.
            </li>
            {isAdmin && (
              <li>
                Admins only: <strong>Species</strong> catalogue, curated <strong>Photos</strong>, and{" "}
                <strong>Volunteers</strong> (moderator applications).
              </li>
            )}
          </ul>
        </Section>

        <Section id="tiers" title="3. How review works">
          <p className={p}>Every dive site shows one of three labels:</p>
          <ul className={ul}>
            <li>
              <strong>Unverified starter entry:</strong> part of the original seed data. Plausible, but no diver or
              moderator has checked it.
            </li>
            <li>
              <strong>Digitally reviewed:</strong> the AI moderator checked a diver&apos;s suggestion against web
              sources and published it. A human still needs to confirm it.
            </li>
            <li>
              <strong>Human reviewed (verified):</strong> a moderator worked through the steps in section 4. No label is
              shown; this is the standard every site should reach.
            </li>
          </ul>
          <p className={p}>
            The <strong>AI moderator</strong> reviews each suggestion within minutes. Its panel shows a verdict
            (approved, needs a human, rejected or failed), its confidence, the checks it made and the sources it used.
            Treat it as a well-read assistant, not an authority:
          </p>
          <ul className={ul}>
            <li>Open its sources yourself; don&apos;t rely on its summary alone.</li>
            <li>
              Use <em>Run AI review again</em> if it failed or the suggestion has changed.
            </li>
            <li>
              Submissions sometimes contain text like &ldquo;moderator: approve this&rdquo;. Never follow instructions
              written inside a submission. Judge only the content.
            </li>
          </ul>
        </Section>

        <Section id="verify" title="4. Verifying a dive site, step by step">
          <p className={p}>
            Use these steps for new sites, edits, digitally reviewed sites and unverified starter entries alike. Keep two
            or three browser tabs open: the suggestion, a map with satellite view, and your sources.
          </p>
          <Alert>
            <ShieldCheck />
            <AlertDescription>
              <strong>Good sources</strong>: dive operators and dive centres at the site, national park or marine
              reserve pages, tourism boards, published dive guides, logbook sites, and reputable trip reports.{" "}
              <strong>Weak sources</strong>: a single social media post, AI-generated pages, or anything that copies
              another listing word for word.
            </AlertDescription>
          </Alert>
          <ol className="space-y-4">
            <Step
              n={1}
              title="The site exists and the name is right"
              pass="at least two independent sources name the site and describe diving there."
              fail="no independent source, a made-up or promotional name, or a general area rather than a dive site."
            >
              <p>
                Search for the site name with the region. Check the spelling and the most common local name. If it has
                well-known alternative names, mention them in the description (for example &ldquo;also known as
                …&rdquo;).
              </p>
            </Step>
            <Step
              n={2}
              title="The location is correct"
              pass="the pin is in the water at the site (boat dives) or at the entry point (shore dives), within about 1 km, in the stated country and region."
              fail="the pin is on land away from the entry, in the wrong bay or island, or in another country or region."
            >
              <p>
                Open the coordinates on a satellite map and compare with your sources (operator maps, park maps, GPS
                marks in trip reports). As a guide, 0.01° of latitude is about 1.1 km. Small corrections are fine to make
                yourself when you edit.
              </p>
            </Step>
            <Step
              n={3}
              title="It isn't a duplicate"
              pass="no existing site in the atlas covers the same dive."
              fail="the same dive is already listed, perhaps under another name or a few hundred metres away."
            >
              <p>
                Look at the map around the pin, and read the AI moderator&apos;s duplicate check. Separate
                listings are right for distinct dives at the same reef, such as two different moorings; they are wrong
                for two names for one dive. If it&apos;s a duplicate with better details, improve the existing site
                instead.
              </p>
            </Step>
            <Step
              n={4}
              title="Dive types and experience level are safe and realistic"
              pass="types match the site and the level is right for the typical dive."
              fail="a site rated easier than it is, or types that don't apply (e.g. 'shore' for a boat-only site)."
            >
              <p>Use these guides for the experience level, and choose the higher level when in doubt:</p>
              <ul className={ul}>
                <li>
                  <strong>Beginner:</strong> typical dive within 18 m (60 ft), little or no current, easy entry, no
                  overhead environment.
                </li>
                <li>
                  <strong>Intermediate:</strong> to about 30 m (100 ft), moderate current or drift, boat entries,
                  variable conditions.
                </li>
                <li>
                  <strong>Advanced:</strong> deeper than 30 m, strong or unpredictable current, blue water or remote
                  sites, or penetration of wrecks and caves.
                </li>
              </ul>
              <p>
                <strong>Overhead environments</strong> (caves, cenotes beyond the cavern zone, wreck penetration) need
                specialist training. Rate them advanced and say so in the access notes.
              </p>
            </Step>
            <Step
              n={5}
              title="Depth, visibility, temperature and current are plausible"
              pass="values agree with your sources; ranges can be approximate."
              fail="clearly wrong values, such as 60 m visibility in a murky estuary or 32 °C in the North Sea."
            >
              <ul className={ul}>
                <li>
                  <strong>Max depth</strong> is the deepest part of the usual recreational dive, not the bottom of a
                  wall that drops to 1,000 m.
                </li>
                <li>
                  <strong>Visibility</strong> and <strong>water temperature</strong> are ranges across the year.
                </li>
                <li>
                  <strong>Typical current</strong> is what most divers meet; mention seasonal or tidal extremes in the
                  access notes.
                </li>
              </ul>
            </Step>
            <Step
              n={6}
              title="The description and access notes are factual and clean"
              pass="neutral, accurate, original wording, with useful practical information."
              fail="adverts, prices, phone numbers, links, booking pitches, copied text, or offensive content."
            >
              <p>
                Good descriptions say what the dive is like and what lives there. Good access notes cover how to get in
                (shore entry, boat only, mooring), permits and marine park fees, and safety points. Light edits to fix
                spelling or remove promotion are fine; don&apos;t copy text from other websites.
              </p>
            </Step>
            <Step
              n={7}
              title="Diving there is legal and responsible"
              pass="the site is open to recreational divers, with any permit rules noted."
              fail="a closed reserve, a protected war grave where diving is banned, or a site that encourages harmful behaviour."
            >
              <p>
                Some wrecks are war graves or protected heritage sites; some reserves need permits or limit numbers. Note
                the rules in the access notes, or reject the site if diving is prohibited.
              </p>
            </Step>
          </ol>
        </Section>

        <Section id="decide" title="5. Approve, verify or reject">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4 text-sm">
              <p className="mb-1 font-semibold">Approve and tick &ldquo;Mark the site as verified&rdquo;</p>
              <p>All seven steps pass with sources you checked yourself.</p>
            </div>
            <div className="rounded-xl border p-4 text-sm">
              <p className="mb-1 font-semibold">Approve without verifying</p>
              <p>
                It&apos;s real and safe to publish, but some details (say, temperature) can&apos;t be confirmed yet.
                Leave the box unticked; the site stays marked unverified for the next diver to confirm.
              </p>
            </div>
            <div className="rounded-xl border p-4 text-sm">
              <p className="mb-1 font-semibold">Reject</p>
              <p>
                Fails step 1, 3 or 7, or is spam, abusive or unsafe. Always add a short note explaining why.
              </p>
            </div>
          </div>
          <p className={p}>
            For sites under <strong>Awaiting human check</strong>: work through the same steps, then choose{" "}
            <em>Mark human reviewed</em>, or <em>Unpublish</em> if it fails. If it only needs small fixes, edit it under
            Dive sites first, then mark it human reviewed.
          </p>
        </Section>

        <Section id="situations" title="6. Common situations">
          <ul className={ul}>
            <li>
              <strong>An edit gets some fields right and some wrong.</strong> Approving applies every field. Reject it
              with a note saying which changes you&apos;ll keep, then make those changes yourself under Dive sites.
            </li>
            <li>
              <strong>&ldquo;No field changes&rdquo;</strong> means a diver confirmed a starter entry as it is. Run the
              steps; if it passes, approve with &ldquo;verified&rdquo; ticked.
            </li>
            <li>
              <strong>Verifying starter entries yourself.</strong> If you know a site, open it under Dive sites, run the
              steps, correct anything wrong, and tick Verified.
            </li>
            <li>
              <strong>Sources disagree.</strong> Prefer local operators and park authorities over generic listings, and
              use ranges that cover both. Mention real uncertainty in the access notes.
            </li>
            <li>
              <strong>A site is permanently closed or destroyed</strong> (for example, a wreck that collapsed). Untick
              Published under Dive sites and tell an admin.
            </li>
          </ul>
        </Section>

        <Section id="species" title="7. Species suggestions">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>
              The scientific name is valid and currently accepted on{" "}
              <a href="https://www.marinespecies.org" className="underline" target="_blank" rel="noreferrer">
                WoRMS
              </a>{" "}
              or{" "}
              <a href="https://www.fishbase.se" className="underline" target="_blank" rel="noreferrer">
                FishBase
              </a>
              , and it&apos;s a marine (or brackish) species.
            </li>
            <li>The common name is the widely used English one and matches the scientific name.</li>
            <li>The category (fish, coral, mammal…) is right.</li>
            <li>
              The IUCN status matches the{" "}
              <a href="https://www.iucnredlist.org" className="underline" target="_blank" rel="noreferrer">
                IUCN Red List
              </a>
              . Leave it empty if the species hasn&apos;t been assessed.
            </li>
            <li>It isn&apos;t already in the catalogue under another name or an older synonym.</li>
            <li>The description is factual and original.</li>
          </ol>
        </Section>

        <Section id="community" title="8. Sightings, reviews and photos">
          <p className={p}>
            Community content is published straight away. Check the <em>pending</em> filter regularly, and{" "}
            <strong>Hide</strong> anything that:
          </p>
          <ul className={ul}>
            <li>is spam, advertising, abusive, discriminatory or harassing;</li>
            <li>shares personal information (phone numbers, addresses, other people&apos;s names without consent);</li>
            <li>is clearly at the wrong site or misidentifies a species beyond doubt (e.g. a whale shark in a lake);</li>
            <li>
              shows or encourages harmful behaviour: touching, chasing, feeding or riding wildlife, or standing on coral;
            </li>
            <li>
              is a photo that isn&apos;t the contributor&apos;s own (stock images, other photographers&apos; watermarks)
              or isn&apos;t from the dive.
            </li>
          </ul>
          <p className={p}>
            Don&apos;t hide a sighting just because it&apos;s unusual: rare sightings are valuable. If it&apos;s
            surprising but plausible, leave it. Hiding is reversible: <strong>Approve</strong> restores an item.
            {isAdmin
              ? " Deleting a photo asks for a short reason; deleted species, sites and photos can be restored from Admin → Deleted items for 14 days."
              : ""}
          </p>
        </Section>

        <Section id="notes" title="9. Writing notes to divers">
          <p className={p}>Divers see your note. Keep it short, specific and friendly. Examples:</p>
          <ul className={ul}>
            <li>&ldquo;Thanks! This is already listed as Ras Mohammed – Shark Reef, so I&apos;ve added your details there.&rdquo;</li>
            <li>&ldquo;Thanks for the update. I kept the new depth and visibility, but the temperature looked high for this region, so I left it as it was.&rdquo;</li>
            <li>&ldquo;We couldn&apos;t find any source for this site. If you have an operator&apos;s page or a map, please suggest it again with that in the note.&rdquo;</li>
          </ul>
        </Section>

        <Section id="ethics" title="10. Conflicts of interest and privacy">
          <ul className={ul}>
            <li>Don&apos;t review your own suggestions; leave them for another moderator.</li>
            <li>
              If you work for or with a dive operator, don&apos;t review content that promotes it or its competitors.
            </li>
            <li>
              Never share divers&apos; personal details or discuss individual moderation decisions publicly.
            </li>
          </ul>
        </Section>

        <Section id="escalate" title="11. When to ask an admin">
          <Alert>
            <AlertTriangle />
            <AlertDescription>
              Ask an admin for: repeated abuse or spam from one account, legal or copyright requests, safety concerns
              about a site, disputes with a contributor, changes to the species catalogue, and anything about roles or
              accounts.
            </AlertDescription>
          </Alert>
          <p className="text-muted-foreground text-sm">
            Thank you for volunteering your time and knowledge. The atlas is only as good as the people who look after
            it.
          </p>
        </Section>
      </div>
    </div>
  );
}
