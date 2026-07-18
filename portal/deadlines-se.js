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
  { label: "Momsdeklaration kvartal 2 (senast 12 aug)", month: 8, day: 12, forms: ["enskild", "ab"] },
  { label: "Momsdeklaration kvartal 3 (senast 12 nov)", month: 11, day: 12, forms: ["enskild", "ab"] },
  { label: "Inkomstdeklaration 1 (senast 2 maj)", month: 5, day: 2, forms: ["enskild"] },
  { label: "Årsredovisning till Bolagsverket — bokslut 31 dec (senast 31 jul)", month: 7, day: 31, forms: ["ab"] },
  { label: "Inkomstdeklaration 2 — AB med bokslut 31 dec (senast 1 aug)", month: 8, day: 1, forms: ["ab"] },
  { label: "Arbetsgivardeklaration, AGI (senast den 12:e)", day: 12, monthly: true, forms: ["anstallda"] },
];
