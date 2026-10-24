// Det kunden och hennes egen AI delar (SP23, 2026-10-24): företagsminnet,
// underlagen, organisationerna och kontakterna. Tabellen är firma_poster
// (migrations/0009). Två läsare: portalen via /api/firma och plattformarna
// via /mcp — båda går genom funktionerna här, så att taken och sammanslagningen
// av minnet är desamma oavsett vem som skriver.

import { nowMs, randomHex } from "./auth/_lib.js";

export const TYPER = ["minne", "underlag", "org", "kontakt"];

// Taken. Inga kostnader för oss per post, men en trasig klient ska inte kunna
// fylla tabellen, och en plattform ska inte kunna klistra in en bok som minne.
export const MINNE_MAX = 20_000;            // tecken — portalens minne är en lista fakta, inte ett arkiv
export const UNDERLAG_MAX = 200_000;        // tecken per underlag (≈ 60 sidor text)
export const UNDERLAG_ANTAL = 100;
export const POSTER_MAX = { underlag: UNDERLAG_ANTAL, org: 1000, kontakt: 2000 };
export const TEAM_MAX_TECKEN = 3_000_000;   // allt delat för ett team, ≈ 3 MB
const FÄLT = { title: 200, namn: 160, typ: 40, roll: 160, org: 80, not: 2000 };

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Formen på en posts data, rensad. Okända fält följer inte med.
export function rensa(typ, d) {
  d = d && typeof d === "object" ? d : {};
  if (typ === "underlag") {
    const text = typeof d.text === "string" ? d.text : "";
    return { title: str(d.title, FÄLT.title) || "Underlag", text: text.slice(0, UNDERLAG_MAX), on: d.on !== false };
  }
  if (typ === "org") return { namn: str(d.namn, FÄLT.namn), typ: str(d.typ, FÄLT.typ), not: str(d.not, FÄLT.not) };
  if (typ === "kontakt") return { namn: str(d.namn, FÄLT.namn), roll: str(d.roll, FÄLT.roll), org: str(d.org, FÄLT.org), not: str(d.not, FÄLT.not) };
  if (typ === "minne") return { text: (typeof d.text === "string" ? d.text : "").slice(0, MINNE_MAX) };
  return null;
}
const giltigtId = (id) => typeof id === "string" && /^[A-Za-z0-9_:.-]{1,80}$/.test(id);
export const nyttId = (prefix) => prefix + randomHex(8);

export async function läsFirma(db, slug) {
  const { results } = await db.prepare(
    "SELECT typ, id, data, updated_at, updated_by FROM firma_poster WHERE team_slug = ?1 ORDER BY updated_at"
  ).bind(slug).all();
  const ut = { minne: { text: "", updatedAt: null, updatedBy: null }, underlag: [], org: [], kontakt: [] };
  for (const r of results || []) {
    let d = {};
    try { d = JSON.parse(r.data) || {}; } catch (_) { d = {}; }
    const meta = { id: r.id, updatedAt: r.updated_at, updatedBy: r.updated_by };
    if (r.typ === "minne") ut.minne = { text: d.text || "", updatedAt: r.updated_at, updatedBy: r.updated_by };
    else if (ut[r.typ]) ut[r.typ].push({ ...d, ...meta });
  }
  return ut;
}

// Minnet slås ihop rad för rad. Portalen skickar texten den sparar och den
// text den senast såg (`bas`); har någon annan — en plattform — skrivit
// emellan, behålls det nya från båda: raderna kunden lagt till kommer med,
// raderna kunden tagit bort försvinner, och plattformens rader står kvar.
export function slåIhopMinne(nuvarande, bas, ny) {
  nuvarande = String(nuvarande || ""); ny = String(ny || "");
  if (bas == null || nuvarande === String(bas)) return ny;
  const rad = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const basR = new Set(rad(String(bas))), nyR = new Set(rad(ny));
  const borttagna = new Set([...basR].filter((r) => !nyR.has(r)));
  const tillagda = rad(ny).filter((r) => !basR.has(r));
  const kvar = nuvarande.split("\n").filter((r) => !borttagna.has(r.trim()));
  const har = new Set(kvar.map((r) => r.trim()));
  const ut = kvar.concat(tillagda.filter((r) => !har.has(r)));
  return ut.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function storlek(db, slug, utom) {
  const r = await db.prepare(
    "SELECT COALESCE(SUM(LENGTH(data)), 0) AS n FROM firma_poster WHERE team_slug = ?1 AND NOT (typ = ?2 AND id = ?3)"
  ).bind(slug, utom.typ, utom.id).first();
  return r ? Number(r.n) : 0;
}

// Sparar minnet. Returnerar { text } eller { fel }.
export async function sparaMinne(db, slug, { text, bas = null, av }) {
  const nu = await db.prepare("SELECT data FROM firma_poster WHERE team_slug = ?1 AND typ = 'minne' AND id = 'text'").bind(slug).first();
  let gammal = "";
  try { gammal = nu ? (JSON.parse(nu.data).text || "") : ""; } catch (_) { gammal = ""; }
  const ihop = slåIhopMinne(gammal, bas, text);
  if (ihop.length > MINNE_MAX) return { fel: `Minnet får vara högst ${MINNE_MAX} tecken. Korta det, eller lägg det långa som ett underlag.` };
  await db.prepare(
    "INSERT INTO firma_poster (team_slug, typ, id, data, updated_at, updated_by) VALUES (?1, 'minne', 'text', ?2, ?3, ?4) " +
    "ON CONFLICT (team_slug, typ, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by"
  ).bind(slug, JSON.stringify({ text: ihop }), nowMs(), av).run();
  return { text: ihop };
}

// Lägger till rader i minnet (det plattformarna gör). Rader som redan står
// där läggs inte till igen.
export async function läggTillMinne(db, slug, rader, av) {
  const nu = await läsFirma(db, slug);
  const har = new Set(nu.minne.text.split("\n").map((r) => r.trim()));
  const nya = rader.map((r) => String(r || "").trim()).filter((r) => r && !har.has(r));
  if (!nya.length) return { text: nu.minne.text, tillagda: 0 };
  const text = (nu.minne.text ? nu.minne.text.replace(/\s+$/, "") + "\n" : "") + nya.join("\n");
  const r = await sparaMinne(db, slug, { text, bas: nu.minne.text, av });
  return r.fel ? r : { ...r, tillagda: nya.length };
}

// Sparar en post (underlag, org, kontakt). Returnerar { post } eller { fel }.
export async function sparaPost(db, slug, typ, id, data, av) {
  if (!["underlag", "org", "kontakt"].includes(typ)) return { fel: "okänd typ" };
  if (!giltigtId(id)) return { fel: "ogiltigt id" };
  const d = rensa(typ, data);
  if ((typ === "org" || typ === "kontakt") && !d.namn) return { fel: "Namnet saknas." };
  if (typ === "underlag" && !d.text.trim()) return { fel: "Underlaget är tomt." };
  const finns = await db.prepare("SELECT 1 AS f FROM firma_poster WHERE team_slug = ?1 AND typ = ?2 AND id = ?3").bind(slug, typ, id).first();
  if (!finns) {
    const n = await db.prepare("SELECT COUNT(*) AS n FROM firma_poster WHERE team_slug = ?1 AND typ = ?2").bind(slug, typ).first();
    if (n && n.n >= POSTER_MAX[typ]) return { fel: `Högst ${POSTER_MAX[typ]} ${typ === "underlag" ? "underlag" : typ === "org" ? "organisationer" : "kontakter"} per team.` };
  }
  const json = JSON.stringify(d);
  if ((await storlek(db, slug, { typ, id })) + json.length > TEAM_MAX_TECKEN) return { fel: "Teamets delade utrymme är fullt. Ta bort underlag ni inte behöver." };
  const t = nowMs();
  await db.prepare(
    "INSERT INTO firma_poster (team_slug, typ, id, data, updated_at, updated_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6) " +
    "ON CONFLICT (team_slug, typ, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by"
  ).bind(slug, typ, id, json, t, av).run();
  return { post: { ...d, id, updatedAt: t, updatedBy: av } };
}

export async function raderaPost(db, slug, typ, id) {
  if (!["underlag", "org", "kontakt"].includes(typ) || !giltigtId(id)) return { fel: "ogiltig post" };
  await db.prepare("DELETE FROM firma_poster WHERE team_slug = ?1 AND typ = ?2 AND id = ?3").bind(slug, typ, id).run();
  // En borttagen organisation lämnar inga kontakter som pekar på ingenting.
  if (typ === "org") {
    const { results } = await db.prepare("SELECT id, data FROM firma_poster WHERE team_slug = ?1 AND typ = 'kontakt'").bind(slug).all();
    for (const r of results || []) {
      let d = {}; try { d = JSON.parse(r.data) || {}; } catch (_) { continue; }
      if (d.org === id) { d.org = ""; await db.prepare("UPDATE firma_poster SET data = ?1 WHERE team_slug = ?2 AND typ = 'kontakt' AND id = ?3").bind(JSON.stringify(d), slug, r.id).run(); }
    }
  }
  return { ok: true };
}
