// Kopplingen till kundens egen AI (SP21) — OAuth-servern, MCP-servern och
// portalens jobbrutter, körda mot en RIKTIG SQLite-databas byggd ur
// migrations/. Inte en hemsnickrad låtsasdatabas: en sådan svarar på vilka
// tabell- och kolumnnamn som helst, så ett felstavat namn hade passerat
// testet och fallerat i drift.
//
// node:sqlite finns i Node 22.5+ (CI kör 22+). D1-ytan som används —
// prepare().bind().first()/all()/run() — är tunn nog att efterlikna här.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { sha256Hex } from "../functions/api/auth/_lib.js";
import { pkceChallenge, redirectMatches, redirectOk } from "../functions/api/_koppling.js";
import * as authorize from "../functions/oauth/authorize.js";
import * as token from "../functions/oauth/token.js";
import * as register from "../functions/oauth/register.js";
import * as mcp from "../functions/mcp.js";
import * as asMeta from "../functions/.well-known/oauth-authorization-server.js";
import * as prMeta from "../functions/.well-known/oauth-protected-resource/[[rest]].js";
import * as jobb from "../functions/api/jobb/index.js";
import * as handling from "../functions/api/jobb/handling.js";

const O = "https://mittaiteam.se";
const CLAUDE_CB = "https://claude.ai/api/mcp/auth_callback";

function d1() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  for (const f of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) {
    db.exec(readFileSync("migrations/" + f, "utf8"));
  }
  const norm = (a) => a.map((v) => (v === undefined ? null : v));
  return {
    raw: db,
    prepare(sql) {
      let args = [];
      const st = {
        bind(...a) { args = norm(a); return st; },
        async first(col) {
          const r = db.prepare(sql).get(...args);
          if (r === undefined) return null;
          return col ? r[col] : { ...r };
        },
        async all() { return { results: db.prepare(sql).all(...args).map((r) => ({ ...r })) }; },
        async run() { const i = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(i.changes) } }; },
      };
      return st;
    },
  };
}

const TEAM_CFG = {
  company: "Rönnbergs Bygg",
  agents: [
    { id: "vd-assistent", name: "Robin", role: "VD-assistent", system: "Du är Robin, VD-assistent hos Rönnbergs Bygg." },
    { id: "offert", name: "Offertskrivaren", role: "Specialist", system: "Du skriver offerter som en privatperson förstår." },
  ],
};
const SLUG = "aaaaaaaaaaaaaaaaaaaaaa";
const SLUG2 = "bbbbbbbbbbbbbbbbbbbbbb";

async function värld({ plan = "standard" } = {}) {
  const db = d1();
  const t = Date.now();
  const r = db.raw;
  r.prepare("INSERT INTO users (id, email, created_at) VALUES ('u1','kim@ronnbergs.se',?), ('u2','annan@firma.se',?)").run(t, t);
  r.prepare("INSERT INTO teams (slug, config, tier, created_at, plan) VALUES (?,?, 'self-serve', ?, ?), (?,?, 'self-serve', ?, 'standard')")
    .run(SLUG, JSON.stringify(TEAM_CFG), t, plan, SLUG2, JSON.stringify({ company: "Annan AB", agents: [{ id: "x", name: "X", system: "x" }] }), t);
  r.prepare("INSERT INTO team_access (team_slug, user_id, role, created_at) VALUES (?, 'u1', 'owner', ?), (?, 'u2', 'owner', ?)").run(SLUG, t, SLUG2, t);
  const kakor = {};
  for (const u of ["u1", "u2"]) {
    const tok = "sess_" + u;
    r.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?,?,?,?)").run(await sha256Hex(tok), u, t + 1e9, t);
    kakor[u] = "atb_session=" + tok;
  }
  return { db, env: { DB: db }, kakor };
}

const req = (path, init = {}) => new Request(O + path, init);
const form = (o) => new URLSearchParams(o).toString();

async function registrera(env, uris = [CLAUDE_CB]) {
  const res = await register.onRequestPost({ request: req("/oauth/register", { method: "POST", body: JSON.stringify({ redirect_uris: uris, client_name: "Claude" }) }), env });
  assert.equal(res.status, 201);
  return (await res.json()).client_id;
}

// Hela vägen: samtycke → kod → nycklar. Returnerar åtkomstnyckeln.
async function koppla(env, kaka, clientId, { verifier = "v".repeat(50), state = "st8" } = {}) {
  const p = {
    response_type: "code", client_id: clientId, redirect_uri: CLAUDE_CB,
    code_challenge: await pkceChallenge(verifier), code_challenge_method: "S256", state, scope: "jobb", resource: O + "/mcp",
  };
  const sida = await authorize.onRequestGet({ request: req("/oauth/authorize?" + form(p), { headers: { cookie: kaka } }), env });
  assert.equal(sida.status, 200);
  const html = await sida.text();
  const csrf = /name="csrf" value="([0-9a-f]+)"/.exec(html)[1];
  const post = await authorize.onRequestPost({
    request: req("/oauth/authorize", { method: "POST", headers: { cookie: kaka, origin: O, "content-type": "application/x-www-form-urlencoded" }, body: form({ ...p, csrf, svar: "ja" }) }),
    env,
  });
  assert.equal(post.status, 303);
  const tillbaka = new URL(post.headers.get("location"));
  assert.equal(tillbaka.origin + tillbaka.pathname, CLAUDE_CB);
  assert.equal(tillbaka.searchParams.get("state"), state);
  assert.equal(tillbaka.searchParams.get("iss"), O);
  const code = tillbaka.searchParams.get("code");
  const tok = await token.onRequestPost({
    request: req("/oauth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: CLAUDE_CB, client_id: clientId }) }),
    env,
  });
  assert.equal(tok.status, 200);
  return { ...(await tok.json()), code, verifier };
}

let rpcId = 0;
async function rpc(env, access, method, params) {
  const res = await mcp.onRequestPost({
    request: req("/mcp", { method: "POST", headers: { authorization: "Bearer " + access, "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", ...(method.startsWith("notifications/") ? {} : { id: ++rpcId }), method, params }) }),
    env,
  });
  return { status: res.status, body: res.status === 202 ? null : await res.json(), headers: res.headers };
}
const verktyg = async (env, access, name, args) => (await rpc(env, access, "tools/call", { name, arguments: args })).body.result;

async function nyttJobb(env, kaka, extra = {}) {
  const res = await jobb.onRequestPost({
    request: req("/api/jobb", { method: "POST", headers: { cookie: kaka, "content-type": "application/json" },
      body: JSON.stringify({ team: SLUG, agentId: "offert", title: "Offert: badrum Villa Ek", brief: "Totalrenovering 6 m², ROT.", kund: "Familjen Ek", klartNar: ["Pris inkl. moms och ROT", "Giltig 30 dagar"], ...extra }) }),
    env,
  });
  return { status: res.status, body: await res.json() };
}

// ── metadata ──────────────────────────────────────────────────────────────

test("metadatan annonserar det Claude kräver för CIMD och PKCE", async () => {
  const m = await (await asMeta.onRequestGet({ request: req("/.well-known/oauth-authorization-server") })).json();
  assert.equal(m.issuer, O);
  assert.deepEqual(m.code_challenge_methods_supported, ["S256"]);
  assert.equal(m.client_id_metadata_document_supported, true);
  assert.ok(m.token_endpoint_auth_methods_supported.includes("none"), "utan 'none' faller Claude tillbaka på DCR");
  assert.ok(m.registration_endpoint.endsWith("/oauth/register"));
  const pr = await (await prMeta.onRequestGet({ request: req("/.well-known/oauth-protected-resource") })).json();
  assert.equal(pr.resource, O + "/mcp", "resource måste vara exakt adressen kunden skriver in");
  assert.deepEqual(pr.authorization_servers, [O]);
});

test("utan nyckel svarar /mcp 401 med pekare till metadatan", async () => {
  const { env } = await värld();
  const res = await mcp.onRequestPost({ request: req("/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }) }), env });
  assert.equal(res.status, 401);
  assert.match(res.headers.get("www-authenticate"), /resource_metadata="https:\/\/mittaiteam\.se\/\.well-known\/oauth-protected-resource"/);
});

// ── hela vägen ────────────────────────────────────────────────────────────

test("hela vägen: koppla, lista, hämta, leverera, godkänn i portalen", async () => {
  const { env, kakor } = await värld();
  const { body: skapat } = await nyttJobb(env, kakor.u1);
  const id = skapat.jobb.id;

  const { access_token } = await koppla(env, kakor.u1, await registrera(env));
  const init = await rpc(env, access_token, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } });
  assert.equal(init.body.result.protocolVersion, "2025-06-18");
  assert.equal((await rpc(env, access_token, "notifications/initialized")).status, 202);

  const lista = (await rpc(env, access_token, "tools/list")).body.result.tools.map((t) => t.name);
  assert.deepEqual(lista, ["lista_jobb", "hamta_jobb", "lamna_leverans"]);

  const l = await verktyg(env, access_token, "lista_jobb", {});
  assert.match(l.content[0].text, new RegExp(id));
  assert.match(l.content[0].text, /Offertskrivaren/);

  const kort = (await verktyg(env, access_token, "hamta_jobb", { jobb_id: id })).content[0].text;
  assert.match(kort, /Totalrenovering 6 m²/);
  assert.match(kort, /- \[ \] Giltig 30 dagar/);
  assert.match(kort, /Du skriver offerter som en privatperson förstår/, "agentens instruktion följer med");
  assert.match(kort, /Familjen Ek/);

  const lev = await verktyg(env, access_token, "lamna_leverans", { jobb_id: id, leverans: "# Offert\n137 000 kr", kommentar: "Kakel över 450 kr/m² ingår inte." });
  assert.ok(!lev.isError);

  const portalen = await (await jobb.onRequestGet({ request: req("/api/jobb?team=" + SLUG, { headers: { cookie: kakor.u1 } }), env })).json();
  const j = portalen.jobb.find((x) => x.id === id);
  assert.equal(j.status, "levererad");
  assert.equal(j.levereradVia, "Claude", "värden på återanropet avgör namnet, inte klientens självvalda namn");
  assert.match(j.leverans, /Kakel över 450/);
  assert.equal(j.hamtadAv, "Claude");

  const g = await handling.onRequestPost({ request: req("/api/jobb/handling", { method: "POST", headers: { cookie: kakor.u1 }, body: JSON.stringify({ team: SLUG, id, handling: "godkann" }) }), env });
  assert.equal((await g.json()).jobb.status, "godkand");

  const igen = await verktyg(env, access_token, "lamna_leverans", { jobb_id: id, leverans: "ny" });
  assert.equal(igen.isError, true, "ett godkänt jobb tar inte emot fler leveranser");
});

// ── säkerheten ────────────────────────────────────────────────────────────

test("fel PKCE-verifierare ger invalid_grant, och koden går bara att lösa in en gång", async () => {
  const { env, kakor } = await värld();
  const cid = await registrera(env);
  const { code, verifier } = await koppla(env, kakor.u1, cid);
  // Koden är redan inlöst av koppla() — en andra inlösen ska nekas.
  const igen = await token.onRequestPost({ request: req("/oauth/token", { method: "POST", body: form({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: CLAUDE_CB, client_id: cid }) }), env });
  assert.equal(igen.status, 400);
  assert.equal((await igen.json()).error, "invalid_grant");
});

test("en kod med fel PKCE löses aldrig in", async () => {
  const { env, kakor, db } = await värld();
  const cid = await registrera(env);
  const p = { response_type: "code", client_id: cid, redirect_uri: CLAUDE_CB, code_challenge: await pkceChallenge("rätt".repeat(12)), code_challenge_method: "S256", state: "s" };
  const html = await (await authorize.onRequestGet({ request: req("/oauth/authorize?" + form(p), { headers: { cookie: kakor.u1 } }), env })).text();
  const csrf = /name="csrf" value="([0-9a-f]+)"/.exec(html)[1];
  const post = await authorize.onRequestPost({ request: req("/oauth/authorize", { method: "POST", headers: { cookie: kakor.u1, origin: O }, body: form({ ...p, csrf, svar: "ja" }) }), env });
  const code = new URL(post.headers.get("location")).searchParams.get("code");
  const res = await token.onRequestPost({ request: req("/oauth/token", { method: "POST", body: form({ grant_type: "authorization_code", code, code_verifier: "fel".repeat(15), redirect_uri: CLAUDE_CB, client_id: cid }) }), env });
  assert.equal((await res.json()).error, "invalid_grant");
  assert.equal(db.raw.prepare("SELECT COUNT(*) n FROM oauth_tokens").get().n, 0);
});

test("förnyelsenyckeln roteras: den gamla dör när den nya ges", async () => {
  const { env, kakor } = await värld();
  const cid = await registrera(env);
  const { refresh_token } = await koppla(env, kakor.u1, cid);
  const r1 = await token.onRequestPost({ request: req("/oauth/token", { method: "POST", body: form({ grant_type: "refresh_token", refresh_token, client_id: cid }) }), env });
  assert.equal(r1.status, 200);
  const ny = await r1.json();
  assert.notEqual(ny.refresh_token, refresh_token);
  const r2 = await token.onRequestPost({ request: req("/oauth/token", { method: "POST", body: form({ grant_type: "refresh_token", refresh_token, client_id: cid }) }), env });
  assert.equal((await r2.json()).error, "invalid_grant", "Claude förnyar bara om en död nyckel ger invalid_grant");
});

test("okänd återanropsadress visas som fel här — vi skickar aldrig vidare dit", async () => {
  const { env, kakor } = await värld();
  const cid = await registrera(env);
  const p = { response_type: "code", client_id: cid, redirect_uri: "https://ond.example/cb", code_challenge: "x", code_challenge_method: "S256" };
  const res = await authorize.onRequestGet({ request: req("/oauth/authorize?" + form(p), { headers: { cookie: kakor.u1 } }), env });
  assert.equal(res.status, 400);
  assert.equal(res.headers.get("location"), null);
});

test("samtycke från en annan webbplats nekas, och fel csrf ger ingen kod", async () => {
  const { env, kakor } = await värld();
  const cid = await registrera(env);
  const p = { response_type: "code", client_id: cid, redirect_uri: CLAUDE_CB, code_challenge: "abc", code_challenge_method: "S256", state: "s" };
  const ond = await authorize.onRequestPost({ request: req("/oauth/authorize", { method: "POST", headers: { cookie: kakor.u1, origin: "https://ond.example" }, body: form({ ...p, svar: "ja" }) }), env });
  assert.equal(ond.status, 403);
  const utanCsrf = await authorize.onRequestPost({ request: req("/oauth/authorize", { method: "POST", headers: { cookie: kakor.u1, origin: O }, body: form({ ...p, csrf: "0".repeat(64), svar: "ja" }) }), env });
  assert.equal(utanCsrf.status, 400);
});

test("ej inloggad får inloggningen, inte samtycket", async () => {
  const { env } = await värld();
  const cid = await registrera(env);
  const p = { response_type: "code", client_id: cid, redirect_uri: CLAUDE_CB, code_challenge: "abc", code_challenge_method: "S256" };
  const html = await (await authorize.onRequestGet({ request: req("/oauth/authorize?" + form(p)), env })).text();
  assert.match(html, /\/api\/auth\/request/);
  assert.doesNotMatch(html, /name="csrf"/);
});

test("en annan kunds nyckel når inte våra jobb", async () => {
  const { env, kakor } = await värld();
  const { body } = await nyttJobb(env, kakor.u1);
  const { access_token } = await koppla(env, kakor.u2, await registrera(env));
  const r = await verktyg(env, access_token, "hamta_jobb", { jobb_id: body.jobb.id });
  assert.equal(r.isError, true);
  const l = await verktyg(env, access_token, "lista_jobb", { status: "alla" });
  assert.doesNotMatch(l.content[0].text, new RegExp(body.jobb.id));
  const lev = await verktyg(env, access_token, "lamna_leverans", { jobb_id: body.jobb.id, leverans: "kapat" });
  assert.equal(lev.isError, true);
});

test("en spärrad plan ger inga jobb via kopplingen", async () => {
  const { env, kakor, db } = await värld();
  const { body } = await nyttJobb(env, kakor.u1);
  const { access_token } = await koppla(env, kakor.u1, await registrera(env));
  db.raw.prepare("UPDATE teams SET plan = 'cancelled' WHERE slug = ?").run(SLUG);
  const r = await verktyg(env, access_token, "hamta_jobb", { jobb_id: body.jobb.id });
  assert.equal(r.isError, true);
});

test("en kollega som tas bort ur teamet tappar kopplingens åtkomst direkt", async () => {
  const { env, kakor, db } = await värld();
  const { body } = await nyttJobb(env, kakor.u1);
  const { access_token } = await koppla(env, kakor.u1, await registrera(env));
  db.raw.prepare("DELETE FROM team_access WHERE user_id = 'u1'").run();
  assert.equal((await verktyg(env, access_token, "hamta_jobb", { jobb_id: body.jobb.id })).isError, true);
});

test("en utgången åtkomstnyckel ger 401, så att plattformen förnyar", async () => {
  const { env, kakor, db } = await värld();
  const { access_token } = await koppla(env, kakor.u1, await registrera(env));
  db.raw.prepare("UPDATE oauth_tokens SET expires_at = 1 WHERE kind = 'access'").run();
  assert.equal((await rpc(env, access_token, "tools/list")).status, 401);
});

// ── CIMD ──────────────────────────────────────────────────────────────────

test("CIMD: client_id är en adress vars dokument måste säga samma id", async () => {
  const { lookupClient } = await import("../functions/api/_koppling.js");
  const { db } = await värld();
  const url = "https://claude.ai/oauth/mcp-oauth-client-metadata";
  const svara = (doc) => async () => new Response(JSON.stringify(doc));
  assert.equal(await lookupClient(db, url, svara({ client_id: "https://annan.example/x", redirect_uris: [CLAUDE_CB] })), null);
  const c = await lookupClient(db, url, svara({ client_id: url, client_name: "Claude", redirect_uris: [CLAUDE_CB] }));
  assert.equal(c.kind, "cimd");
  assert.deepEqual(c.redirect_uris, [CLAUDE_CB]);
  // Andra gången ur databasen, utan hämtning.
  const igen = await lookupClient(db, url, async () => { throw new Error("ska inte hämtas"); });
  assert.equal(igen.client_name, "Claude");
});

// ── adresserna ────────────────────────────────────────────────────────────

test("loopback matchas utan port, allt annat exakt", () => {
  assert.ok(redirectMatches("http://localhost/callback", "http://localhost:3118/callback"));
  assert.ok(redirectMatches("http://127.0.0.1/callback", "http://127.0.0.1:55555/callback"));
  assert.ok(!redirectMatches("http://localhost/callback", "http://localhost:3118/annan"));
  assert.ok(!redirectMatches(CLAUDE_CB, CLAUDE_CB + "x"));
  assert.ok(!redirectOk("http://ond.example/cb"));
  assert.ok(!redirectOk("javascript:alert(1)"));
  assert.ok(!redirectOk("https://claude.ai/cb#frag"));
});

// ── portalens rutter ──────────────────────────────────────────────────────

test("portalen: jobb kräver inloggning, känd agent, och bara egna team", async () => {
  const { env, kakor } = await värld();
  const utan = await jobb.onRequestPost({ request: req("/api/jobb", { method: "POST", body: JSON.stringify({ team: SLUG, agentId: "offert", title: "a", brief: "b" }) }), env });
  assert.equal(utan.status, 401);
  assert.equal((await nyttJobb(env, kakor.u1, { agentId: "finns-inte" })).status, 400);
  assert.equal((await nyttJobb(env, kakor.u2)).status, 404, "u2 når inte u1:s team");
});

test("portalen: godkänna kräver en leverans", async () => {
  const { env, kakor } = await värld();
  const { body } = await nyttJobb(env, kakor.u1);
  const g = await handling.onRequestPost({ request: req("/api/jobb/handling", { method: "POST", headers: { cookie: kakor.u1 }, body: JSON.stringify({ team: SLUG, id: body.jobb.id, handling: "godkann" }) }), env });
  assert.equal(g.status, 409);
});

test("middlewaren känner jobbrutterna", () => {
  const src = readFileSync("functions/_middleware.js", "utf8");
  assert.match(src, /\\\/api\\\/jobb\\\/\?\$/);
  assert.match(src, /\\\/api\\\/jobb\\\/handling/);
});
