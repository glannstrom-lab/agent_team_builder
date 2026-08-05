// POST /api/auth/request  { email }  → skickar en engångskod
//
// Svaret är ALLTID detsamma oavsett om adressen finns, om spärren slog till
// eller om utskicket krånglade. Ett svar som skiljer sig är en rutt för att
// kartlägga kundlistan, och den här endpointen är öppen för alla.
//
// Undantaget är formatfel i själva adressen, som svarar 400 — där finns
// ingenting att röja, och kunden behöver veta att den skrivit fel.

import {
  json, readJson, normalizeEmail, looksLikeEmail, generateCode, sha256Hex,
  randomHex, nowMs, throttleOk, clientIp, sendLoginCode, CODE_TTL_MS,
} from "./_lib.js";

const SAME_ANSWER = {
  ok: true,
  message: "Om adressen finns hos oss har vi skickat en kod. Kolla mejlen — den gäller i tio minuter.",
};

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ error: "databasen är inte kopplad" }, 500);

  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  if (!looksLikeEmail(email)) {
    return json({ error: "Det där ser inte ut som en e-postadress." }, 400);
  }

  // Spärren räknas före allt annat arbete, så att ett angrepp inte kostar
  // oss databasanrop eller utskick.
  // Att säga "för många förfrågningar" avslöjar ingenting om huruvida
  // adressen finns — spärren räknas på det som skrevs in, oavsett. Att
  // däremot svara "vi har skickat en kod" när ingen kod skickats är ett
  // tyst fel: användaren hamnar framför ett tomt kodfält och tror att hen
  // gjort något galet. Tystnad är rätt mot kartläggning, fel mot kunden.
  if (!(await throttleOk(db, email, clientIp(request), "req"))) {
    return json({ error: "För många kodförfrågningar. Vänta en kvart och försök igen." }, 429);
  }

  // Bara befintliga konton får koder. Konton skapas när ett team levereras,
  // inte genom att någon skriver sin adress här — annars fylls tabellen med
  // konton utan team, och utskicksrykte bränns på adresser som aldrig köpt.
  const user = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (!user) return json(SAME_ANSWER);

  const code = generateCode();
  const t = nowMs();

  // Tidigare oanvända koder för adressen bränns. Annars kan flera koder
  // vara giltiga samtidigt, och försöksräknaren blir meningslös eftersom
  // varje ny begäran ger tre nya gissningar.
  await db.prepare(
    "UPDATE login_codes SET consumed_at = ? WHERE email = ? AND consumed_at IS NULL"
  ).bind(t, email).run();

  await db.prepare(
    "INSERT INTO login_codes (id, email, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, 0, ?)"
  ).bind(randomHex(16), email, await sha256Hex(code + email), t + CODE_TTL_MS, t).run();

  try {
    await sendLoginCode(env, email, code);
  } catch (_) {
    // Kunden får samma svar. Felet syns i loggen, inte i svaret — annars
    // går det att skilja en existerande adress från en som inte finns.
  }

  // Utvecklingsläge: innan en avsändare är uppsatt finns koden bara i
  // loggen, dit den som ska logga in inte når. Då är tjänsten obrukbar,
  // inte säker. I konsolläge returneras koden därför i svaret så att
  // flödet går att köra hela vägen.
  //
  // Det här är säkert exakt så länge MAIL_PROVIDER är "console", och
  // katastrofalt annars: då lämnas koden ut till vem som helst som kan
  // gissa en e-postadress. Villkoret är avsiktligt en exakt jämförelse
  // mot ett värde som måste sättas medvetet — default är "resend".
  if (env.MAIL_PROVIDER === "console") {
    return json({ ...SAME_ANSWER, devCode: code, devNote: "Utvecklingsläge — ingen avsändare uppsatt. Koden visas här i stället för att mejlas." });
  }

  return json(SAME_ANSWER);
}
