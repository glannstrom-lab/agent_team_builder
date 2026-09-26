// Gallringen (BF5, 2026-09-26) — integritetspolicyns löften om lagringstid,
// verkställda.
//
// integritet.html lovar fyra gallringar som ingen kod utförde: inloggningskoder
// "inom minuter", sessioner "när de går ut", uppsagda konton och team "inom 90
// dagar", och påbörjade kassautkast "normalt inom ett dygn". Utan verkställare
// växte tabellerna för evigt — och Art. 13-information som inte stämmer är det
// första en granskande IT-leverantör kontrollerar.
//
// Körs av /api/digest/run, som workern i worker-veckobrevet/ redan anropar
// varje timme med DIGEST_SECRET — samma klocka, ingen ny worker, ingen ny
// hemlighet. Varje sats är idempotent: en körning till gör ingenting.
//
// VAD SOM RADERAS, och bara det:
//   • login_codes som gått ut (lever tio minuter; raderas vid nästa timkörning)
//   • sessions som gått ut
//   • pending-utkast äldre än ett dygn
//   • teams med en AVSLUTAD plan (cancelled, refunded, expired) vars senaste
//     planändring är äldre än 90 dagar — och provmånader (trial) som skapades
//     för över 120 dagar sedan, eftersom `expired` bara skrivs när någon
//     knackar på (_plan.js). team_access och weekly_digest följer med via
//     ON DELETE CASCADE.
//   • users utan någon team_access, skapade för över 90 dagar sedan. Deras
//     invited_by-referenser nollställs först — den kolumnen saknar kaskad, och
//     en ägare som bjudit in kollegor gick annars inte att radera.
//   • ai_usage-rader per IP (subject "ip:…") äldre än 30 dagar, och gamla
//     auth_throttle-fönster. Taken läser bara innevarande dygn/kvart.
//
// Aktiva, betalande och nyss uppsagda kunder rörs aldrig.

export const GALLRING = {
  utkastMs: 24 * 60 * 60 * 1000,
  avslutadMs: 90 * 24 * 60 * 60 * 1000,
  provmånadMs: 120 * 24 * 60 * 60 * 1000,
  kontoMs: 90 * 24 * 60 * 60 * 1000,
  ipDagar: 30,
  spärrMs: 24 * 60 * 60 * 1000,
};
export const AVSLUTADE_PLANER = ["cancelled", "refunded", "expired"];

const dag = (ms) => new Date(ms).toISOString().slice(0, 10);

export async function gallra(db, nu = Date.now()) {
  const g = GALLRING;
  const föräldralösa = "SELECT u.id FROM users u WHERE u.created_at < ? AND NOT EXISTS (SELECT 1 FROM team_access a WHERE a.user_id = u.id)";
  const satser = [
    ["koder", db.prepare("DELETE FROM login_codes WHERE expires_at < ?").bind(nu)],
    ["sessioner", db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(nu)],
    ["utkast", db.prepare("DELETE FROM pending WHERE created_at < ?").bind(nu - g.utkastMs)],
    ["team", db.prepare(
      `DELETE FROM teams WHERE (plan IN (${AVSLUTADE_PLANER.map(() => "?").join(", ")}) AND COALESCE(plan_changed_at, created_at) < ?) ` +
      "OR (plan = 'trial' AND created_at < ?)"
    ).bind(...AVSLUTADE_PLANER, nu - g.avslutadMs, nu - g.provmånadMs)],
    ["inbjudare", db.prepare(`UPDATE team_access SET invited_by = NULL WHERE invited_by IN (${föräldralösa})`).bind(nu - g.kontoMs)],
    ["konton", db.prepare("DELETE FROM users WHERE created_at < ? AND NOT EXISTS (SELECT 1 FROM team_access a WHERE a.user_id = users.id)").bind(nu - g.kontoMs)],
    ["ip-rader", db.prepare("DELETE FROM ai_usage WHERE subject LIKE 'ip:%' AND period < ?").bind(dag(nu - g.ipDagar * 86400000))],
    ["spärrfönster", db.prepare("DELETE FROM auth_throttle WHERE window_at < ?").bind(nu - g.spärrMs)],
  ];
  // I ordning, i en batch: teamen före kontona, så att ett konto vars sista
  // team just gallrats blir föräldralöst i samma körning.
  const svar = await db.batch(satser.map(([, s]) => s));
  const ut = {};
  satser.forEach(([namn], i) => { ut[namn] = (svar[i] && svar[i].meta && svar[i].meta.changes) || 0; });
  return ut;
}
