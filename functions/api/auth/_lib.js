// Delade byggstenar för inloggningen. Filnamn med inledande understreck
// routas inte av Pages Functions — det här är ett bibliotek, ingen endpoint.
//
// Designval värda att inte glömma:
//  - Ingenting hemligt lagras i klartext. Databasen bär hashar; kunden bär
//    klartexten i mejlet respektive i kakan. En läckt databas ger då ingen
//    inloggning.
//  - Koden är sexsiffrig för att den ska gå att läsa upp i telefon. Det är
//    bara säkert i kombination med kort livslängd, engångsbruk och en
//    försöksräknare — tas någon av de tre bort blir den gissningsbar.
//  - Svaren avslöjar aldrig om en adress finns. Annars är rutten ett sätt
//    att kartlägga kundlistan.

export const CODE_TTL_MS = 10 * 60 * 1000;        // 10 minuter
export const CODE_MAX_ATTEMPTS = 3;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dagar
export const COOKIE_NAME = "atb_session";

// Fönster och tak för spärren mot utskicksmissbruk. Per e-post OCH per IP:
// det ena stoppar riktade angrepp mot en enskild adress, det andra breda.
const THROTTLE_WINDOW_MS = 15 * 60 * 1000;
const THROTTLE_MAX_EMAIL = 3;
const THROTTLE_MAX_IP = 10;

// ── primitiver ────────────────────────────────────────────────────────────

export function nowMs() {
  return Date.now();
}

export function randomHex(bytes = 32) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Jämförelse i konstant tid. Hexsträngar av samma längd, men en tidig
// return på första olika tecknet läcker ändå information om hur långt en
// gissning kom. Kostnaden för att göra det rätt är noll.
export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Sexsiffrig kod utan modulo-bias. `% 1000000` på ett 32-bitars tal gör de
// lägsta koderna marginellt vanligare; rejection sampling kostar ett extra
// varv ibland och tar bort snedfördelningen helt.
export function generateCode() {
  const limit = 4294000000; // största multipel av 1e6 under 2^32
  const buf = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return String(value % 1000000).padStart(6, "0");
}

// Normaliserad e-post är identiteten. Utan normalisering blir Anna@X.se och
// anna@x.se två konton med varsitt team.
export function normalizeEmail(raw) {
  return String(raw || "").trim().toLowerCase();
}

// Medvetet tillåtande: e-postvalidering med regex är ett känt sätt att
// avvisa giltiga adresser. Det verkliga beviset är att koden kommer fram.
export function looksLikeEmail(email) {
  return email.length >= 6 && email.length <= 254 && /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(email);
}

// ── svar ──────────────────────────────────────────────────────────────────

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch (_) {
    return {};
  }
}

// ── spärr ─────────────────────────────────────────────────────────────────

// Returnerar true om anropet ska släppas igenom. Räknar upp i samma svep,
// så anroparen behöver inte komma ihåg att göra det.
export async function allowAttempt(db, bucket, max) {
  const t = nowMs();
  const row = await db.prepare("SELECT count, window_at FROM auth_throttle WHERE bucket = ?")
    .bind(bucket).first();

  if (!row || t - row.window_at > THROTTLE_WINDOW_MS) {
    await db.prepare(
      "INSERT INTO auth_throttle (bucket, count, window_at) VALUES (?, 1, ?) " +
      "ON CONFLICT(bucket) DO UPDATE SET count = 1, window_at = excluded.window_at"
    ).bind(bucket, t).run();
    return true;
  }
  if (row.count >= max) return false;

  await db.prepare("UPDATE auth_throttle SET count = count + 1 WHERE bucket = ?").bind(bucket).run();
  return true;
}

// Två skilda hinkar, för de skyddar mot olika saker och tål olika mycket:
//
//   "req" — att skicka mejl till en adress som anroparen anger. Måste vara
//           snävt: det är både en mejlbomb mot tredje part och ett sätt att
//           bränna avsändarens rykte.
//   "vfy" — att gissa en kod. Här är den egentliga spärren försöksräknaren
//           på själva koden (tre försök, sedan bränd), så hinken behöver
//           bara stoppa maskinell gissning över många koder.
//
// Först delade de hink, och då räckte tre åtgärder av vilket slag som helst
// för att låsa ute en person som bara skrivit fel en gång. Det är en spärr
// som stoppar kunden i stället för angriparen.
export async function throttleOk(db, email, ip, scope) {
  const s = scope === "vfy" ? "vfy" : "req";
  const maxEmail = s === "vfy" ? 12 : THROTTLE_MAX_EMAIL;
  const maxIp = s === "vfy" ? 40 : THROTTLE_MAX_IP;
  const byEmail = await allowAttempt(db, `email:${s}:` + email, maxEmail);
  const byIp = await allowAttempt(db, `ip:${s}:` + (ip || "okänd"), maxIp);
  return byEmail && byIp;
}

export function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || "";
}

// ── sessioner ─────────────────────────────────────────────────────────────

export async function createSession(db, userId, userAgent) {
  const token = randomHex(32);
  const hash = await sha256Hex(token);
  const t = nowMs();
  await db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at, created_at, user_agent) VALUES (?, ?, ?, ?, ?)"
  ).bind(hash, userId, t + SESSION_TTL_MS, t, (userAgent || "").slice(0, 200)).run();
  return token;
}

export async function sessionUser(db, request) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;
  const hash = await sha256Hex(token);
  const row = await db.prepare(
    "SELECT s.user_id, s.expires_at, u.email FROM sessions s " +
    "JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?"
  ).bind(hash).first();
  if (!row) return null;
  if (row.expires_at < nowMs()) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hash).run();
    return null;
  }
  return { id: row.user_id, email: row.email, token, tokenHash: hash, expiresAt: row.expires_at };
}

// Rullande session: varje gång kunden använder tjänsten flyttas utgången fram.
// Utan den här loggas även den som är inne varje dag ut efter trettio dagar och
// måste hämta en ny kod ur mejlen — en kod som bara finns för att bevisa vem
// hen är, vilket redan är bevisat av att sessionen används. Med den ser en
// aktiv kund aldrig en kod igen; en inaktiv får en efter trettio dagars tystnad.
//
// Skrivningen görs bara när mer än ett dygn gått sedan förra förlängningen.
// Annars blir varje sidladdning en databasskrivning för ingenting.
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

export async function refreshSession(db, user) {
  if (!user || !user.tokenHash) return null;
  const t = nowMs();
  const fresh = user.expiresAt - t > SESSION_TTL_MS - REFRESH_AFTER_MS;
  if (fresh) return null; // förlängdes nyligen — rör inget

  await db.prepare("UPDATE sessions SET expires_at = ? WHERE token_hash = ?")
    .bind(t + SESSION_TTL_MS, user.tokenHash).run();
  // Kakan måste sättas om också: databasen och webbläsaren har varsin klocka,
  // och det är webbläsarens som avgör om kakan ens skickas med nästa gång.
  return sessionCookie(user.token, Math.floor(SESSION_TTL_MS / 1000));
}

export async function destroySession(db, request) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return;
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
}

// HttpOnly gör kakan oläsbar för JavaScript, vilket är hela skillnaden mot
// att lägga token i localStorage — en XSS kan då inte stjäla sessionen.
// SameSite=Lax räcker: inloggningen sker på samma sajt och vi har inga
// tillståndsändrande GET-anrop.
export function sessionCookie(token, maxAgeSeconds) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

// ── utskick ───────────────────────────────────────────────────────────────

// Adapter i stället för ett hårdkodat beroende: Cloudflare Email Routing är
// bara INKOMMANDE och kan inte skicka, så en extern avsändare krävs. Vilken
// spelar mindre roll än att bytet ska vara en miljövariabel och inte en
// omskrivning.
//
// Krävda miljövariabler (sätts med `wrangler pages secret put`):
//   MAIL_PROVIDER   "resend" (default) eller "console" för lokal utveckling
//   MAIL_API_KEY    nyckel hos avsändaren
//   MAIL_FROM       t.ex. "Mitt AI-team <inloggning@mittaiteam.se>"
//
// Domänen måste vara verifierad hos avsändaren (SPF/DKIM i DNS), annars
// hamnar koden i skräpposten och kunden tror att tjänsten är trasig.
export async function sendLoginCode(env, email, code) {
  const provider = env.MAIL_PROVIDER || "resend";

  if (provider === "console") {
    // Lokal utveckling: koden hamnar i `wrangler pages dev`-loggen.
    // Får ALDRIG vara aktiv i produktion — då blir varje kod läsbar för
    // den som når loggarna.
    console.log(`[auth] inloggningskod för ${email}: ${code}`);
    return true;
  }

  if (!env.MAIL_API_KEY || !env.MAIL_FROM) {
    throw new Error("MAIL_API_KEY och MAIL_FROM saknas — utskick är inte konfigurerat");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: "Bearer " + env.MAIL_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [email],
      subject: `Din inloggningskod: ${code}`,
      text:
        `Din kod för att logga in på Mitt AI-team är:\n\n    ${code}\n\n` +
        `Koden gäller i tio minuter och kan bara användas en gång.\n\n` +
        `Bad du inte om den här koden kan du strunta i mejlet — ingen kommer ` +
        `in på ditt konto utan den.\n\n— Mitt AI-team\nmittaiteam.se`,
    }),
  });

  if (!res.ok) {
    // Detaljen loggas för felsökning men returneras aldrig till klienten:
    // avsändarens felmeddelanden kan avslöja om adressen finns.
    console.error("[auth] utskick misslyckades", res.status, await res.text().catch(() => ""));
    throw new Error("utskick misslyckades");
  }
  return true;
}
