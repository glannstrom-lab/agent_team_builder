---
name: kvalitet-team
description: Grinda ett genererat eller ändrat AI-team mot kvalitetschecklistan och projektets kärnregel — att tre olika företag ska ge tre meningsfullt olika team. Använd efter varje körning av /build-team eller Buildern, när en ny teamfil läggs i portal/teams/, och ALLTID efter ändringar i prompts/, functions/api/_build.js (PORTAL_RULES, TEAM_SCHEMA), templates/shared/portal-team.md eller skalningsreglerna. Triggar också på "granska teamet", "är teamet bra", "blev output olika", "kvalitetschecklistan", "perspektiv", "divergens", "agenterna liknar varandra".
---

# Kvalitetsgrind för ett team

> **Om output ser likadant ut oavsett input är projektet trasigt.**
> Det är inget mjukt ideal — det är projektets existensberättigande. Den här
> skillen finns för att göra regeln mätbar i stället för intuitiv.

```bash
node .claude/skills/kvalitet-team/granska-team.mjs portal/teams/salong.js
node .claude/skills/kvalitet-team/granska-team.mjs --json utkast.json
node .claude/skills/kvalitet-team/granska-team.mjs --alla
```

Utdatan har tre nivåer: `✖` fäller, `⚠` är drift som ska bedömas, `·` är
mätvärden att läsa. Skriptet **exit 1** när något fäller.

## Vad som mäts maskinellt

Perspektiv-måttet hämtas ur `builder/builder.js` mellan `⟦DELAD-START⟧` och
`⟦DELAD-SLUT⟧` — **samma kod som körs vid generering hos kunden**. En kopia
här hade kunnat bli mildare än den som faktiskt fäller, vilket är precis den
fälla KA4 handlade om.

| Kontroll | Nivå | Kommentar |
|---|---|---|
| `entryAgent` finns bland agenterna | fäller | annars laddar portalen utan ingång |
| Minst ett avvisat förslag | fäller | checklistan kräver att minst en agent får nej |
| `DITT PERSPEKTIV` + `LEVERANS` finns | fäller | speglar builderns egen närvarokontroll |
| Perspektivöverlapp ≥ 0,70 inom teamet | fäller | det delade måttet, orört |
| LEVERANS tom eller nästan tom | fäller | **KA8**: builderns golv gäller bara perspektivet |
| LEVERANS saknar "klar(t) när" | fäller | utan dem går leveransen inte att svara ja/nej på |
| Överlapp ≥ 0,55 **mot ett annat team** | fäller | två företag har fått samma agent |
| Överlapp 0,42–0,55 mot annat team | varnar | över allt som mätts inom team |
| Perspektivöverlapp 0,55–0,70 inom teamet | varnar | under taket, långt över repots max 0,42 |
| Systemprompt eller LEVERANS under repots p10 | varnar | tunn text, mätt mot de kurerade teamen |
| Antal startförslag ≠ 3 | varnar | schemat kräver exakt 3 — se KA6 |
| Inga rutiner, eller inga `timeEstimate` | varnar | utan dem kan sparad tid aldrig visas (OM5) |

**Överlappet mot andra team är nytt här.** `test/teams.mjs` jämför agentpar
*inom* samma fil. Ingenting i repot jämför ett nytt team mot de team som redan
finns — och det är precis den riktning kärnregeln pekar.

## Kalibrering: mät om, höj inte

Referensraden överst i utdatan räknas fram ur repot vid varje körning, inte ur
en siffra i en fil: 60 agenter i 14 team, systemprompt 2 453–4 931 tecken
(median 3 052), LEVERANS median ~450.

Taket 0,70 är mätt, inte gissat: 108 agentpar i `portal/teams/` gav max 0,42,
37 par i `examples/` max 0,38. **Höj det inte för att ett bygge föll — mät om
fördelningen först.** Ett fällt team ska skrivas om.

Uppmätt 2026-09-06: alla fjorton kurerade team passerar, med 35 varningar. Det
är rätt kalibrering — grinden fäller inte på det som redan finns, så ett `✖` är
signal och inte brus.

## Det maskinen inte kan avgöra

Kör igenom de här för hand, med utdatan framför dig:

- **Har VD/ingångsagenten ett operativt jobb?** För ett solo-projekt räcker
  inte abstrakt strategi — då blir agenten teater. Näst viktigaste regeln efter
  divergensen. Skriptet skriver ut ingångsagentens LEVERANS för bedömningen.
- **Kan varje agent motiveras med ett konkret fynd ur researchen?** Ingen
  motivering, ingen agent. Samma ribba för skills.
- **Skalningen** mot `docs/scaling.md` — och för konsult-läget: får en
  AI-nybörjare färre agenter än storlekstabellen föreslår?
- **Vägrar VD-assistenten kalla till möte** när en enskild agent räcker?
- **Konsult-läget:** uppfyller första projektet alla kriterier i
  `docs/first-project.md`?

## När output ser likadant ut för två kunder

Leta i den ordningen — orsaken ligger nästan alltid uppströms:

1. **Intaget.** `KA7`: enkätvägens hela skydd är femton tecken. Ett rent
   kryssintag kan ge två kunder underlag som skiljer sig på ~110 tecken av
   ~1 250. Ser två team lika ut, jämför intagen först.
2. **Researchsteget.** Hittar det konkreta *arbetsmoment* — vad som görs i
   veckan — eller branschtitlar? Om det senare faller allt nedströms.
3. **Sammanställningen.** `PORTAL_RULES` och `TEAM_SCHEMA` i
   `functions/api/_build.js` styr formen hårt. Ett schema som tvingar fram
   samma struktur är rätt; en prompt som föreslår samma *innehåll* är fel.
4. Först därefter: modellen.

## Känd svaghet i det delade måttet

`perspektivText()` letar rubriken med `indexOf`. Det duger för
`DITT PERSPEKTIV`, men samma grepp på `LEVERANS` träffar ordet i löpande text
("…leveranser och design systems-produkten…") och klipper ut fel stycke —
uppmätt på `studio.js` 2026-09-06. Skriptet här ankrar därför rubriker vid
radbörjan. Skrivs en agent någon gång med "ditt perspektiv" i brödtexten före
rubriken får det delade måttet samma problem.
