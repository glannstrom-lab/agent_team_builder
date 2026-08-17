// GET /api/health — svarar på frågan "fungerar tjänsten just nu?"
//
// Varför den finns: en bugg gjorde produkten stum i tio dagar (6–16 augusti
// 2026) och upptäcktes när Mikael körde en demo för en vän. Krediten hos
// OpenRouter kan ta slut klockan 03 och portalen svara 503 till varje betalande
// kund fram till morgonen. Det fanns ingenting som kunde larma, för det enda
// spåret var `console.error` i en Pages Function — synligt bara i
// `wrangler pages deployment tail` medan någon aktivt tittar.
//
// Rutten är gjord för att pollas av en gratis uptime-vakt (UptimeRobot,
// Cloudflare Health Check, Better Stack). Kontraktet är därför enkelt och det
// enda som betyder något: **200 = tjänsten kan svara kunder, 503 = den kan
// inte.** Vakten larmar på statuskoden; kroppen är för människan som öppnar
// länken efteråt.
//
// Tre saker som medvetet INTE görs:
//
//   1. Inget AI-anrop uppströms. En vakt som pollar var femte minut hade kostat
//      pengar dygnet runt och räknats i taken. Vi kontrollerar att nyckeln
//      FINNS, inte att den har kredit — det senare vet vi ändå, genom att
//      `/api/ai` bokför `service_down` i ai_errors när OpenRouter säger 402.
//   2. Inga siffror i svaret. Rutten är öppen (en vakt kan inte logga in), och
//      antal anrop per dygn är affärsinformation. Booleaner räcker för att
//      larma, och den som har databasen kan räkna själv.
//   3. Ingen autentisering. En hälsokontroll bakom inloggning är en
//      hälsokontroll ingen vakt kan använda.

import { json } from "./auth/_lib.js";

// Hur länge ett kreditfel håller rutten röd. Kort nog att en påfylld kredit
// syns snabbt, långt nog att felet inte hinner blinka förbi mellan två pollar
// (en vakt kollar typiskt var femte minut).
const FÄRSKT_FEL_MS = 20 * 60 * 1000;

const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);

export async function onRequestGet(context) {
  const { env } = context;
  const nu = Date.now();
  const kontroller = {};
  const problem = [];

  // 1) Nyckeln. Utan den svarar /api/ai 503 på varje anrop, och det är det
  // enklaste felet att orsaka: en secret som inte följde med en ny deploy.
  kontroller.ai_nyckel = !!env.OPENROUTER_KEY;
  if (!kontroller.ai_nyckel) problem.push("OPENROUTER_KEY saknas — /api/ai svarar 503 på allt");

  // 2) Databasen. Bär konton, betald åtkomst och planstatus; svarar den inte
  // kommer ingen in i portalen, oavsett om AI:n fungerar.
  let dbSvarar = false;
  try {
    const r = await env.DB.prepare("SELECT 1 AS ok").first();
    dbSvarar = !!(r && r.ok === 1);
  } catch (e) {
    console.error("[health] databasen svarar inte", String(e).slice(0, 200));
  }
  kontroller.databas = dbSvarar;
  if (!dbSvarar) problem.push("D1 svarar inte — inloggning och köpta team är otillgängliga");

  // 3) Färska kreditfel. Det är det fel som inte löser sig av sig självt: en
  // tömd kredit står stilla till någon fyller på. Tabellen kan saknas om
  // migration 0006 inte körts — då hoppas kontrollen över i stället för att
  // rapportera falskt friskt.
  if (dbSvarar) {
    try {
      const r = await env.DB
        .prepare("SELECT last_at FROM ai_errors WHERE day IN (?, ?) AND code = 'service_down' ORDER BY last_at DESC LIMIT 1")
        .bind(utcDay(nu), utcDay(nu - 86400000))
        .first();
      const färskt = !!(r && r.last_at && nu - r.last_at < FÄRSKT_FEL_MS);
      kontroller.ai_kredit = !färskt;
      if (färskt) problem.push("OpenRouter har svarat 402 den senaste stunden — krediten är sannolikt slut");
    } catch (e) {
      // Saknad tabell är ett driftläge, inte ett kundproblem: rutten ska inte
      // gå röd av att migrationen inte körts, men det ska framgå.
      kontroller.ai_kredit = null;
      console.error("[health] kunde inte läsa ai_errors (migration 0006 körd?)", String(e).slice(0, 200));
    }
  }

  const ok = problem.length === 0;
  return json({
    ok,
    status: ok ? "friskt" : "problem",
    checks: kontroller,
    problem,
    at: new Date(nu).toISOString(),
    // json() sätter redan cache-control: no-store — en cachad hälsokontroll
    // vore ingen hälsokontroll.
  }, ok ? 200 : 503);
}
