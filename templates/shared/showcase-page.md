# Showcase-sida (scroll-story)

Genereras i pipeline:n så att en körning blir en publik, säljbar
process-berättelse i galleriet (`site/`). Till skillnad från
team-presentation.md (en fristående single-file HTML för kundleverans) är
detta en sida i det **delade galleriet** som visar *hela processen* —
intake → research → skalning → [första projekt] → team — för att bevisa att
olika input ger olika team.

Allt innehåll kommer från intake, research, proposal (och för konsult-läget:
första-projekt-briefen). Inget fabricerat.

## Output

1. `site/<slug>.html` — scroll-storyn (länkar `showcase.css`, inte egen CSS)
2. Ett galleri-kort tillagt i `site/index.html`

`<slug>` = samma som portal-konfigurationen.

## Designsystem

Länka det delade arket: `<link rel="stylesheet" href="showcase.css" />`.
**Hitta inte på nya CSS-klasser** — använd bara de som finns i `site/showcase.css`.
Använd `site/bonusloots.html` som strukturell referensmall (kopiera dess
sektionsordning, klasser, stepnav och `reveal`-script rakt av).

## Sektioner (i ordning)

1. **`.stepnav`** (sticky) — länk hem + stegen. Team-builder: 1 Intake · 2 Research · 3 Skalning · 4 Förslag · 5 Teamet. Ai-consultant: lägg in "4 · Första projektet" och flytta Teamet till 5.
2. **`.hero`** — badge med läge/storlek/källa (team-builder) eller läge/storlek/AI-mognad (ai-consultant); rubrik med `.grad` på företagsnamnet; `.meta-pills`; `.stats` (3 nyckeltal: analyserade moment, agenter, avvisade).
3. **`#intake`** — `.quotes` med användarens egna ord (`.quote`, smärtpunkter får `.pain`). Läge B: rubrik "Vad vi antog" och `.quote` utan `.pain`.
4. **`#research`** — `.moments` (varje moment med `.fit high/med/low` för AI-lämplighet) + `.clusters` (kluster över ribban med `.cp` prioritet).
5. **`#skalning`** — `.decision`-box: skalningsbeslutet och motiveringen (storlek + antal kluster → antal agenter).
6. **(Bara ai-consultant) `#forsta-projektet`** — `.decision`/`.quotes`: projektnamn, problemet i kundens ord, vad som ska vara sant efter vecka 1, vem som äger det.
7. **`#proposal` / `#team`** — `.org` (VD → VD-assistent → specialister, fler rader för stora team) + `.cards` (ett `.card` per agent: ikon, namn, `.tag`, jobb, `.caps`, `.chips` för triggers, `.skbadge` för ev. skills). `is-ceo` / `is-cos` på VD- och assistent-korten.
8. **Avvisade** — `.rejected-grid` med `.rej` per avvisat moment och motivering.
9. **Möten** — `.meet-grid` med tre `.meet`.
10. **`footer`** — `.built`, `.fstats`, en `.try-live`-knapp `href="../portal/?team=<slug>"` (texten "💬 Prova teamet live →"), och `.backlink` till `index.html`. Läge B: lägg `.hyp-warn` före knappen.
11. **`<script>`** — samma IntersectionObserver som i bonusloots.html (lägger `.in` på `.reveal`-element).

Ikoner: VD ⚡, VD-assistent 🧭, domän-emoji för specialister.

## Galleri-kortet (`site/index.html`)

Lägg till **ett `.gcard`** i `.gallery` (skapa inte dubbletter — uppdatera om slug finns):

```html
<a class="gcard reveal" href="<slug>.html">
  <div class="gtop"><div class="gicon"><emoji></div><div><h3><Företag></h3><div class="gsub"><bransch></div></div></div>
  <div class="gdesc"><en mening></div>
  <div class="gmeta"><span class="gtag mode"><läge></span><span class="gtag"><storlek></span><span class="gtag"><N> agenter</span></div>
  <div class="go">Följ processen →</div>
</a>
```

Uppdatera även hero-siffrorna i `site/index.html` (antal körningar / agenter / moment) om de räknas där.

## Regler

1. **Allt från körningen.** Om proposalen har N agenter visar sidan N kort. Avvisade-sektionen är obligatorisk — den visar att teamet är genomtänkt.
2. **Bara befintliga klasser.** Allt utseende kommer från `showcase.css`.
3. **Idempotent.** Kör igen → skriv över `<slug>.html` och uppdatera (inte duplicera) galleri-kortet.
4. **Språk följer output.**
