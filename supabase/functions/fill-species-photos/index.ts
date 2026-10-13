// Finds an openly licensed photo for species that have none and records it
// with its photographer credit, licence and source link.
//
// Sources, in order:
//   1. The species' English Wikipedia lead image, if it is hosted on
//      Wikimedia Commons under CC0, public domain, CC BY or CC BY-SA.
//   2. iNaturalist taxon photos under CC0, CC BY or CC BY-SA.
// Non-commercial (NC) and no-derivatives (ND) licences are never used.
//
// POST { "slugs": ["emperor-angelfish", ...] } (or {} for up to 25 species
// still missing a photo). Add "source": "inaturalist" to skip Wikipedia, e.g.
// to replace a Wikipedia image that showed the wrong species.
// Requires `Authorization: Bearer <token>` matching a row in
// public.maintenance_tokens for the job 'fill-species-photos'; delete that
// row to switch the function off.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const UA = "OpenDiveAtlas/1.0 (https://opendiveatlas.org; species photo import)";
const FREE_COMMONS = /^(cc0|pd|public domain|cc[- ]by(-sa)?[- ]\d)/i;
const INAT_FREE: Record<string, string> = { cc0: "CC0 1.0", "cc-by": "CC BY 4.0", "cc-by-sa": "CC BY-SA 4.0" };

type Found = { url: string; attribution: string; license: string; sourceUrl: string; via: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function getJson(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const stripHtml = (s: string) =>
  s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();

/** "(c) Jane Doe, some rights reserved (CC BY)" -> "Jane Doe"; drops wiki "(talk)"-style links. */
const cleanCredit = (s: string) =>
  s
    .replace(/^\(c\)\s*/i, "")
    .replace(/,?\s*(some|all|no) rights reserved.*$/i, "")
    .replace(/\s*\((talk|uploads|contribs)\)/gi, "")
    .replace(/^(Unknown author)+$/i, "Unknown author")
    .replace(/\s+/g, " ")
    .trim();

async function fromWikipedia(titles: string[]): Promise<Found | null> {
  for (const title of titles) {
    const q = await getJson(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=name&titles=${encodeURIComponent(title)}`,
    );
    const page = Object.values(q?.query?.pages ?? {})[0] as { pageimage?: string; missing?: string } | undefined;
    const file = page?.pageimage;
    if (!file || /\.svg$/i.test(file) || /(map|range|distribution|diagram)/i.test(file)) continue;

    // Only accept files hosted on Commons (local enwiki files may be non-free).
    const c = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&titles=File:${encodeURIComponent(file)}`,
    );
    const info = (Object.values(c?.query?.pages ?? {})[0] as { missing?: string; imageinfo?: { extmetadata?: Record<string, { value: string }> }[] })
      ?.imageinfo?.[0];
    const meta = info?.extmetadata;
    if (!meta) continue;
    const license = stripHtml(meta.LicenseShortName?.value ?? "");
    const code = meta.License?.value ?? "";
    if (/(^|[^a-z])n[cd]([^a-z]|$)/i.test(`${license} ${code}`)) continue; // NC / ND
    if (!FREE_COMMONS.test(code) && !FREE_COMMONS.test(license)) continue;
    const artist = cleanCredit(stripHtml(meta.Artist?.value ?? "")) || "Unknown";
    const name = file.replace(/ /g, "_");
    return {
      url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=1280`,
      attribution: `${artist} / Wikimedia Commons`.slice(0, 500),
      license: license.slice(0, 120) || "See source",
      sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name)}`,
      via: "wikipedia",
    };
  }
  return null;
}

async function fromINaturalist(scientificName: string): Promise<Found | null> {
  const search = await getJson(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&rank=species&per_page=10`,
  );
  const taxon = (search?.results ?? []).find(
    (t: { name?: string }) => t.name?.toLowerCase() === scientificName.toLowerCase(),
  );
  if (!taxon) return null;
  const detail = await getJson(`https://api.inaturalist.org/v1/taxa/${taxon.id}`);
  const photos = (detail?.results?.[0]?.taxon_photos ?? []).map((tp: { photo: unknown }) => tp.photo) as {
    id: number;
    url?: string;
    license_code?: string | null;
    attribution?: string;
  }[];
  const photo = photos.find((p) => p.license_code && INAT_FREE[p.license_code] && p.url);
  if (!photo) return null;
  return {
    url: photo.url!.replace(/\/(square|small|thumb|medium)\./, "/large."),
    attribution: `${cleanCredit(photo.attribution ?? "") || "Unknown"} / iNaturalist`.slice(0, 500),
    license: INAT_FREE[photo.license_code!],
    sourceUrl: `https://www.inaturalist.org/photos/${photo.id}`,
    via: "inaturalist",
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const { data: ok } = await admin
    .from("maintenance_tokens")
    .select("job")
    .eq("job", "fill-species-photos")
    .eq("token", token)
    .maybeSingle();
  if (!token || !ok) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const slugs: string[] = Array.isArray(body?.slugs) ? body.slugs.slice(0, 60) : [];
  const iNatOnly = body?.source === "inaturalist";

  const { data: withPhoto } = await admin.from("photos").select("species_id").not("species_id", "is", null).eq("status", "approved");
  const covered = new Set((withPhoto ?? []).map((r) => r.species_id));
  let q = admin.from("species").select("id, slug, common_name, scientific_name").order("common_name");
  if (slugs.length) q = q.in("slug", slugs);
  const { data: species, error } = await q;
  if (error) return json({ error: error.message }, 500);
  const todo = (species ?? []).filter((s) => !covered.has(s.id)).slice(0, slugs.length ? 60 : 25);

  const results: Record<string, string> = {};
  for (const s of todo) {
    try {
      const found =
        (iNatOnly ? null : await fromWikipedia([s.scientific_name])) ?? (await fromINaturalist(s.scientific_name));
      if (!found) {
        results[s.slug] = "none";
        continue;
      }
      const { error: insertError } = await admin.from("photos").insert({
        external_url: found.url,
        species_id: s.id,
        caption: s.common_name,
        attribution: found.attribution,
        license: found.license,
        source_url: found.sourceUrl,
        uploaded_by: null,
        status: "approved",
      });
      results[s.slug] = insertError ? `error: ${insertError.message}` : found.via;
    } catch (e) {
      results[s.slug] = `error: ${(e as Error).message}`.slice(0, 200);
    }
  }
  const counts = Object.values(results).reduce<Record<string, number>>((acc, v) => {
    const k = v.startsWith("error") ? "error" : v;
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  return json({ processed: todo.length, counts, results });
});
