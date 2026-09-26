// BF3/PR3 (2026-09-26): generatorns prompter är inte publika.
//
// Filerna i prompts/ måste ligga i dist/, för /api/ai läser dem via
// env.ASSETS (functions/api/_build.js). Men de är receptet — research.md är
// nyckelsteget enligt CLAUDE.md — och låg öppet: `curl …/prompts/shared/
// research.md` gav 200 och 17 807 byte klartext. Den här Functionen svarar 404
// utåt. env.ASSETS.fetch går förbi Functions-routingen och når fortfarande
// filen — verifierat i drift med ett riktigt byggsteg samma dag.
//
// OBS: reservvägen i _build.js (självhämtning via den publika adressen när
// ASSETS saknas) stängs samtidigt. Det är avsiktligt: den vägen fanns för att
// ASSETS inte syntes i emulatorn, och i drift bär ASSETS.
export function onRequest() {
  return new Response("Hittades inte", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
