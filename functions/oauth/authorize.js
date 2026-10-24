// GET/POST /oauth/authorize — inloggning och samtycke när kunden kopplar
// Claude eller ChatGPT till sitt team (SP21).
//
// Ligger UTANFÖR /api/ med flit: middlewaren byter varje HTML-svar under /api/
// mot 404 (samma skäl som functions/avregistrera.js).
//
// Flödet:
//   1. Plattformen skickar hit kunden med client_id, redirect_uri, PKCE m.m.
//   2. Klient och återanropsadress kontrolleras FÖRST. Stämmer de inte visas
//      ett fel här — vi skickar aldrig vidare till en adress vi inte känner.
//   3. Ej inloggad: samma engångskod som portalen (/api/auth/request + verify),
//      sedan laddas sidan om med sessionskakan satt.
//   4. Inloggad: samtyckessidan säger vad plattformen får och inte får, och
//      VILKEN värd kunden skickas tillbaka till (MCP-specen kräver det).
//   5. Ja → engångskod → 303 till plattformen. Nej → access_denied.
//
// Sidan bär sin egen CSP: `_headers` gäller bara statiska filer. form-action
// släpper in återanropsadressens origin, för Chrome tillämpar form-action även
// på omdirigeringen efter formuläret.

import { sessionUser, sha256Hex, timingSafeEqual, randomHex } from "../api/auth/_lib.js";
import {
  SCOPE, SCOPE_FIRMA, BEVILJAT, lookupClient, redirectMatches, clientLabel, createCode, aktivaTeam, origin,
} from "../api/_koppling.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function readParams(src) {
  const g = (k) => (src.get(k) || "").trim();
  return {
    response_type: g("response_type"),
    client_id: g("client_id"),
    redirect_uri: g("redirect_uri"),
    code_challenge: g("code_challenge"),
    code_challenge_method: g("code_challenge_method"),
    state: src.get("state") || "",
    scope: g("scope"),
    resource: g("resource"),
  };
}

// Kontrollerna som avgör om vi alls får skicka tillbaka till redirect_uri.
async function checkClient(env, p) {
  const client = await lookupClient(env.DB, p.client_id);
  if (!client) return { fail: "Tjänsten som vill koppla sig är okänd. Försök lägga till kopplingen igen." };
  const reg = client.redirect_uris.find((r) => redirectMatches(r, p.redirect_uri));
  if (!p.redirect_uri || !reg) return { fail: "Återanropsadressen stämmer inte med tjänstens registrering." };
  return { client };
}

function back(p, params) {
  const u = new URL(p.redirect_uri);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  if (p.state) u.searchParams.set("state", p.state);
  return Response.redirect(u.toString(), 303);
}

async function csrfFor(user, p) {
  return sha256Hex([user.tokenHash, p.client_id, p.redirect_uri, p.code_challenge, p.state].join("|"));
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return page({ title: "Tillfälligt fel", body: "<p>Databasen är inte kopplad.</p>" }, 500);
  const p = readParams(new URL(request.url).searchParams);
  const { client, fail } = await checkClient(env, p);
  if (fail) return page({ title: "Kopplingen gick inte att starta", body: `<p>${esc(fail)}</p>` }, 400);

  // Härifrån går fel tillbaka till plattformen, som visar dem för kunden.
  if (p.response_type !== "code") return back(p, { error: "unsupported_response_type" });
  if (!p.code_challenge || p.code_challenge_method !== "S256") {
    return back(p, { error: "invalid_request", error_description: "PKCE med S256 krävs." });
  }
  if (p.scope && !p.scope.split(/\s+/).every((s) => s === SCOPE || s === SCOPE_FIRMA || s === "offline_access")) {
    return back(p, { error: "invalid_scope" });
  }

  const vem = clientLabel(client, p.redirect_uri);
  const user = await sessionUser(env.DB, request);
  if (!user) return page({ title: `Koppla ${vem} till Mitt AI-team`, body: loginBody(vem), script: LOGIN_SCRIPT, redirect: p.redirect_uri });

  const team = await aktivaTeam(env.DB, user.id);
  if (!team.length) {
    return page({
      title: "Inget aktivt team",
      body: `<p>Du är inloggad som <b>${esc(user.email)}</b>, men kontot har inget team som är igång. Kopplingen ger ${esc(vem)} tillgång till ett teams jobb, så det behövs ett först.</p>
        <form method="post">${hidden(p)}<input type="hidden" name="csrf" value="${await csrfFor(user, p)}"><button name="svar" value="nej" class="sek">Tillbaka till ${esc(vem)}</button></form>`,
      redirect: p.redirect_uri,
    });
  }

  let host = "";
  try { host = new URL(p.redirect_uri).host; } catch (_) { /* kontrollerad ovan */ }
  return page({
    title: `${vem} vill koppla sig till ert team`,
    redirect: p.redirect_uri,
    body: `<p class="ingress">Inloggad som <b>${esc(user.email)}</b>. Kopplingen gäller ${team.length === 1 ? "teamet" : "teamen"} <b>${team.map((t) => esc(t.company)).join(", ")}</b>.</p>
      <div class="ruta"><div class="etikett">${esc(vem)} kommer att kunna</div>
        <ul><li>läsa teamet: agenterna, deras instruktioner och era rutiner</li><li>läsa och lägga till i ert företagsminne och era underlag</li><li>läsa och lägga till organisationer och kontakter</li><li>se jobben, lägga upp nya och lämna leveranser</li></ul>
        <div class="etikett" style="margin-top:14px">men inte</div>
        <ul><li>godkänna en leverans: det gör du i portalen</li><li>läsa era samtal med agenterna i portalen</li><li>ta bort något</li></ul></div>
      <p class="dim">Efter ja skickas du tillbaka till <b>${esc(host)}</b>. Du kan koppla bort ${esc(vem)} när som helst i ${esc(vem)}s inställningar.</p>
      <form method="post" class="knappar">${hidden(p)}<input type="hidden" name="csrf" value="${await csrfFor(user, p)}">
        <button name="svar" value="ja">Ja, koppla ${esc(vem)}</button><button name="svar" value="nej" class="sek">Nej</button></form>`,
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return page({ title: "Tillfälligt fel", body: "<p>Databasen är inte kopplad.</p>" }, 500);
  // Formuläret kommer alltid från vår egen sida. En annan Origin är någon som
  // försöker få en inloggad kund att samtycka utan att veta om det.
  const o = request.headers.get("origin");
  if (o && o !== origin(request)) return page({ title: "Nekad", body: "<p>Begäran kom från fel webbplats.</p>" }, 403);

  const form = new URLSearchParams(await request.text());
  const p = readParams(form);
  const { client, fail } = await checkClient(env, p);
  if (fail) return page({ title: "Kopplingen gick inte att slutföra", body: `<p>${esc(fail)}</p>` }, 400);

  const user = await sessionUser(env.DB, request);
  if (!user) return back(p, { error: "access_denied", error_description: "Inte inloggad." });
  if (!timingSafeEqual(form.get("csrf") || "", await csrfFor(user, p))) {
    return page({ title: "Sidan hade gått ut", body: "<p>Börja om från Claude eller ChatGPT och lägg till kopplingen igen.</p>" }, 400);
  }
  if (form.get("svar") !== "ja") return back(p, { error: "access_denied" });
  if (!p.code_challenge || p.code_challenge_method !== "S256") return back(p, { error: "invalid_request" });
  if (!(await aktivaTeam(env.DB, user.id)).length) return back(p, { error: "access_denied", error_description: "Inget aktivt team." });

  const code = await createCode(env.DB, {
    clientId: client.client_id, userId: user.id, redirectUri: p.redirect_uri,
    codeChallenge: p.code_challenge, scope: BEVILJAT, resource: p.resource,
  });
  return back(p, { code, iss: origin(request) });
}

function hidden(p) {
  return ["response_type", "client_id", "redirect_uri", "code_challenge", "code_challenge_method", "state", "scope", "resource"]
    .map((k) => `<input type="hidden" name="${k}" value="${esc(p[k])}">`).join("");
}

function loginBody(vem) {
  return `<p class="ingress">Logga in med samma e-post som i portalen. Vi skickar en kod, precis som vanligt.</p>
    <form id="steg1" class="falt"><label for="epost">E-post</label><input id="epost" type="email" autocomplete="email" required><button>Skicka kod</button></form>
    <form id="steg2" class="falt" hidden><label for="kod">Koden från mejlet</label><input id="kod" inputmode="numeric" autocomplete="one-time-code" pattern="\\d{6}" maxlength="6" required><button>Logga in</button></form>
    <p id="besked" class="dim" role="status"></p>
    <p class="dim">Efter inloggningen ser du exakt vad ${esc(vem)} får göra innan något kopplas.</p>`;
}

const LOGIN_SCRIPT = `
const $ = (id) => document.getElementById(id);
let epost = "";
async function post(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
  let j = {}; try { j = await r.json(); } catch (_) {}
  return { ok: r.ok, j };
}
$("steg1").addEventListener("submit", async (e) => {
  e.preventDefault(); epost = $("epost").value.trim();
  const { ok, j } = await post("/api/auth/request", { email: epost });
  $("besked").textContent = ok ? (j.message || "Kolla mejlen.") : (j.error || "Något gick fel.");
  if (ok) { $("steg1").hidden = true; $("steg2").hidden = false; $("kod").focus(); }
});
$("steg2").addEventListener("submit", async (e) => {
  e.preventDefault();
  const { ok, j } = await post("/api/auth/verify", { email: epost, code: $("kod").value.trim() });
  if (ok) location.reload(); else $("besked").textContent = j.error || "Koden stämmer inte.";
});`;

function page({ title, body, script = "", redirect = "" }, status = 200) {
  const nonce = randomHex(16);
  let formAction = "'self'";
  try { if (redirect) formAction += " " + new URL(redirect).origin; } catch (_) { /* */ }
  const html = `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Mitt AI-team</title><link rel="stylesheet" href="/fonts/fonts.css">
<style nonce="${nonce}">
:root{--sand:#F1ECE3;--papper:#FCFAF6;--blak:#1E1913;--mjuk:#5E554A;--linje:#DDD4C6;--ockra-2:#8A5C14}
*{box-sizing:border-box}body{margin:0;background:var(--sand);color:var(--blak);font:16px/1.55 Karla,"Segoe UI",system-ui,sans-serif;padding:40px 16px}
main{max-width:520px;margin:0 auto;background:var(--papper);border:1px solid var(--linje);border-radius:6px;padding:28px}
.marke{font:800 .95rem Archivo,Arial,sans-serif;margin-bottom:18px}h1{font:800 1.5rem/1.15 Archivo,Arial,sans-serif;letter-spacing:-.015em;margin:0 0 12px}
.ingress{margin:0 0 16px}.dim{color:var(--mjuk);font-size:.9rem}.etikett{font:500 .7rem "IBM Plex Mono",Consolas,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--ockra-2)}
.ruta{border:1px solid var(--linje);border-radius:6px;padding:14px 16px;margin:0 0 14px}.ruta ul{margin:6px 0 0;padding-left:20px}
.falt{display:grid;gap:8px;margin:0 0 12px}input{font:inherit;padding:10px 12px;border:1px solid var(--linje);border-radius:6px;background:#fff}
button{font:700 1rem Karla,system-ui,sans-serif;background:var(--blak);color:var(--papper);border:0;border-radius:6px;padding:11px 18px;cursor:pointer}
.knappar{display:flex;gap:10px;flex-wrap:wrap}button.sek{background:transparent;color:var(--blak);border:1px solid var(--linje)}
</style></head><body><main><div class="marke">Mitt AI-team</div><h1>${esc(title)}</h1>${body}</main>
${script ? `<script nonce="${nonce}">${script}</script>` : ""}</body></html>`;
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": `default-src 'none'; style-src 'self' 'nonce-${nonce}'; font-src 'self'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action ${formAction}; frame-ancestors 'none'; base-uri 'none'`,
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "x-frame-options": "DENY",
    },
  });
}
