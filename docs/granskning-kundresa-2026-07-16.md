# Kundresegranskning: "Anna hittar Mitt AI-team" (2026-07-16)

> **Status 2026-08-05:** åtgärdade: P0-2 (domän), P2-15 (kopiera/exportera),
> P2-16 (dokumentkontext), P2-17 (företagsminne), P2-19 (historik-export),
> P2-21 (kostnadsmätare), P2-22 (checklista), P3-28 (svenska felmeddelanden).
> Allt annat är öppet. De fyra som fortfarande **bryter kedjan** är P0-1
> (mailto-platshållaren), P0-3 (OG-taggar), P0-4 (pris utan kassa) och P1-7
> (mallade demosvar) — samma fyra som inte går att lösa genom att skriva
> JavaScript. Se `docs/granskning-helhet-2026-08-05.md`.

Persona-baserad genomgång av hela resan från kollegans tips till fullskalig
användning, med 30 prioriterade förbättringar. Persona: **Anna, 46, delägare i
en redovisningsbyrå med fyra anställda.** Har provat ChatGPT lite grann. En
kollega på en nätverksträff sa "kolla *mitt AI-team*, en kille i Lindesberg
bygger AI-team åt småföretag".

## Resan och var den går sönder

### Steg 0 — hitta dit (❌ resan dör ofta här)
- Anna skriver `mittaiteam.se` på mobilen. **Domänen svarar inte** (ej pekad
  ännu). Hon googlar "mitt ai team" och drunknar i Microsoft Copilot-resultat.
  För de flesta slutar resan här.
- Kollegan skickar i stället länken `agent-team-builder-2xy.pages.dev` —
  ser ut som en skräplänk, och eftersom **inga OG-taggar finns** blir
  förhandsvisningen i Messenger/Teams tom. Lågt förtroende före första klicket.

### Steg 1 — landningssidan (✓ bra start, ❌ trasig konvertering)
- **Fungerar:** svenska, tydlig hero, begriplig "tre steg", demo utan
  registrering, ärlig FAQ (snickar-liknelsen är utmärkt).
- **"Boka ett samtal" öppnar `mailto:din@email.se`** — en platshållaradress.
  Konverteringsvägen för det populäraste paketet (14 900 kr) är bokstavligen
  trasig, och sajten ser övergiven ut. Dessutom: mailto kräver mailklient —
  många på jobbdatorer har bara webmail, då händer ingenting alls.
- **Anonymitet:** ingen "vem står bakom", inget namn/foto/orgnr, inga
  kundcitat. En redovisningsbyrå köper inte konsulttjänster av en anonym sajt.
- **"Bygg själv 2 900 kr" går till Builder — där inget köp finns.** Ingen
  kassa, inget konto. Anna kan inte betala ens om hon vill; alternativt märker
  hon att allt är gratis och undrar vad priset avser.
- FAQ saknar byråns riktiga frågor: GDPR, personuppgiftsbiträde, var data
  lagras, avtal/villkor. Ingen integritetspolicy-sida finns.
- Löftet "0 teknik du behöver kunna" krockar med vad som kommer i steg 4.

### Steg 2 — demon (✓ formen, ❌ värdet)
- **Fungerar:** demobannern förklarar läget, startförslagen är klickbara,
  strömningen känns äkta, demo=1 följer med i länkar.
- **Demosvaren är mallade** (`demoReply` ekar tillbaka frågan i samma struktur
  oavsett agent). Annas andra fråga avslöjar mönstret på under en minut. Hon
  kom för att se om AI:n kan hennes vardag — och fick teater. Detta är det
  största intressetappet i hela resan.
- **Fel bransch:** hubens alla demo-CTA:er pekar på coachonline. Anna driver
  redovisningsbyrå — Lindgren Bokföring-caset finns ju! Ingen väg i demon att
  välja "min bransch".
- **Ingen väg vidare:** bannern säger "koppla in din nyckel" (ett tekniskt
  nästa steg), inte "vill du ha ett eget team? boka samtal / se priser". Den
  som är imponerad har ingen knapp att trycka på.
- Mobil: hub/galleri delvis okalibrerade (känd lucka) — och trafiken från en
  nätverksträff är mobil.

### Steg 3 — galleriet (✓ säljande, ⚠ långt)
- Scroll-stories är övertygande men långa; ingen TL;DR eller "hoppa till
  resultatet". Anna vill se teamet och nyttan, inte hela processen.
- Team-builder-exemplen (lerverk/norrskenspodden/wikander) saknar sidor (känt).

### Steg 4 — Bygg själv (❌ nyckelmuren)
- Första mötet är **"Klistra in din Anthropic API-nyckel"**. För Anna betyder
  det: skapa konto på en engelskspråkig utvecklarkonsol, verifiera kort, förstå
  prepaid credits, hantera en `sk-ant-...`-sträng. 30+ minuter developer-arbete
  — tre klick efter löftet "0 teknik". Här tappas nästan alla icke-tekniska.
- Builderns demoläge spelar upp en **inspelad körning för ett annat företag**.
  Det Anna vill är att mata in SIN byrå och se en skiss — det finns inte utan
  nyckel.
- Med nyckel: ingen kostnadsindikator under körningen ("vad kostar det här
  just nu?").

### Steg 5 — fullskalig användning på byrån (❌ arkitekturtaket)
- **localStorage-arkitekturen:** nyckel + historik sitter i EN webbläsare på EN
  dator. Fyra anställda ⇒ fyra separata uppsättningar, delad nyckel utan
  åtskillnad, ingen delad historik, datorbyte = allt borta, webbläsarens
  "rensa data" raderar allt utan backup. För ett företag är detta det verkliga
  taket för "fullskalig" användning — och det står inte tydligt någonstans.
- **Ingen filuppladdning/dokumentkontext** i portalen. Byrån vill klistra in
  kundunderlag, mallar, SIE-filer. Utan det blir svaren generiska igen — själva
  problemet produkten säger sig lösa återuppstår i användningsledet.
- Inget delat "företagsminne" som alla agenter ser (utöver systemprompterna).
- Ingen export/kopiera-funktion per svar — output ska ju in i mail och dokument.
- PWA-installation är osynlig; ingen prompt eller knapp.
- Teamuppdatering: oklar väg för kunden (ny Builder-körning skriver utkast;
  vad händer med historiken?).

## 30 förbättringar i prioriterad ordning

### P0 — trasigt eller direkt konverteringsblockerande
1. **Byt `mailto:din@email.se` mot riktig kontaktväg.** Helst ett litet
   formulär eller Calendly-länk i stället för mailto. (5 min-fixen med störst
   effekt av alla.)
2. **Peka mittaiteam.se (+ www) mot Pages-projektet** och lägg redirect från
   pages.dev-adressen. Namnet är ogooglebart tills domänen svarar.
3. **OG-taggar + delningsbild** på hub, portal, galleri, verticals.
   Kollegadelning ÄR huvudkanalen — förhandsvisningen är första intrycket.
4. **Gör "Bygg själv"-paketet ärligt:** koppla Stripe-kassan (M2a-2) eller
   ändra CTA till "Prova gratis under beta". Ett pris utan kassa skadar
   förtroendet åt båda håll.
5. **Branschmatchad demo:** låt demo-CTA:n öppna ett bransch-val (eller minst
   2–3 snabbval: byrå/butik/solo) → rätt demoteam. Lindgren Bokföring finns
   redan — använd den för Annas segment.
6. **Konverterings-CTA i demoportalen:** "Vill ni ha ett eget team? → Boka
   samtal / Se priser" synligt i bannern/sidfoten, inte bara "koppla in nyckel".

### P1 — största intresse- och förtroendetappen
7. **Riktiga demosvar:** ersätt mall-generatorn med inspelade äkta Claude-svar
   per startförslag (10–15 per demoteam räcker). Demon ska visa värdet, inte
   formen.
8. **"Vem står bakom"-sektion:** namn, foto, Lindesberg, orgnr, länk till
   glannstrom.se. Försiktiga branscher köper människor, inte sajter.
9. **Guidad nyckel-onboarding på svenska:** steg-för-steg med skärmdumpar för
   console.anthropic.com inkl. budgetgräns — eller en 2-minuters video.
10. **Smakprov utan nyckel i Buildern:** kör research-steget server-side via
    befintliga Pages Functions (hårt rate-limitat) så besökaren kan mata in
    SITT företag och få en teamskiss gratis. Full körning kräver nyckel/köp.
    Detta är konverteringsmotorn som saknas.
11. **Mobilgenomgång** av hub + galleri (känd lucka i granskningsbackloggen).
12. **GDPR/juridik:** integritetspolicy-sida + FAQ-poster om datalagring
    (lyft att D1 ligger i EU!), Anthropics datapolicy, personuppgiftsbiträde,
    villkor. Utan detta stannar varje reglerad bransch.
13. **Kundbevis:** en pilotkund med citat och en siffra ("sparar X h/vecka").
    Tills dess: märk exemplen ärligt som illustrationer.
14. **E-postfångst:** "Få exempelteamet för din bransch som PDF" — fånga de
    som inte bokar direkt.

### P2 — fullskalig användning (portalen som arbetsverktyg)
15. **Kopiera/exportera per svar** i portalen (kopiera-knapp, ev.
    markdown/mail-export). Output ska vidare in i dokument.
16. **Dokumentkontext:** klistra in/ladda upp text som agenten får som
    underlag (text-first räcker långt — filparsning kan vänta).
17. **Delat företagsminne:** en redigerbar "Om vårt företag"-text i portalen
    som injiceras till alla agenter.
18. **Multi-enhet/fleranvändare:** det riktiga svaret är managed-läget (M2b).
    Tills dess: dokumentera "en dator, en webbläsare"-begränsningen ärligt på
    prissidan så ingen köper fel förväntan.
19. **Historik-backup:** exportknapp (JSON/markdown) + varning vid "Töm allt"
    som räknar upp exakt vad som försvinner.
20. **PWA-installationsknapp** ("Lägg portalen på skrivbordet") i stället för
    att förlita sig på webbläsarens diskreta prompt.
21. **Kostnadsmätare:** ungefärlig kostnad per samtal/månad i portalen
    (token-data finns i API-svaren) — tar bort "vad kostar det här?"-oron.
22. **Första-gången-checklista i portalen:** tre steg (välj agent → testa ett
    startförslag → installera som app).

### P3 — polish och tillväxt
23. **Analytics på hubben** (Cloudflare Web Analytics — cookiefritt, ingen
    banner behövs). Idag är du blind för var besökare faller bort.
24. **TL;DR överst i galleri-sidorna** ("Resultatet: 4 agenter — detta gör
    de") + bygg de tre saknade team-builder-sidorna.
25. **Fler verticals** + länka branschsidorna från prissektionen ("se din
    bransch").
26. **SEO-grund:** title-taggar med köparfraser ("AI-team för
    redovisningsbyråer"), sitemap.xml, Search Console när domänen är live.
27. **Claude-kostnadsexempel** på prissidan: "X frågor/dag ≈ Y kr/mån" i
    stället för dagens vaga "några tior till hundralappar".
28. **Felhantering på svenska i portalen:** slut på krediter / ogiltig nyckel
    ska ge begriplig svensk text med länk till lösning, inte rå API-felkod.
    (Verifiera nuläget — troligen rått.)
29. **Ärligare nyckel-copy:** nyckeln ligger i localStorage — den som har
    datorn har nyckeln. Rekommendera budgetgräns som default, inte som tips.
30. **Tester/CI för webblagret** (känd lucka): rök-test att hub/demo/portal
    laddar och att demoflödet svarar — Annas första intryck får aldrig vara en
    tyst JS-krasch.

## Röd tråd

Tre systemfel förklarar nästan allt ovan:

1. **Konverteringskedjan är obruten teori:** demo → intresse → kontakt/köp har
   trasiga eller saknade länkar i varje steg (mailto-platshållare, pris utan
   kassa, demo utan CTA).
2. **Nyckelmuren står mitt i självbetjäningsflödet:** allt före den är byggt
   för icke-tekniska, allt efter den kräver en utvecklarkonsol. Punkt 10
   (gratis smakprov server-side) är bryggan.
3. **Portalen är en demo-arkitektur som säljs som arbetsverktyg:** localStorage
   räcker för att visa, inte för ett företag med anställda. M2b är svaret;
   tills dess måste begränsningen vara ärligt kommunicerad.
