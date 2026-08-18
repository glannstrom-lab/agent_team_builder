# Omvärldsresearch 2026-08-18

> Uppföljning av `omvarldsresearch-2026-07-17.md` — en månad senare. Den förra
> filen kartlade kategorin; den här mäter **funktionsglappet**: vad
> konkurrenterna har som vi inte har, vad vi har som är bättre, och vad som
> inte är värt att kopiera. Svarar samtidigt ut **BL3** i `ROADMAP.md`
> ("konkurrensbilden är förbigången").
>
> Det här är en granskning av *marknaden*, inte av projektet. Regeln i
> `CLAUDE.md` om att inte skriva fler daterade granskningsfiler gäller
> projektgranskningar och rörs inte.

## 1. Vad som ändrats på en månad

- **Det största hotet är inte Sintra — det är Anthropic själva.**
  *Claude Cowork* (enligt sekundärkällor släppt 9 april 2026) är en flik i
  Claude Desktop där Claude får filsystemsåtkomst, kör schemalagda uppgifter
  och arbetar i bakgrunden — "en AI-kollega du ger en projektmapp". Ovanpå
  det kom en **Small Business-bundle** (13 maj) med färdiga kopplingar till
  QuickBooks, HubSpot, Google Workspace, Canva, Docusign m.m., och
  godkänn-innan-det-skickas som bärande mekanik.
  **Det är vår mappfunktion plus våra rutiner, från plattformsägaren, gratis
  på varje betald Claude-plan (~210 kr/mån).**
- **ChatGPT Workspace Agents** täcker samma yta från molnsidan: delade
  team-agenter i ChatGPT och Slack. Skillnaden mot Cowork är
  solo-på-laptop mot delat-i-molnet.
- **Vorker.ai är ute ur väntelistan och prissatt.** €25/mån (ord. €49)
  Starter, €59/mån (ord. €119) Standard, gratis väntelistenivå. Sajten är
  **på engelska** — men de har byggt **Fortnox- och Visma Spiris-integrationer**
  och äger därmed den svenska affärssystemskopplingen.
- **AI Kollegorna (aikollegorna.se) är ett skarpare hot än väntat.**
  4 900 kr/mån + ~1 000 kr uppsättning, 2 månaders bindning. Tre namngivna
  agenter (Erik sälj, Moa webb/SEO, Louise innehåll), **EU-drift på dedikerad
  hårdvara hos kunden**, "ingen data lämnar era lokaler", human-in-the-loop,
  gratis 30-minuterskonsultation. De äger svensk done-for-you ovanför oss.
- **Sintra tappade förtroende.** Omläggningen till "Sintra X" gav
  **250 krediter/mån** — kunder som köpt "unlimited" blev metered och bränner
  krediterna på timmar. Återkommande klagomål i recensionerna: helpers kan
  **inte dela kontext med varandra**, inga custom agents, ingen mänsklig
  onboarding.
- **Marblism gick åt motsatt håll.** $39/mån platt, **inga kreditak**, delat
  minne ("The Brain"), och agenterna läser varandras output — Sonny gör
  sociala inlägg av Pennys bloggtext.
- **Marknadssiffror värda att citera:** Gartner spår att >30 % av nytt
  SaaS-spend i SMB-segmentet går till agentiska laster i slutet av 2026;
  Forresters Q1 2026-mätning: **41 % av europeiska SMB kör minst en AI-agent
  i produktion.** Kategorin behöver inte längre förklaras — den behöver
  differentieras.
- **EU AI Act:** högriskobligationerna trädde i kraft **2 augusti 2026**. Vi
  ligger i "limited risk", så kravet på oss är transparens (kunden ska veta
  att motparten är AI) plus GDPR-basen. Billigt att uppfylla — men det står
  inte någonstans hos oss i dag.

## 2. Funktioner de har som vi inte har

| # | Funktion | Vem | Vår position |
|---|---|---|---|
| 1 | **Verktygsåtkomst / integrationer** | Lindy 5 000+, Sintra 15+, Marblism (Gmail/Outlook, WordPress, CRM, socialt), Vorker (Fortnox, Visma), Dust (Salesforce, Notion, Teams) | **Noll.** Våra agenter kan tala; deras kan göra |
| 2 | **Autonomi utan inloggad användare** | Alla — schemalagt och händelsestyrt, dygnet runt | Exakt en: veckobrevet. Rutiner körs vid sidöppning |
| 3 | **Självfyllande delat minne** | "The Brain" (Sintra, Marblism) lär sig ton och fakta av användningen | Vårt minne är bättre kontrollerat (förslag + godkännande) men kunden matar det |
| 4 | **Agent-till-agent-kedjor utanför mötet** | Marblism: agent A:s leverans blir agent B:s indata | Mötet ger perspektiv, inte produktionskedja |
| 5 | **Live-insyn och styrning under körning** | Dust *Steering* (april 2026): se varje tanke och verktygsanrop, styr om mitt i. Lindy: per-run-logg | Vi visar en spinner |
| 6 | **Mallbibliotek som säljargument** | Lindy 1 000+ agentmallar | Tolv branschsidor, inga körbara mallar bakom |
| 7 | **Riktigt fleranvändarstöd** | Dust och ChatGPT Workspace är multiplayer från start | Rutterna finns (`functions/api/team/invite.js`), gränssnittet saknas — **P5** |
| 8 | **Kanaler där kunden redan är** | Slack, Teams, WhatsApp, telefon/röst | PWA och ett veckobrev |
| 9 | **White-label för byråer** | Cyndra, Vendasta, GoHighLevel | Konsult-läget är ett verktyg, inte ett återförsäljarprogram |
| 10 | **EU-drift som uttalat löfte** | AI Kollegorna: "data lämnar aldrig era lokaler" | OpenRouter → `openai/gpt-oss-120b`, geografi osagd |
| 11 | **Godkännandeflöde som produktmekanik** | Marblism, AI Kollegorna, Claude Small Business: föreslå → godkänn → skickas | Vi har inget att skicka, alltså ingen aha-scen |
| 12 | **ROI-rapportering** | "Vi sparade dig X timmar" | Puls-kort och "Veckan som gick" — men ingen siffra |
| 13 | **Mänsklig onboarding** | AI Kollegorna: gratis 30 min | Self-serve-only, precis den kritik Sintra får |

## 3. Vad vi har som är bättre — och värt att utveckla

1. **Skräddarsytt per företag. Fortfarande unikt.** Sintra säljer 12 fasta
   helpers, Marblism 6, AI Kollegorna 3, Vorker 1. **Ingen genererar teamet ur
   kundens egen verksamhet.** Kärnregeln är exakt luckan — men bara värd något
   om den syns. Kopplar till **KA4** (perspektiven mäts som närvaro, inte
   olikhet) och **KR2** (framsidans "bevis" är påhittat trots sex riktiga
   körningar i `examples/`).
2. **Att en agent får nej.** Personalliggaren med överstrukna avslag är
   motgiftet mot "AI-teater" — precis det recensenterna anklagar Sintra och
   Marblism för. Ingen konkurrent gör anspråk på att säga nej. Starkaste
   säljargumentet vi har, och det ligger begravt i en tabell längst ner.
3. **Mötesfunktionen.** Sintras mest citerade brist är att helpers inte kan
   dela kontext; Lindys är att den bygger individuella flöden, inte team. Vi
   har oberoende perspektiv → sammanställd mötesanteckning. Gör mötet till
   huvudnumret i demon, inte en knapp bland andra i arbetsytan.
4. **Svenska på riktigt.** Vorker är engelskspråkig med svenska integrationer;
   Sintra/Marblism/Lindy är engelska. Bara AI Kollegorna är svenskt — till
   4 900 kr/mån. Vi har dessutom **svenska myndighetsdatum i årshjulet**
   (`portal/deadlines-se.js`), vilket ingen annan har.
5. **Mappen på datorn / ni äger er data.** SMB-konkurrenterna är alla
   molnsilos med export som eftertanke; vår `.md`-fil i OneDrive är
   inlåsningsfri. Cowork konkurrerar nu här — men mot Sintra/Marblism/Vorker
   är det ett rent övertag. Knyt ihop med EU/GDPR-argumentet till **en sida**.
6. **Priset i svensk kontext.** 290 kr/mån mot 4 900 (AI Kollegorna),
   ~650 kr (Vorker Standard), ~430–1 100 kr (Sintra). Billigast **och**
   bredast — men jämförelsen står ingenstans.
7. **Inga krediter.** Sintras enskilt mest skadliga funktion är kreditmätaren.
   Vår fair use på 1 000 svar/mån och det medvetna bortvalet av
   kostnadsvisning är rätt — "inga krediter, ingen mätare" är ett säljargument
   som inte används.
8. **90 kr provmånad med riktig livscykel.** Lägre tröskel än Marblisms
   7-dagars pengarna-tillbaka och Vorkers väntelista.
9. **Växtvägen.** "Utveckla teamet" via tidigare avvisade agenter — en utredd
   väg från 3 till 8 agenter. Ingen konkurrent har det, för ingen har utrett
   vad kunden *inte* fick.
10. **Retentionlagret.** Veckostreak, "Veckan som gick", kvartalsöverblick,
    veckobrev. Marblism har en dagsrapport; resten har ingenting. Vi är längst
    fram i segmentet här.

## 4. Vad som inte är värt att kopiera

- **Kreditsystem.** Sintras enda strukturella misstag. Upprepa det inte.
- **"Ersätt dina anställda"-retoriken.** Punkteras i varje recension ("starka
  utkast, inte utförande"). Vår "arbetsmoment, inte roller" åldras bättre.
- **5 000 integrationer.** Lindys bredd är ett byggarverktygs bredd och
  genererar kreditångest och komplexitet. Tar vi integrationer: **en**, väl
  gjord.
- **Dedikerad hårdvara hos kunden** (AI Kollegorna). Bryter mot princip 8
  (noll infrastruktur) och är hela skälet till att de kostar 4 900.

## 5. De fem dragen — som ID:n i ROADMAP.md

- **OM1** Bestäm hållning till Claude Cowork och ChatGPT Agents.
- **OM2** En sida om data, drift och EU (täcker även AI Act-transparensen).
- **OM3** Flytta avslaget och mötet till framsidan — med en riktig körning.
- **OM4** Välj integrationsspår medvetet: en enda, eller sälj bortvalet.
- **OM5** Timbesparingssiffra i "Veckan som gick" och i veckobrevet.

Motiveringarna står i `ROADMAP.md` under *Framåt — utveckling*.

## 6. Källor

**Svenska/nordiska**
- Vorker.ai — <https://vorker.ai/> (produkt + priser, hämtat 2026-08-18)
- Tidningen Näringslivet om Vorker — <https://www.tn.se/entreprenorskap/47327/>
- AI Kollegorna — <https://www.aikollegorna.se/> och <https://www.aikollegorna.se/priser>

**Internationella konkurrenter**
- Sintra-recension (eesel) — <https://www.eesel.ai/blog/sintra-ai-review>
- Sintra-alternativ (Lindy) — <https://www.lindy.ai/blog/sintra-ai-alternatives>
- Marblism-recension — <https://techglimmer.io/marblism-ai-review-2026/>
- Lindy prissättning 2026 — <https://www.cloudtalk.io/blog/lindy-ai-pricing/>
- Dust: Steering — <https://docs.dust.tt/changelog/steering-conversations-that-keep-up-with-you>

**Plattformsägarna**
- Claude Cowork-guide — <https://techsy.io/en/blog/claude-cowork-guide>
- Cowork mot ChatGPT Workspace Agents — <https://adapt.com/blog/cowork-vs-workspace-agents>
- Claude for Small Business — <https://www.eigent.ai/blog/claude-for-small-business>

**Marknad och regelverk**
- AI-agentplattformar för SMB 2026 — <https://www.siit.io/blog/best-ai-agent-platforms-small-business>
- EU AI Act för SMB, augusti 2026 — <https://beyondscale.tech/blog/eu-ai-act-compliance-smbs-guide>
- White-label AI-anställda för byråer — <https://www.cyndra.ai/press/cyndra-agency-white-label>
