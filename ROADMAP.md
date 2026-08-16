# Roadmap

Från genomgången 2026-08-15 · sex parallella linser + egen verifiering.
Översikt: <https://claude.ai/code/artifact/2b4f7c0a-db8d-4387-9f4f-c5dbb73dd77b>

> Den här filen är arbetslistan. `docs/roadmap.md` (passindelningen) och
> `docs/lansering.md` (hålen) står kvar och gäller fortfarande — det som är
> nytt eller ändrat sedan 2026-08-07 står här, med ID:n som används i
> commit-meddelanden.
>
> **Verifieringsgrad:** `mätt` = kört eller räknat. `läst i koden` = öppnad
> och kontrollerad rad, men inte exekverad.

## Nu — riktiga fel

- [ ] **K1** Teckentaket kringgås: `content` som array mäts som 15 tecken · `functions/api/ai.js:239` · `mätt` · ~30 min
- [ ] **C1** Strikt schema blockerar `firstProject`, `seasons`, `triggers`, `scaling` som prompten beställer · `builder/builder.js:893-907` mot `:963` · `mätt` · ~45 min
- [ ] **R1** Kvittosidan säljer in ett nyckelkrav som inte finns, direkt efter betalning · `portal/aktivera.html:81` · `läst i koden` · ~10 min
- [ ] **P5** "Kopiera delningslänk" lovar åtkomst men ger mottagaren betalvägg · `portal/app.js:2754` mot `:578` · `läst i koden` · ~1–2 h
- [ ] **K3** Globala dygnstaket delas mellan gratis byggtrafik och betalande kunder · `functions/api/ai.js:326-329` · `läst i koden` · ~1–2 h
- [ ] **K2** Takkontrollen sker före uppströmsanropet, bokföringen efter — fönstret är hela genereringstiden · `functions/api/ai.js:303-329`, `377-398` · `läst i koden` · ~3–4 h

## Sedan — skav som märks

- [ ] **D5** `_headers` ger no-cache åt JS men inte åt CSS · `_headers:23-47` · `mätt` · ~5 min
- [ ] **R6** FAQ säljer ett "konsultpaket" som inte finns i prislistan · `index.html:608` · `läst i koden` · ~5 min
- [ ] **C7** `team.language` hårdkodad till `"sv"`, mot designprincip 9 · `builder/builder.js:948` · `läst i koden` · ~10 min
- [ ] **R2** Varje branschsida påstår att kunden behöver egen AI-nyckel · `verticals/app.js:89` · `läst i koden` · ~10 min
- [ ] **R5** Galleriet påstår fel motor ("Claude") efter modellbytet · `site/ikea.html`, `site/coachonline.html:258` · `läst i koden` · ~10 min
- [ ] **R3** Nyckeltext kvar i "Töm allt" och i portalens meta description · `portal/app.js:1516`, `portal/index.html:7`, `site/en-vecka.html:200` · `läst i koden` · ~15 min
- [ ] **C2** Personläget i `research.md` går inte att nå från `/build-team` · `prompts/team-builder/intake-interview.md:91-117` · `läst i koden` · ~15 min
- [ ] **C3** `proposal.md` tillåter uttryckligen generisk VD-output, mot `research.md` · `prompts/shared/proposal.md:44-47` · `läst i koden` · ~15 min
- [ ] **D4** Drift-skripten kör `npx --yes wrangler` utan pinnad version · `package.json:8-15` · `mätt` · ~20 min
- [ ] **R7** Tidsåtgången för ett bygge anges med fem olika värden; uppmätt är 28 s · `index.html`, `builder/builder.js` · `läst i koden` · ~20 min
- [ ] **R8** Builderns nedladdning använder inte den lagade `downloadFile()` · `builder/builder.js:1649` · `läst i koden` · ~20 min
- [ ] **C5** `templates/shared/portal-team.md` har glidit isär från `builder.js` · `templates/shared/portal-team.md:7-8, 26, 74-85` · `läst i koden` · ~30 min
- [ ] **D2** SHELL-bumpen i `portal/sw.js` är fortfarande ett minneskrav · `build-dist.mjs`, `portal/sw.js:9` · `mätt` · ~45 min
- [ ] **D6** Testet kollar prisnivåernas namn, aldrig beloppen · `test/stripe.mjs:108-113` · `läst i koden` · ~45 min
- [ ] **BL1** Interna arbetsanteckningar följer med i skarp `dist/` · `build-dist.mjs` (saknar comment-strip) · `mätt` · ~45 min
- [ ] **K5** `allowAttempt` gör SELECT→UPDATE utan atomicitet · `functions/api/auth/_lib.js:105-121` · `läst i koden` · ~1–2 h
- [ ] **BL2** Ångerrätten saknar knapp — kodens egen TODO, vars villkor nu inträffat · `villkor.html:508-514` · `läst i koden` · ~1–2 h
- [ ] **C6** Inget golv på systemprompternas innehåll; två teamfiler saknar `DITT PERSPEKTIV` helt · `builder/builder.js:980` · `mätt` · ~2 h
- [ ] **C4** `examples/` är facit men saknar Perspektiv, Leverans och "Klart när" · `examples/**/test-output.md` · `mätt` · ~2 h
- [ ] **K4** Bygg-rutten är en oautentiserad LLM-proxy och en väg tillbaka för uppsagda · `functions/api/ai.js:252-293` · `läst i koden` · ~4–6 h

## Framåt — utveckling

- [ ] **D1** Ingen CI: 69 gröna tester körs bara när någon minns dem · `.github/` saknas · `mätt` · ~30 min
- [ ] **P1** Ingen mätning av var köpresan läcker · `index.html` (inga taggar) · `mätt` · ~1 h
- [ ] **D3** Ingen felövervakning; "krediten är slut" skrivs till en logg ingen läser · `functions/api/ai.js:637` · `mätt` · ~2 h
- [ ] **P6** Auto-körda rutiners "ligger klar"-bevis överlever inte en omladdning · `portal/app.js:2242` · `läst i koden` · ~2 h
- [ ] **BL4** Ingen backup av D1 och ingen plan för längre frånvaro · `scripts/` (saknas), `wrangler.toml` · `mätt` · ~2 h
- [ ] **BL3** Konkurrensbilden är förbigången: aikollegorna.se leder med EU-drift · `docs/omvarldsresearch-2026-07-17.md` · `mätt` · ~2 h
- [ ] **P2** Gratisbygget fångar ingen e-post — övergiven körning är borta för alltid · `builder/builder.js:1432-1493` · `läst i koden` · ~4 h
- [ ] **P4** Grundteamets agenter går att lägga till, aldrig redigera eller avsluta · `portal/app.js:2617-2691` · `läst i koden` · ~5 h
- [ ] **P3** Provmånaden har ingen utgående livlina utanför portalen · `functions/api/_plan.js:65-86` · `mätt` · ~6 h

## Dokumentationsfel — rättade 2026-08-15

Rättade direkt i filerna (rent git-träd). Raderna står i terminalsvaret.

- `CLAUDE.md` — påstod att nyckelvägen fanns kvar i `atb-claude.js` och i portalens `renderKeySetup()`. Ingetdera stämmer, och samma fil sa motsatsen några stycken tidigare.
- `docs/roadmap.md` pass 3.2 — "50 000 tecken" var fel; `MAX_INPUT_CHARS` har varit 200 000 i hela filens historik.
- `docs/roadmap.md` pass 5 — påstod att bara lyckade anrop bokförs; `bokför(null)` räknar upp `calls` även vid nätverksfel och HTTP-fel.
- `docs/roadmap.md` pass 5 — "sw.js står på v22" (den står på v26) och "fyra commits" (uppmätt: 18 av 37).
- `docs/roadmap.md` pass 6 — 429-fyndet är redan åtgärdat, och radnumren för nyckeltexten i `portal/app.js` pekar på annan kod i dag.

## Klart

- [x] **B1** `openrouter is not defined` — löst 2026-08-16. Förgreningen mot
  Anthropic-format togs bort helt: `/api/ai` skickar uppströmsbytena vidare
  orörda (`functions/api/ai.js:599`) och uppströms är OpenRouter, så det finns
  ett format att läsa. `portal/sw.js` bumpad till v27 — utan den hade fixen
  inte nått någon som redan öppnat portalen. Verifierat med en stubbad SSE:
  strömmad text, tokenförbrukning, chunk delad mitt i en JSON-rad, felram
  mitt i strömmen och 402 från betalväggen. 69 tester gröna.

  **Buggen låg i produktion i tio dagar** (6–16 aug) och sänkte en demo för
  en vän. Den var känd och uppmätt sedan 15 aug, uppskattad till fem minuter,
  och blev ändå liggande under sex punkter med lägre insats. Ett fel som gör
  produkten stum lagas samma pass som det hittas — det köar inte.
