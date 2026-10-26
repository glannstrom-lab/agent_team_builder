/* ============================================================
   Svenska företagsdatum — kurerat datapaket för portalens årshjul.
   TYPISKA datum för företag med kalenderår som räkenskapsår och
   kvartalsmoms; exakta datum varierar (helgförskjutning, momsperiod,
   bokslutsdatum). Portalen visar alltid en "kontrollera Skatteverket"-
   brasklapp. forms: "enskild" | "ab" | "anstallda" | "alla".
   Uppdatera listan här — ingen kod behöver röras.
   ============================================================ */
window.ATB_DEADLINES_SE = [
  { label: "Momsdeklaration kvartal 4 (senast 12 feb)", month: 2, day: 12, forms: ["enskild", "ab"] },
  { label: "Momsdeklaration kvartal 1 (senast 12 maj)", month: 5, day: 12, forms: ["enskild", "ab"] },
  { label: "Momsdeklaration kvartal 2 (senast 17 aug)", month: 8, day: 17, forms: ["enskild", "ab"] },
  { label: "Momsdeklaration kvartal 3 (senast 12 nov)", month: 11, day: 12, forms: ["enskild", "ab"] },
  { label: "Inkomstdeklaration 1 (senast 2 maj)", month: 5, day: 2, forms: ["enskild"] },
  { label: "Årsredovisning till Bolagsverket — bokslut 31 dec (senast 31 jul)", month: 7, day: 31, forms: ["ab"] },
  { label: "Inkomstdeklaration 2 — AB med bokslut 31 dec (senast 1 aug)", month: 8, day: 1, forms: ["ab"] },
  { label: "Arbetsgivardeklaration, AGI", day: 12, exceptions: { 1: 17, 8: 17 }, monthly: true, forms: ["anstallda"] },
];

/* Nästa gång en rad infaller, räknat i hela dagar från i dag. Förfallodagen
   själv är dag 0 och räknas som kommande — förut jämfördes datumet med
   klockslaget, så klockan 09 på förfallodagen hoppade kortet fram ett år
   (SR3, 2026-10-26). `exceptions` är månad → dag för månadsrader: AGI är den
   17:e i januari och augusti (SR2). Månadsraderna får datumet i etiketten,
   eftersom det skiljer sig mellan månaderna.
   Helgförskjutning görs inte här än (SR4) — kortet säger "kontrollera". */
window.ATB_NASTA_DEADLINE = function (d, now) {
  const MÅN = ["jan", "feb", "mars", "april", "maj", "juni", "juli", "aug", "sep", "okt", "nov", "dec"];
  const idag = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dagI = (m) => (d.exceptions && d.exceptions[((m % 12) + 12) % 12 + 1]) || d.day || 1;
  let when;
  if (d.monthly) {
    when = new Date(idag.getFullYear(), idag.getMonth(), dagI(idag.getMonth()));
    if (when < idag) when = new Date(idag.getFullYear(), idag.getMonth() + 1, dagI(idag.getMonth() + 1));
  } else {
    when = new Date(idag.getFullYear(), (d.month || 1) - 1, d.day || 1);
    if (when < idag) when = new Date(idag.getFullYear() + 1, (d.month || 1) - 1, d.day || 1);
  }
  const days = Math.round((when - idag) / 86400000);
  const label = d.monthly ? `${d.label} (senast ${when.getDate()} ${MÅN[when.getMonth()]})` : d.label;
  return { when, days, label };
};
