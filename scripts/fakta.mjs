// Skriver portal/fakta-se.js ur functions/api/_fakta.js (OL8).
//
// Faktabasen har två läsare: portalen (ett klassiskt skript i webbläsaren,
// window.ATB_FAKTA_SE) och /mcp (en modul på servern). Källan är modulen;
// portalens fil är en genererad kopia. `npm run fakta` efter varje ändring —
// test/portal.mjs fäller bygget om kopian och källan skiljer sig.
//
//   node scripts/fakta.mjs          skriver filen
//   import { portalFil } …          ger filens innehåll (för testet)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FAKTA_SE } from "../functions/api/_fakta.js";

export function portalFil(data = FAKTA_SE) {
  return [
    "/* ============================================================",
    "   Svenska regler för småföretag — kurerad, KONTROLLERAD faktabas.",
    "   GENERERAD ur functions/api/_fakta.js med `npm run fakta`.",
    "   Ändra INTE här — ändra källan och kör skriptet. Samma regler når",
    "   kundens egen Claude/ChatGPT via verktyget svenska_regler i /mcp.",
    "   ============================================================ */",
    "window.ATB_FAKTA_SE = " + JSON.stringify(data, null, 2) + ";",
    "",
  ].join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync("portal/fakta-se.js", portalFil());
  console.log(`portal/fakta-se.js skriven: ${FAKTA_SE.regler.length} regler, kontrollerade ${FAKTA_SE.kontrollerad}.`);
}
