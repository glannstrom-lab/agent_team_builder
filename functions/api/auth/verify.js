// POST /api/auth/verify  { email, code }  → sätter sessionskaka
//
// Tre saker gör en sexsiffrig kod försvarbar, och alla tre måste finnas:
// kort livslängd, engångsbruk, och en försöksräknare. Tas någon bort räcker
// det att gissa tillräckligt många gånger.

import {
  json, readJson, normalizeEmail, sha256Hex, timingSafeEqual, nowMs,
  createSession, sessionCookie, throttleOk, clientIp,
  CODE_MAX_ATTEMPTS, SESSION_TTL_MS,
} from "./_lib.js";

const BAD = { error: "Koden stämmer inte, eller har gått ut. Begär en ny." };

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const code = String(body.code || "").trim();

  if (!email || !/^\d{6}$/.test(code)) return json(BAD, 400);

  // Samma spärr som på utskicket. Utan den är den här rutten stället där
  // en miljon gissningar görs.
  if (!(await throttleOk(db, email, clientIp(request)))) {
    return json({ error: "För många försök. Vänta en stund och begär en ny kod." }, 429);
  }

  const t = nowMs();
  const row = await db.prepare(
    "SELECT id, code_hash, expires_at, attempts FROM login_codes " +
    "WHERE email = ? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1"
  ).bind(email).first();

  if (!row || row.expires_at < t || row.attempts >= CODE_MAX_ATTEMPTS) return json(BAD, 400);

  // Försöket räknas upp INNAN jämförelsen. Skulle något gå fel efter
  // jämförelsen ska försöket ändå vara förbrukat.
  await db.prepare("UPDATE login_codes SET attempts = attempts + 1 WHERE id = ?").bind(row.id).run();

  if (!timingSafeEqual(row.code_hash, await sha256Hex(code + email))) return json(BAD, 400);

  // Rätt kod: bränn den direkt så att den inte går att återanvända ens
  // inom giltighetstiden.
  await db.prepare("UPDATE login_codes SET consumed_at = ? WHERE id = ?").bind(t, row.id).run();

  const user = await db.prepare("SELECT id, email FROM users WHERE email = ?").bind(email).first();
  if (!user) return json(BAD, 400);

  await db.prepare("UPDATE users SET last_login = ? WHERE id = ?").bind(t, user.id).run();

  const token = await createSession(db, user.id, request.headers.get("user-agent"));
  return json(
    { ok: true, email: user.email },
    200,
    { "set-cookie": sessionCookie(token, Math.floor(SESSION_TTL_MS / 1000)) }
  );
}
