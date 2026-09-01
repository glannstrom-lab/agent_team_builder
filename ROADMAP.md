# Roadmap

Från genomgången 2026-09-01 · sex parallella linser + egen verifiering.
Översikt: <https://claude.ai/code/artifact/08527a49-a84b-491f-98b0-c6561afdab4e>
(Förra rundorna: 2026-08-17 och 2026-08-15, egna dokument.)

> Den här filen är arbetslistan. `docs/roadmap.md` (passindelningen) och
> `docs/lansering.md` (hålen) står kvar och gäller fortfarande — det som är
> nytt eller ändrat sedan 2026-08-07 står här, med ID:n som används i
> commit-meddelanden.
>
> **Verifieringsgrad:** `mätt` = kört eller räknat. `läst i koden` = öppnad
> och kontrollerad rad, men inte exekverad.
>
> Nya ID:n från 2026-08-17 har tvåbokstavsprefix efter lins (`KA` kärnan,
> `KR` köpresan, `SE` synlighet, `TG` tillgänglighet, `DR` drift, `KL`
> klientkod, `BF` blindfläck) för att inte krocka med de gamla enbokstavs-ID:na.
> Prefixet `OM` (omvärld) tillkom 2026-08-18 med
> `docs/omvarldsresearch-2026-08-18.md`. `PR` (produktriktning) och `RE`
> (retention) tillkom 2026-09-01. Nummerserien fortsätter per prefix — nya
> ID:n återanvänder aldrig ett gammalt nummer, inte ens ett avbetat.

## Nu — riktiga fel

- [ ] **KA6** Prompten och schemat säger emot varandra — i filen K4 skapade för att göra just det omöjligt. `PORTAL_RULES` punkt 9 beställer "2–4 korta exempeluppgifter"; `TEAM_SCHEMA` hundra rader ner tvingar `minItems: 3, maxItems: 3`; `templates/shared/portal-team.md:102` säger "EXAKT 3". Schemat vinner, så utdatan blir alltid tre — men modellen får motstridiga instruktioner i det steg som är dyrast att köra om. Kontraktet stämmer i övrigt i båda riktningarna, fält för fält kontrollerat · `functions/api/_build.js:116`, `:214` · `mätt` · ~5 min
- [ ] **KR3** Provmånadskortet dör så fort kunden rör arbetsytan. `checkTrialNotice()` anropas på exakt ett ställe (`app.js:1421`, vid boot) och ritar kortet i `.ws` — som byggs inuti `renderSidebar()`. `refreshSidebar()` byter ut hela `.sidebar` utan att anropa den igen, så kortet försvinner vid alla tre anropsställena (`:1540` expandera arbetsytan, `:2096` godkänt minnesförslag, `:5094`). Det drabbar precis den aktiva kunden som ska konvertera, och knappen "Fortsätt löpande — 290 kr/mån" är tills e-postlivlinan finns den enda vägen dit inifrån produkten. Fixen är en rad sist i `refreshSidebar()`; funktionen är redan idempotent (`#trial-card`-vakt + snooze) · `portal/app.js:1421`, `:2264-2269`, `:3773-3775` · `läst i koden` · ~15 min
- [ ] **RE1** "Veckan som gick" är alltid tom — den läser en logg som just nollställts. Pulskortet visas exakt när `lastVisit !== isoWeek()`, alltså vid veckans FÖRSTA öppning; i samma ögonblick returnerar `routLoad()` en tom logg eftersom den sparade posten bär förra veckans nummer. Chattaktiviteten i samma funktion räknas däremot på `nu − 7 dygn` och täcker förra veckan — underlaget blandar två tidsfönster utan att någon bestämt det. **Reproducerad** med den riktiga koden ur källan (`granskning/2026-09-01/repro-veckan-som-gick.mjs`): 3 avbockade rutiner värda 135 minuter blev 0 st och 0 minuter i underlaget. Fixen: läs förra veckans post ur `atb_rout_<slug>` när `r.week` är föregående ISO-vecka — den ligger kvar orörd tills första avbockningen skriver över. Ge tidspulskortet samma källa · `portal/app.js:2806-2831`, `:2292`, `:2709` · `reproducerad` · ~2 h
- [ ] **KR4** Provmånaden kan köpas om varje månad — 90 kr i stället för 290, i all evighet. `startUpgrade` blockerar en ny provmånad på SAMMA slug ("sälja samma sak två gånger", `checkout.js:120-124`), men webhookens nytt-team-gren har ingen kundkontroll alls: den skapar team och kopplar till e-postadressen villkorslöst, oavsett hur många team adressen redan äger. Varken villkoren eller prislistan säger något om en provmånad per kund (noll träffar på båda ställena). Med gratis bygge och körningen kvar i webbläsaren är cykeln två klick i månaden; med kopplad mapp följer företagsminnet med. Samma felklass som pass 2 lagade, flyttad en nivå upp: provmånaden tar slut per *team*, inte per *kund*. Förslag: leverera ändå (betalt är betalt) men flagga raden och mejla `info@`; villkorsraden är din text · `functions/api/stripe-webhook.js:133-192`, `checkout.js:120-124`, `villkor.html:255` · `läst i koden` · ~2 h + villkorsrad
- [ ] **BF4** Villkoren visas aldrig före köpet — och §15 lovar ett samtycke som ingen kod inhämtar. Uppmätt: noll förekomster av "villkor" eller "ånger" i kundens gränssnitt genom hela köpflödet (Builderns avslut, kassan, `aktivera.html`); träffarna i `builder.js` är kodkommentarer. `checkout.js` sätter varken `consent_collection` eller `custom_text`. Samtidigt står i `villkor.html:539`: "Vi ber om det samtycket uttryckligen" — det finns ingen sådan fråga någonstans. Distansavtalslagen kräver information om ångerrätten INNAN avtalet ingås; utan den börjar fristen inte löpa, och ångerknappen (BL2) skyddar då inte mot en väsentligt längre frist än de 14 dagar koden räknar med. Fix: `consent_collection[terms_of_service]=required` i båda sessionsanropen + villkors-URL i Stripes dashboard (ditt steg). **Meningen i §15 är din text — jag har inte rört den** · `functions/api/checkout.js:83-96`, `:150-163`, `villkor.html:539-540` · `mätt` · ~1–2 h
- [ ] **BF5** Integritetspolicyns fyra gallringslöften har ingen verkställare. Uppmätt med `grep -rn "DELETE FROM" functions/ scripts/`: repots enda `DELETE FROM users` ligger i kollega-borttagningen (`team/remove.js:71`), ingen rad raderar ur `teams`, inloggningskoderna förbrukas (`consumed_at`) men raderas aldrig, och `pending`-städningen körs bara när NÄSTA checkout råkar starta (`checkout.js:106-109`) — med få kunder alltså sällan eller aldrig. Dessutom ackumulerar `ai_usage` rader nycklade på `ip:<ip>` utan angiven lagringstid. Art. 13-information som inte stämmer är det första en granskande IT-leverantör kontrollerar. Fix: en `POST /api/underhall/gallring` som veckobrevs-workern anropar med samma `DIGEST_SECRET`-mönster — klockan finns redan, den knackar bara aldrig på någon städrutt · `integritet.html:374-407`, `functions/api/checkout.js:106-109`, `api/ai.js:426, 576` · `mätt` · ~4 h

## Sedan — skav som märks

- [ ] **KR5** Buildern säljer teamet en gång till — direkt efter att kunden köpt det. `clearRun()` anropas bara av "Släng den" (`builder.js:233`, `:886`) och `aktivera.html` rör aldrig `atb_last_run`. Kunden som just betalat och sedan klickar "Bygg ert team" möts av återupptagningsrutan och därefter av avslutets "Teamet finns bara i den här webbläsaren … byter du dator är det borta" — falskt för henne — plus en fungerande köpknapp för teamet hon redan äger (dubbeldebitering, två team, manuell återbetalning). Det är också bränslet till **KR4**. Fix: låt `aktivera.html` (samma origin) skriva `atb_last_run_purchased = slug` när statusrutten svarar klart · `builder/builder.js:218-235`, `:886`, `:1679-1698` · `läst i koden` · ~1–2 h
- [ ] **KR6** Kvittosidans räddningsplanka pekar på en länk som inte finns. Vid saknat kvitto-id säger sidan "gå tillbaka till kvittomejlet och följ länken därifrån" — men Stripes kvittomejl leder till Stripes egen kvittosida, inte till vår `success_url`. Och `stuck()` säger "ladda om / mejla oss" utan att nämna det som faktiskt fungerar: teamet levereras av webhooken oavsett vad som hände med fliken. Fix: byt båda styckena mot "gå till mittaiteam.se/portal och logga in med adressen ni betalade med" · `portal/aktivera.html:66`, `:105-111` · `läst i koden` · ~20 min
- [ ] **KA7** Enkätvägens hela skydd är femton tecken. Grinden från 2026-08-17 håller (kontrollerat: rent kryssintag ger tvingande följdfrågor utan "hoppa över"), men `builder.js:851` kräver bara att ETT av två reservsvar är ≥15 tecken — det andra blir `"(inget svar)"`. Två kunder i samma bransch kan alltså skilja sig på ca 110 tecken av ~1 250, och researchsteget ska hitta hela verksamhetens särart i en enda mening — hos just den kund som valde kryssvägen för att hon har svårt att formulera sin verksamhet. Fix: kräv svar på båda frågorna (de mäter olika saker — veckan och skillnaden mot branschen) och höj golvet till ~40 tecken; eka in `intake.extra` under "Var det klämmer" i stället för sist som "Kompletterande svar" · `builder/builder.js:764`, `:849-857` · `mätt` · ~1 h
- [ ] **KA8** Golvet skyddar PERSPEKTIV men inte LEVERANS. `kontrolleraSystemprompter` kräver att båda rubrikerna finns, men bara `DITT PERSPEKTIV` har ett innehållsgolv (`PERSPEKTIV_GOLV = 60`, `builder.js:1114`). En `LEVERANS`-rubrik med ingenting under passerar — och det är "Klart när"-punkterna under den som gör kvalitetschecklistans ja/nej-svarbara leveranser möjliga. Referensnivån är mätt: de kurerade teamens systemprompter ligger på 2 453–4 931 tecken, median 3 052. `lansering.md:45` säger att nuvarande modell ger 1 319 och att fixen är `minLength` i schemat — **den biter troligen inte**: OpenAI-stilens structured output ignorerar oftast `minLength`. Fix: `leveransText()` med eget golv i det delade blocket, så testerna kör samma kod som kunden · `builder/builder.js:1114`, `:1192-1206` · `mätt` · ~2 h
- [ ] **DR6** Mejlvägen kan dö totalt medan `/api/health` säger 200. Inloggning sker med engångskod till mejlen — utskicket är alltså enskild felpunkt för ALL portalåtkomst. Men `sendMail` gör bara `console.error` + throw; ingenting bokförs i `ai_errors`, och hälsokontrollen tittar varken på mejlfel eller på om de övriga sju hemligheterna är satta. En roterad avsändarnyckel ger exakt B1-scenariot igen: produkten stum för nya inloggningar, hälsan grön, upptäckt när en kund hör av sig — via den kanal som inte fungerar. Frågan "kan vi upptäcka att en secret saknas?" har i dag svaret nej för 7 av 10 värden. Fix: boka `ai_errors` med kod `mail` i felgrenen (samma upsert finns i `ai.js:611`) + närvaro-booleaner i `health.js` · `functions/api/auth/_lib.js:266-294`, `api/health.js:44-79` · `läst i koden` · ~1–2 h
- [ ] **DR7** Vakten behöver inte vara en tredje part — CI:t kan vara den. **Skärpning av D3**, som stått som din uppgift i tre pass och kräver att någon minns att registrera ett konto. En `.github/workflows/health.yml` med `on: schedule: '*/15 * * * *'` och `curl -fsS https://mittaiteam.se/api/health` gör samma sak: GitHub mejlar repoägaren när en körning fäller. Noll nya konton, samma verktyg som `test.yml`. Med **DR6** och **DR9** gjorda täcker samma vakt mejlvägen och kostnaden också · `.github/workflows/test.yml` (mall) · `läst i koden` · ~20 min
- [ ] **DR8** Betalningens livscykel har noll tester. Webhookens dispatcher har sex grenar; inget test kör `onRequestPost`. `test/plan.mjs:23` importerar bara hjälparen `subscriptionOf`, `test/stripe.mjs` testar signaturkontrollen i `_stripe.js`. Samma för `teams/[slug].js` — dörren varje betalande kund går genom — och för `checkout.js`. En regression här är per definition tyst: "uppsagd kund behåller åtkomst" märks aldrig; "invoice.paid öppnar inte en spärrad kund igen" märks som en arg kund veckor senare. Pass 2-dokumentationen varnar själv: "allt ser ut att fungera precis som förut". Selen finns: `test/ai.mjs` kör redan riktiga `onRequestPost` med stubbad D1 · `functions/api/stripe-webhook.js:40, 68-77`, `api/teams/[slug].js`, `api/checkout.js` · `mätt` · ~3 h
- [ ] **DR9** Kostnaden syns först när krediten är slut — alltså som driftstopp. Räknat på dagens tak och priser: värsta anrop på fria rutten ≈ 5 öre, dygnets tak sammantaget ≈ 200 kr. Men det finns inget globalt MÅNADSTAK (bara per team), så en uthållig skörd kostar ~6 000 kr/mån tills någon tittar i `ai_budget` för hand eller 402:an gör hälsan röd. **Instrumentet före ratten** (pass 3.2 i `docs/roadmap.md` är fortfarande öppen): en fjärde boolean `budget_ok` i `/api/health` — dygnets tokens ur `ai_budget` under en larmnivå — låter vakten från **DR7** fånga rusningen innan den blir ett stopp, utan att siffror läcker ur den öppna rutten. Taket sätts sedan, när kurvan är sedd · `functions/api/ai.js:55-99`, `api/health.js` · `mätt` · ~1 h
- [ ] **DR10** Modellen bor på tre ställen och inget test håller ihop dem. `openai/gpt-oss-120b` står i `atb-claude.js:26`, `functions/api/ai.js:99` och `functions/api/digest/run.js:28`; noll träffar på strängen i `test/`. Dagen modellen byts uppdateras de två första i samma arbetsflöde och veckobrevet glöms — uppströms svarar 404, felet bokas i `ai_errors` som ingen läser, breven slutar komma. Veckobrevet saknar dessutom helt en "kom brevet fram?"-detektor: dör workern själv skrivs ingenting någonstans. Fix: (a) ett tio-minuters test som kräver att de tre strängarna är identiska; (b) hälsokontroll på prenumeranter vars dag passerat utan `last_sent_day`-uppdatering på >8 dagar · `atb-claude.js:26`, `functions/api/ai.js:99`, `api/digest/run.js:28` · `mätt` · ~1,5 h
- [ ] **DR11** Delningsytan mellan klientfilerna vaktas av ingenting. Allt som korsar filgränserna i webbläsaren går via `window.ATBClaude` (elva medlemmar) och `window.ATBAvatars` (tre). Kontraktet stämmer i dag — alla tio använda medlemmar finns i exportobjektet, kontrollerat — men inget test fäller den dag någon döper om eller stryker en export medan en konsument står kvar. Det är B1:s exakta form: felet finns bara i webbläsaren och syns bara i konsolen. Fix: ladda filerna med stubbat `window` (görs redan i `test/klient.mjs`), greppa `ATBClaude\.\w+` ur konsumenterna och kräv medlemskap i det riktiga exportobjektet — samma mönster som teamrutt-grinden i `test/teams.mjs` · `atb-claude.js:360`, `avatars.js:84` · `mätt` · ~1 h
- [ ] **BF6** Kundens betalda arbetsprodukt ligger i vräkningsbar lagring. Chatthistorik, företagsminne, underlag, streak, tidsliggaren och `teamExt` bor alla i localStorage; noll träffar på `navigator.storage.persist()` i hela repot — lagringen är "best effort" och webbläsaren får vräka den. Safari raderar all skriptskrivbar lagring (localStorage OCH IndexedDB, inklusive mapp-handtagen) efter sju dagars användning utan besök, för allt som inte installerats som app. Produktens dokumenterade akilleshäl är att kunden uteblir i vecka tre — på iPhone betyder det att ett halvårs samtal, minne och just den sparade-tid-siffra som ska motivera förnyelsen kan vara borta när hon kommer tillbaka. Mappfunktionen, som är räddningen, finns bara i Chrome/Edge. Fix: anropa `persist()` vid inloggad boot (ignorera avslag tyst) + engångsnudge för Safari utan kopplad mapp + en mening i integritetspolicyn · `portal/app.js` (boot-vägen — inga persist-anrop finns) · `mätt` · ~1–2 h
- [ ] **BF7** Företagsköparen lockas med momsavdraget men får inget momsunderlag. `index.html:492` säljer aktivt på avdraget ("drar av momsen blir det 72 respektive 232 kr") och `villkor.html:234-235` anger exkl.-belopp — men checkout-anropet skickar varken `invoice_creation` eller `automatic_tax` (noll träffar i hela `functions/`). Stripes standardkvitto utan momsspecifikation duger inte som avdragsunderlag, och det första ett företag gör vid månadsbokslutet är att leta efter momsen. Fix: `invoice_creation[enabled]=true` + momsuppgifter på priserna i Stripe, eller en dokumenterad manuell fakturarutin (villkoren antyder redan "faktura på begäran" — då måste rutinen finnas). Kontrollera samtidigt som live-läggningen · `functions/api/checkout.js:83-96`, `index.html:492`, `villkor.html:234` · `mätt` · ~1–2 h
- [ ] **BF8** Inbjudningsmejlet till kollegan saknar all integritetsinformation. `POST /api/team/invite` skapar en `users`-rad för en tredje person på ägarens uppgift (`invite.js:84-90`). Mejlet hon får har inloggningsinstruktioner och "Var det här oväntat? Strunta då i mejlet" — men ingen länk till integritetspolicyn och ingen antydan om att adressen nu lagras. Struntar hon i mejlet ligger konto- och åtkomstraden ändå kvar (för evigt, se **BF5**). GDPR art. 14 kräver information senast vid första kontakten, och mejlet ÄR första kontakten. En rad räcker · `functions/api/auth/_lib.js:338-347` · `läst i koden` · ~15 min

- [ ] **BF2** Gratisbygget delar ut hela den betalda leveransen. `downloadConfig()` skriver `stripTeam(team)` till fil — inklusive varje agents fullständiga systemprompt — utan konto och utan betalning. Prompterna går att klistra in i gratis ChatGPT och köra löpande, vilket underminerar beslutet "noll provsvar" vars motivering är att det är teamet som säljs. Behöver ett medvetet beslut, inte en bieffekt. **Mindre akut sedan K4** (2026-08-29): prompterna går att ladda ner, men inte längre att KÖRA gratis hos oss · `builder/builder.js`, `index.html:604` · `läst i koden` · ~2–4 h
- [ ] **BF3** Fyra prompter ligger öppet på webben, inklusive den filen projektet självt kallar nyckelsteget. Uppmätt: `curl …/prompts/shared/research.md` ger 200 och 17 807 byte klartext. Skälet som fanns — Buildern måste kunna hämta dem klientsidan — **gäller inte längre sedan K4** (2026-08-29): det är servern som läser dem. Kvar står att `build-dist.mjs` kallar resten av `prompts/` "konsult-IP", en gräns som inte går att hålla samtidigt. Vägen är nu billigare än förut: filerna måste ligga i `dist/` för att `env.ASSETS` ska nå dem, men en Function på `/prompts/[[path]]` kan svara 404 utåt — ASSETS-läsningen går förbi Functions-routingen. Verifiera den ordningen innan du bygger på den · `build-dist.mjs:45-53`, `functions/api/_build.js` · `mätt` · ~30 min (acceptera) / ~2 h (stäng utåt)

## Framåt — utveckling

- [ ] **PR3** Generatorns prompter bör stängas oavsett hur **OM1** faller. **BF2** och **BF3** behandlas i dag som två varianter av samma läcka, men de har motsatt logik. *Output-IP* (kundens teamfil) KAN bli en funktion — det är kundens team, byggt ur kundens verksamhet, och det är precis vad OM1:s ena väg säljer. *Generator-IP* (`prompts/shared/research.md` m.fl.) kan aldrig bli det: det är receptet, inte kakan, och researchsteget är enligt CLAUDE.md nyckelsteget — alltså exakt den fil som gör påståendet "ingen konkurrent bygger teamet ur kundens verksamhet" sant. Uppmätt i dag: `dist/prompts/shared/research.md` = 17 807 byte, publikt, och ingen Function vaktar `/prompts/`. Poängen är prioriteringen: **BF3 hänger inte på OM1** och ska inte vänta på beslutet · `build-dist.mjs:49-58`, `functions/api/_build.js:259-266` · `mätt` · ~2 h
- [ ] **PR1** Arbetsledarläget ÄR "vi bygger teamet, du kör det var du vill" — färdigbyggt och osålt. `workstyle: "coach"` levererar brief + självbärande prompt + "Klart när"-checklista för kundens egen AI. Uppmätt: ordet "arbetsledar" ger **noll** träffar i `index.html`, `villkor.html`, `site/`, `verticals/`, `README.md`, `docs/roadmap.md` och `docs/lansering.md` — ett läge som besvarar det tyngsta konkurrenshotet finns i produkten men inte i erbjudandet. Det öppnar dessutom engångspriset igen med hederlig logik: 4 990 ströks för att ingen molnstruktur för underhåll finns, men den här leveransen kräver **ingen drift av oss**. Underlag till **OM1**, inte ett beslut · `builder/builder.js:288-292`, `functions/api/_build.js:286` · `mätt` · beslut; ~2–4 h text om vägen väljs
- [ ] **PR4** **OM4** har en tredje väg som inte står i beslutet: integration utan inloggning. Alternativ A (en riktig integration) har ingen vinnande ruta — Fortnox/Visma är Vorkers hemmaplan, kalender/Gmail är precis det plattformsbundlarna ger gratis, och OAuth-tokens är drift, alltså ett brott mot princip 8 på riktigt. Alternativ C: **läsbara artefakter**. Årshjulet och rutinerna som `.ics` (noll träffar på kalenderexport i repot i dag), svar som `mailto:`-utkast. Ger huvuddelen av känslan att agenten *gör* något i kundens verktyg, med noll serverinfrastruktur, noll tokens och noll biträdesavtal. En `.ics` med momsdatumen ur `portal/deadlines-se.js` är dessutom en delbar artefakt som marknadsför produkten själv · `portal/deadlines-se.js` · `mätt` · beslut; ~4–8 h om det väljs
- [ ] **PR2** Riktningsregel: lånad tid-inventeringen. Omvärldsresearchen säger att Cowork är "vår mappfunktion plus våra rutiner" men drar inte konsekvensen per funktion. **På lånad tid:** mappen på datorn (plattformens kärnfunktion, nativt och utan Chrome-begränsning), auto-rutinerna (våra körs bara vid sidöppning — strukturellt sämre och kan inte bli bättre utan serverkörning som bryter princip 8), minne & underlag (projektmetaforen finns nativt). **Inte på lånad tid:** genereringen, mötet, veckobrevet, det svenska. Regeln: pröva varje ny arbetsytefunktion mot "gör plattformen detta gratis inom ett år?" — ja → underhåll men bygg inte ut. **Riv ingenting** — etapp 1–4 är byggda och betalda; det här gäller nästa timme, inte förra · `docs/omvarldsresearch-2026-08-18.md:56-70` · `läst i koden` · riktning
- [ ] **PR5** Återförsäljarspåret är den enda raden i funktionsglappstabellen där bristen är text, inte infrastruktur. Rad 9 ("white-label för byråer") fick varken ID eller åtgärd. Allt tekniskt finns: multi-tenant-portalen (`portal/teams/<slug>.js`), `/consult` + handoff, `scripts/provision.mjs`, platshanteringen (P5). En svensk AI-konsult som vill leverera team till SINA kunder kan köras på dagens kod. Det som saknas är en sida — "offert" nämns i dag bara i en FAQ-rad om flera *användare* (`index.html:670`), inte flera *kunder*. Kanalen överlever kommoditiseringen: när plattformen ger bort körmiljön är skräddarsömmen det som återstår att sälja, och den säljs av någon som sitter hos kunden. Löser mänsklig onboarding på köpet. **Inte** fork A i `docs/produktstrategi-sjalvbetjaning.md` (Mikael som konsult) — det här är att sälja verktyget till andra konsulter · `index.html:670`, `.claude/commands/consult.md` · `läst i koden` · beslut först; v1 ~4 h
- [ ] **RE2** Ingen väg tillbaka där svaret blev fel — och det är där abonnemanget dör. Per-svar-knapparna (kopiera, ladda ner, fortsätt härifrån, kopiera prompten, spara lärdomar, skicka vidare) förutsätter alla att svaret var bra. När agenten svarar generiskt — det klassiska churn-ögonblicket — finns reparationsverktygen (företagsminnet, P4:s "ändra agentens instruktion" `:3167`) två–tre klick bort i en annan panel, utan skylt från felet. Kunden drar slutsatsen "AI funkar inte för oss", inte "jag borde öppna Utveckla teamet". Skräddarsömmen är hela produkten; ett generiskt svar är ett brutet kärnlöfte, och portalens enda synliga svar på det är ett mailto i "Tyck till". Fix: en knapp per assistentsvar — "Blev det fel? Lär teamet" → "Vad missade agenten?" → sparas som minnesrad + länk som öppnar P4-dialogen för just den agenten · `portal/app.js:3960-4031`, `:3084-3200` · `läst i koden` · ~3–4 h
- [ ] **RE3** Veckobrevet erbjuds aldrig i det ögonblick kunden är mottaglig. Opt-in är rätt beslut, men enda vägen dit är knappen "✉️ Veckobrev" bland extras (`app.js:1525`). Uppmätt: **noll** omnämnanden i `portal/aktivera.html` och **noll** i `builder/builder.js`, och den står inte i kom igång-checklistans fem steg (`:1971-1980`). Projektets egen tes står i `digest/run.js:3-5`: "vecka tre kommer hon inte ihåg att logga in" — hela den utgående retentionmodellen förutsätter alltså att kunden själv hittar en inställning i en sidopanel med ~25 rader, INNAN vanan dör. Mellan köpet och provmånadskortet på dag 25 finns ingen yttre beröringspunkt alls. Fix: en kryssruta på `aktivera.html` eller i Builderns avslut ("Skicka teamets veckostart som mejl på måndagar?") som seedar `weekly_digest` — fortfarande opt-in, men ett klick i rätt ögonblick. Plus ett engångs-pulskort efter vecka ett. Detta är den billiga halvan av **P3** · `portal/app.js:1522-1525`, `:1971-1980`, `portal/aktivera.html` · `mätt` · ~2–4 h
- [ ] **RE4** Veckobrevet får identisk indata varje vecka → samma brev varje måndag → kanalen dör av upprepning. `digestPrompt(cfg)` bygger enbart på `teams.config`: agentlista, rutinlista, årsrytm. **Inget datum, inget veckonummer, ingen variation** — modellen vet inte ens vilken dag det är, så årsrytmen listas utan tidsrelation och "tre veckor till mässan" kan aldrig sägas rätt. Ett brev som märkbart upprepar sig lär kunden att det är säkert att ignorera, vilket bränner opt-in:en permanent — värre än inget brev. Fix (ingen ny data behövs): skicka med datum + veckonummer, räkna ut närmaste säsongshändelse serversidan (samma logik som portalens puls), och instruera rotation ("lyft en annan agent/rutin än förra veckan"; veckonummer % antal agenter räcker). Konfigen bär material för 4–6 distinkta brev · `functions/api/digest/run.js:95-150` · `läst i koden` · ~2 h
- [ ] **RE5** Fyra rader i arbetsytan är samma logg i fyra kostymer — och bryggan till köparen saknar skylt. För en aktiv kund har sidopanelen ~25 interaktiva rader; fyra av dem (**📈 Veckans arbete**, **🏆 Kvartalet med teamet**, **📣 Rapport till chefen**, **🏅 Det här har jag levererat**) är fyra renderingar av samma lokala logg. P6:s hopfällning gäller bara före första chattraden; steady-state rördes medvetet inte, och det är det som nu konkurrerar ut sig självt. Samtidigt: halvårssimuleringens churn-mekanik (värdet bevisas hos utföraren, beslutet fattas av köparen) fick i OM5 svaret *siffror på fler ytor*, men leveransen till köparen är fortfarande "kopiera texten". Kedjan *bjud in köparen → köparen slår på veckobrevet → köparen ser värdet varje måndag* finns i sin helhet i koden (`weekly_digest` är per (user, team), migration 0007; platserna finns sedan P5) — ingen yta säger det. Fix: en yta där de tre andra blir knappar inuti Veckans arbete, veckobrevsreglaget läggs där (= **RE3**:s opt-in-skylt), plus en rad i delningsrutan · `portal/app.js:1517-1535`, `:3313`, `:3878-3892` · `läst i koden` · ~3 h
- [ ] **RE6** Två ytor lovar mer än talet bär. Överallt annars står "avklarade rutiner **motsvarar** X manuellt arbete" med utskrivna förbehåll (`:2825`, `:3884`, `:3927`). Pulskortet (`:2711`) säger "**Teamet har gjort** X manuellt arbete i veckan" och kvartalsöverblickens etikett (`:3872`) "manuellt arbete **teamet gjort**" — men talet är tidsuppskattningen på rutiner *kunden* bockat av, ofta arbete hon gjort tillsammans med teamet. OM5:s eget resonemang gäller formuleringen lika mycket som siffran · `portal/app.js:2711`, `:3872` · `mätt` · ~10 min
- [ ] **KA9** Kärnregeln är obevisad för den motor som säljs. Allt divergensbevis i repot är äldre än modellbytet 2026-08-06: `testoutput/` har som nyaste fil 2026-07-18 (DeepSeek-eran) och `portal/teams/` är handkurerat. Enda skarpa körningen efter K4 var **ett** `scale`-steg. Det finns alltså **noll artefakter från en hel gpt-oss-körning i repot**, samtidigt som sprintrutan säger "kärnan är bevisat divergerande — se examples/". Divergensen i det som FINNS är däremot stark och ska inte rivas upp: KA4:s mått körd tvärs över team ger 466 specialistpar med max 0,35, VD-assistenten över 14 team median 0,05 / max 0,26. Fix: när nyckeln finns — tre byggen i samma storleksklass, råutdata i `testoutput/`, perspektivmåttet tvärs över körningarna. **Skärper KA4 med en tvärkörningsdimension, ersätter den inte** · `testoutput/` (nyaste 2026-07-18) · `mätt` · ~1 h när nyckeln finns
- [ ] **KA10** Skalningsbeslutet fattas men läses aldrig. `scale.md` levererar "Skalningsbeslut: N agenter" och `rensaSkalning()` (`builder.js:984`) plockar ut raden för visning — sedan läser ingen kod talet. `TEAM_SCHEMA` har `minItems: 2` utan tak, så sammanställningen kan leverera nio agenter åt ett soloföretag och passera varje grind. Checklistpunkterna "solo och enterprise är olika i struktur" och konsult-regeln "nybörjare får färre agenter" mäts av **noll** tester — `grep mognad test/` ger inga träffar, trots att exemplen bär 3/4/6 agenter för nybörjare/van/byggare, och `test/skalning.mjs` bara testar textstädningen. Fix: parsa talet och fäll sammanställningen vid avvikelse, i samma pass som `kontrolleraSystemprompter`; plus ett test på `examples/` som läser mognadsnivå + agentantal ur filerna · `builder/builder.js:984`, `:1192` · `mätt` · ~2 h
- [ ] **DR12** Snittet i `portal/app.js` (5 209 rader) går längs sömmar som redan finns. Kostnaden i dag: 160 toppnivåfunktioner i ett globalt scope, och testerna når filen enbart via `new Function` på tre markörblock (~180 av 5 209 rader) — varje ny testbar funktion kräver ett nytt markörpar, och ett flyttat block gör att testet tyst kör fel utsnitt. **Skärpning av pass 6-punkten**, med filens egna sektionsbanderoller som snitt: `portal/logik.js` (allt DOM-fritt — de tre markörblocken, `isoWeek`/`mondayMs`/`quarterOf`, `contextFor`, `trialNoticeFor`) så testerna importerar en riktig fil och markörregexen pensioneras; `portal/store.js` (lagringslagret, `idb*`, mappsynken, `teamExt` — där race-fynden bott); resten kvar i `app.js`. Skripten är klassiska, så toppnivådeklarationer delas över script-gränser: snittet är klipp-och-ordna, inte refaktorering. Enda fällan: inget i en tidigare fil får KÖRA något ur en senare vid laddning (boot sist). Två rader i `portal/index.html` + två i `sw.js`:s SHELL måste med i samma commit — bygget fäller om det glöms · `portal/app.js:448`, `:2334`, `:2515`, `:3244` · `mätt` · ~4–6 h
- [ ] **DR13** Backupen skyddar mot fel katastrof och kräver att någon minns den. Känt sedan tidigare ("flytta dem") — skärpningen är två automatiseringar. (a) **D1 Time Travel**: Cloudflare håller point-in-time-restore i upp till 30 dagar. Gäller det kontot är diskkatastrofen redan täckt utan en rad kod — verifiera en gång (`npx wrangler@4.123.0 d1 time-travel info agent-team-builder`) och skriv in kommandot i CLAUDE.md:s backup-avsnitt som **första** återställningsväg. *(Obekräftat mot kontot — går inte att verifiera offline.)* (b) En schemalagd GitHub-workflow (vecka) som kör `wrangler d1 export` och sparar dumpen som workflow-artefakt (90 dagars retention): off-disk, automatiskt, noll minne. Kräver `CLOUDFLARE_API_TOKEN` som GitHub-secret — skapa den med **enbart D1-läsrättighet**, så en läckt token inte kan röra Pages · `scripts/db-backup.mjs`, CLAUDE.md backup-avsnittet · `läst i koden` + obekräftat (a) · ~1 h
- [ ] **PR6** Privatpersonssegmentet möter plattformspriset rakt av — ge det inga fler timmar tills B2B har en betalande kund. Buildern bär ett fullt personläge (`audience === "person"`, egna formulärtexter och enkätgrenar). Men kalkylen skiljer sig: **företaget** på 290 kr jämför med Vorker ~650 och AI Kollegorna 4 900 — vi vinner. **Privatpersonen** på 290 kr jämför med de stora AI-abonnemangen kring 210–230 kr, som ger frontier-modeller, projekt, minne och (med Cowork) schemaläggning. Vi är dyrare än plattformen med en mindre modell, och det som skiljer oss (skräddarsydda *företags*-team, momsdatum, personalliggaren) väger lättast för just den köparen. **Riv inte läget** — det är byggt och kostar inget att stå kvar. Men ge det ingen egen marknadsföring och räkna inte in det i tillväxtantaganden. Alternativt: personläget är den bästa **PR1**-kandidaten, eftersom arbetsledarläge + engångspris passar en privatperson bättre än ett abonnemang · `builder/builder.js:136-196` · `läst i koden` · beslut

- [ ] **P1** Ingen mätning av var köpresan läcker. **Kodhalvan är gjord 2026-08-29, knappen är din.**
  Påståendet att Cloudflare Web Analytics "kräver ingen CSP-ändring" var fel — uppmätt samma dag:
  `script-src 'self'` stänger ute `https://static.cloudflareinsights.com`, och en CSP-blockering syns
  inte för den som slog på knappen: panelen står bara tom, vilket ser ut som "ingen trafik". Värden
  ligger nu i `_headers` med ett test som håller den kvar (`test/csp.mjs`, sju tester — filen hade
  inga alls). `connect-src` behövde INTE vidgas, men det är villkorat: beaconen väljer mottagare med
  `v.send.to || (v.version === undefined ? "https://cloudflareinsights.com/cdn-cgi/rum" : null)`
  (läst i `beacon.min.js`), så **automatic setup** i Pages-dashboarden skickar till samma origin och
  ryms i `'self'` — medan den manuella inklistrade snutten skickar till `cloudflareinsights.com` och
  skulle blockeras, tyst. Slå alltså på den automatiska. Kontrollerat i drift 2026-08-29: ingen beacon
  levereras i dag, alltså är mätningen inte påslagen. Kvar sedan: en mening i `integritet.html` om att
  besöksstatistik samlas in cookiefritt — din text · `_headers`, Cloudflare-dashboarden · `mätt` · ~10 min
- [ ] **OM1** Hållningen till Claude Cowork och ChatGPT Agents är inte bestämd. Cowork (april 2026) ger filsystemsåtkomst, schemalagda uppgifter och bakgrundsarbete — vår mappfunktion plus våra rutiner — gratis på varje betald Claude-plan, och Small Business-bundlen (maj) lägger integrationer ovanpå. Antingen är svaret "vi bygger teamet, du kör det var du vill" — och då är **BF2** (gratisbygget delar ut systemprompterna) en *funktion* som ska säljas, inte en läcka — eller så ska läckan stängas. Det är ett och samma beslut, och Coworks existens gör att det ska fattas nu · `docs/omvarldsresearch-2026-08-18.md` · `mätt` · beslut, inte kod
- [ ] **OM2** Ingen sida säger var modellen körs eller vad som lagras. AI Kollegorna säljer 4 900 kr/mån delvis på "ingen data lämnar era lokaler"; vi kör OpenRouter → `openai/gpt-oss-120b` med geografin osagd. Samma sida täcker EU AI Acts transparenskrav (i kraft 2 augusti 2026, vi ligger i limited risk: kunden ska veta att motparten är AI) och tar bort deras enda övertag mot oss · `integritet.html`, `index.html` · `mätt` · ~2–4 h
- [ ] **OM3** De två sakerna ingen konkurrent har står längst ner respektive i en sidopanel. Att en agent får **nej** är motgiftet mot exakt den kritik Sintra och Marblism får ("starka utkast, inte utförande"), och **mötet** löser Sintras mest citerade brist (helpers kan inte dela kontext). Flytta båda till framsidan — och gör det med en riktig körning, alltså tillsammans med **KR2** · `index.html:145`, `:163`, `:216-218` · `mätt` · ~2–4 h ihop med KR2
- [ ] **OM4** Integrationsspåret är varken valt eller bortvalt. Alla konkurrenter har verktygsåtkomst (Lindy 5 000+, Vorker Fortnox/Visma, Marblism Gmail/WordPress) — våra agenter kan tala, deras kan göra. Antingen **en** integration väl gjord (kalender eller Gmail; Fortnox är Vorkers hemmaplan), eller sälj bortvalet explicit: "vi kopplas inte in i era system." Att inte välja är det enda som är fel · `docs/omvarldsresearch-2026-08-18.md` · `mätt` · beslut först
- [ ] **P2** Gratisbygget fångar ingen e-post — övergiven körning är borta för alltid · `builder/builder.js:1432-1493` · `läst i koden` · ~4 h
- [ ] **P3** Provmånaden har ingen utgående livlina utanför portalen · `functions/api/_plan.js:65-86` · `mätt` · ~6 h

## Driftsatt 2026-09-01

Pages `a125bc7a`, commit `dbde03b`. **Ingenting kundvänt ändrades** — wrangler
rapporterade `Uploaded 0 files (103 already uploaded)`, alltså byte-identiskt
innehåll. Passets enda kodändring är en kommentar i `build-dist.mjs`, och
`granskning/` står inte i ITEMS. Deployen kördes för att bekräfta att kedjan är
grön, inte för att skeppa något.

Verifierat i drift efteråt:

- `/api/health` **200 friskt**, alla tre kontrollerna sanna.
- Fria rutten utan `step` → **400 `build_step_required`** med den svenska
  texten. K4-grinden står.
- Hub, builder, portal och galleri svarar 200; `villkor.html` och
  `integritet.html` ger 308 till de extensionslösa adresserna som svarar 200
  (Pages standard, inget fel). Okänd adress → **404**.
- **BF3 bekräftad skarpt:** `prompts/shared/research.md` svarar 200 med
  17 807 byte klartext. Siffran i BF3 är alltså inte historisk — den gäller nu.

**Fynd under deployen, och det är det viktigaste i det här avsnittet:** `main`
låg **åtta commits före `origin/main`** — allt från `4fbaaae` (K4) till
`3533ad9`. Hela 2026-08-29-passet var alltså driftsatt sedan tre dagar utan att
någonsin ha pushats. Två följder: **CI hade inte kört på den kod som låg i
produktion** (workflowen triggar på push, deployen kräver ingen), och argumentet
i CLAUDE.md:s backup-avsnitt — att D1 är den enda datakällan som inte går att
återskapa, eftersom "koden, prompterna och besluten ligger i git" — förutsätter
en git som finns någon annanstans än på samma disk som `backup/`. Den
förutsättningen höll inte. Se **DR13**.

**Stängt samma dag:** `6bdc993..3533ad9` pushad, `origin/main..main` är tomt, och
CI-körningen på `3533ad9` gick **grön** (tester, bygge, `check-dist`) —
[run 33540117832](https://github.com/glannstrom-lab/agent_team_builder/actions/runs/33540117832).
Föregående körning var `6bdc993` den **18 augusti**: testsviten hade alltså inte
sett produktionskoden på två veckor. `npm run deploy` pushar fortfarande inte —
kör `git log --oneline origin/main..main` efter varje driftsättning.

## Dokumentationsfel — rättade 2026-09-01

Rättade direkt i filerna (rent git-träd före och efter; `npm test` 274 gröna,
`npm run check:dist` ren). Raderna står i terminalsvaret.

- `CLAUDE.md:210` sa "Taken har tester i `test/ai.mjs` (17 st)". Uppmätt i dag med `node --test test/ai.mjs`: **34**. Parentesen läses som nuläge, så siffran är nu daterad i stället för struken — filen har vuxit med K4.
- `CLAUDE.md:523` sa att migrationerna är `0001`–`0005`. Det finns **sju** (0006 `ai_errors`, 0007 `weekly_digest` — CLAUDE.md:s eget repo-träd listar dem). Rollback-resonemanget håller — `ALTER TABLE` finns bara i 0003 och 0005, kontrollerat — men intervallet fick nästa läsare att antingen kontrollera i onödan eller anta att 0006–0007 inte omfattas.
- `build-dist.mjs:50-52` sa "Buildern kör exakt dessa filer verbatim (builder/builder.js)". **Falskt sedan K4**: `builder.js` har noll `fetchPrompt`-anrop (enda träffen är kommentaren som förklarar att den är borta), och det är `functions/api/_build.js` som läser dem via `env.ASSETS`. Kommentaren pekade alltså ut fel läsare i själva filen som avgör vilka prompter som publiceras — och därmed BF3:s hela orsak.

**Väntar på ditt ok** (din text, inte min — därför oändrad):
`villkor.html:539-540` säger "Vi ber om det samtycket uttryckligen" om samtycket
till att ångerrätten upphör när tjänsten fullgjorts inom fristen. Uppmätt: ingen
sådan fråga ställs någonstans i köpflödet. Meningen är antingen ett löfte som
ska uppfyllas i koden (**BF4**) eller en mening som ska strykas — men vilken av
dem, och med vilken formulering, är ditt beslut.

## Dokumentationsfel — rättade 2026-08-17

Rättade direkt i `CLAUDE.md` (rent git-träd). Raderna står i terminalsvaret.

- Repo-trädet sa `test/ # node --test: teams.mjs + stripe.mjs + plan.mjs (69 tester)`. Det är sex filer och 120 tester; `scripts/` saknade `check-dist.mjs`; `ROADMAP.md` och `.github/workflows/test.yml` fanns inte i trädet alls.
- Sprintrutan sa "Testsviten är 69 gröna". Uppmätt i dag: 120 tester, varav en röd (se **DR1**).
- Sprintrutan sa "**Nästa pass:** pass 3.3 och 3.1" — båda gjorda 2026-08-16 som K1 och K3. Instruktionen skickade nästa session till arbete som redan var färdigt.

**Väntar på ditt ok** (kodkommentar, inte prosa — därför inte ändrad):
`builder/builder.js:1652-1656` säger att 190 kr och 490 kr/mån "kräver en proxy på vår nyckel med kvotmätning — den finns inte". Proxyn finns sedan 2026-08-06 (`functions/api/ai.js` + `ai_usage`), och nivåerna är strukna av ett annat skäl: ingen molnstruktur för underhåll. Skälet i kommentaren är alltså överspelat, men vilken formulering som ska stå där är ditt beslut.

## Dokumentationsfel — rättade 2026-08-15

Rättade direkt i filerna (rent git-träd). Raderna står i terminalsvaret.

- `CLAUDE.md` — påstod att nyckelvägen fanns kvar i `atb-claude.js` och i portalens `renderKeySetup()`. Ingetdera stämmer, och samma fil sa motsatsen några stycken tidigare.
- `docs/roadmap.md` pass 3.2 — "50 000 tecken" var fel; `MAX_INPUT_CHARS` har varit 200 000 i hela filens historik.
- `docs/roadmap.md` pass 5 — påstod att bara lyckade anrop bokförs; `bokför(null)` räknar upp `calls` även vid nätverksfel och HTTP-fel.
- `docs/roadmap.md` pass 5 — "sw.js står på v22" (den står på v26) och "fyra commits" (uppmätt: 18 av 37).
- `docs/roadmap.md` pass 6 — 429-fyndet är redan åtgärdat, och radnumren för nyckeltexten i `portal/app.js` pekar på annan kod i dag.

## Driftsatt 2026-08-29

Pages `6cb1cda5`, taggen `deploy-2026-08-29`. Fem commits: `4fbaaae` (K4),
`158ba3c` (KA4), `95853bd` (P6 + P1:s kodhalva), `c249d9d` (P4), `2b22452`
(OM5). Testsviten **274 gröna**, `check:dist` ren. **Inga migrationer, inga nya
secrets, ingen ny rutt** — därför inget att rulla tillbaka i schemat om koden
måste backas.

Verifierat i drift, inte antaget:

- **Det riskabla först.** `POST /api/ai` med `step: "scale"` och ett riktigt
  intake gick hela vägen: prompten lästes **serversidan** och svaret strömmade
  tillbaka från Cerebras. Det var K4:s enda öppna fråga — om `env.ASSETS` (eller
  reservvägen) bär i produktion — och den är nu besvarad med en körning, inte
  med en läsning.
- Fria rutten **utan** `step` → **400 `build_step_required`** med den svenska
  texten. Med historik (tre meddelanden) → **400**. Den gamla vägen tillbaka för
  uppsagda är alltså stängd skarpt.
- Portalanrop utan inloggning → **401 `login_required`**. `GET /api/ai` → 405.
- `/api/health` **200 friskt**, alla tre kontrollerna sanna.
- CSP:n i drift bär `script-src 'self' 'unsafe-inline'
  https://static.cloudflareinsights.com` — beaconen är alltså inte längre
  utestängd när knappen slås på.
- Portalens `app.js?v=37ce5315` innehåller alla tre nya blocken
  (`AUTO-START`, `EXT-START`, `TID-START`), `applyTeamExt` och `boot: true`.
  Builderns `builder.js` har **noll** `fetchPrompt`-anrop kvar (bara kommentaren
  som förklarar varför) och inget `TEAM_SCHEMA` — de bor på servern nu.
- Sidorna svarar: hub, builder, portal, galleri, `villkor`, `integritet`, och
  `prompts/shared/scale.md` (2 858 byte — prompterna måste ligga kvar publika
  för att `env.ASSETS` ska nå dem, se **BF3**). Okänd adress → **404**.

**Kvar som `läst i koden`, inte `mätt`:** allt kunden ser med ögonen. P6:s
puls-kort, P4:s ändra/avsluta-dialog och OM5:s timsiffra är verifierade med 48
enhetstester som kör den riktiga koden ur källan — men ingen har öppnat
portalen i en webbläsare på fem pass. Det kräver en giltig `OPENROUTER_KEY` i
`.dev.vars`; den lokala svarar "Missing Authentication header".

**Två steg som är dina, och som ingen kod kan göra:** slå på Cloudflare Web
Analytics med **automatic setup** (P1 — den manuella snutten blockeras av
`connect-src`), och peka en uptime-vakt mot `/api/health`.

## Driftsatt 2026-08-18

Pages `85463c90`, taggen `deploy-2026-08-18`. Tre commits: `e3b6ff5` (KR2),
`9fb3ff0` (P5 + BL2), `752aa96` (omvärldsresearch + dokumentation). Inga nya
migrationer, inga nya secrets. Testsviten **175 gröna**, `check:dist` ren.

Verifierat i drift, inte antaget: `/api/health` **200 friskt** med alla tre
kontrollerna sanna · `/api/subscription/withdraw` ger **405 på GET** och
`login_required` på POST utan session · `/api/team/members` ger 401 utan
session · startsidan visar Studiochefen, Veckopiloten, Butiksskribenten och
Kundpost (inga påhittade namn kvar) · `villkor.html` §15 pekar ut knappen och
nämner portalens sidfot · portalens `app.js` bär etiketterna *Kollegor / dela
team*, *Bjud in en kollega* och *Ångra köpet*.

**Mätfälla att inte gå i igen:** `curl https://mittaiteam.se/villkor.html` ger
**308 till `/villkor`** och en tom kropp. En kontroll utan `-L` ser då ut som en
misslyckad deploy av en sida som i själva verket är korrekt. Samma gäller
rimligen `integritet.html`.

**Kvar som `läst i koden`, inte `mätt`:** Stripe-grenen i `withdraw.js`
(`DELETE /subscriptions/:id`). Emulatorns testteam saknade
`stripe_subscription`, så grenen sprang aldrig — och den kan inte provas skarpt
utan ett riktigt abonnemang att avsluta. Det är den enda delen av dagens arbete
som inte körts.

**Öppen fråga till Mikael:** ångerknappen flyttar inga pengar — den stänger
åtkomsten och mejlar arbetsordern till `info@`. Ska återbetalningen automatiseras
i Stripe är det ett eget beslut, inte en bugg.

## Driftsatt 2026-08-17

Pages `0ce02f55`, worker `mittaiteam-veckobrev`, taggen `deploy-2026-08-17`.
Migration 0006 och 0007 körda skarpt, med säkerhetskopia före varje.

Verifierat i drift, inte antaget: okänd adress ger **404** (gav förut 200 +
startsidan), tolv branschsidor med egna titlar, sitemap 25 URL:er, tre
JSON-LD-block, `/api/health` **200 friskt** med alla tre kontrollerna sanna,
tre mikrofoner i builderns intag, `Granska mitt utkast` och `Veckobrev` i
portalens arbetsyta, veckobrevsrutten 401 utan hemlighet och 200 med, workerns
kedja hela vägen fram, `/avregistrera` 400 på trasig token och 200 på okänd,
`/api/digest/prefs` 401 utan session, och integritetspolicyns punkt 5 på plats.

**Ett steg återstår, och det är ditt:** en uptime-vakt mot
`https://mittaiteam.se/api/health` med larm till mejlen. Allt annat som byggdes
i dag är påslaget.

## Klart

- [x] **OM5** Sparad tid räknas — och syns där köparen tittar — löst 2026-08-29.

  Konkurrenterna säljer på sparad tid. Vi räknade den faktiskt redan, men bara
  på **ett** ställe: längst ner i "📈 Veckans arbete", en panel kunden måste
  öppna själv. Halvårssimuleringen säger varför det är fel plats — värdet bevisas
  hos utföraren, men beslutet att fortsätta betala fattas av någon som sällan
  loggar in.

  **Vad som räknas, och varför inte mer än så.** Bara `timeEstimate` på rutiner
  kunden faktiskt bockat av. `research.md` beställer den siffran som "minuter
  momentet brukar ta manuellt ENLIGT RESEARCHEN (null om researchen inte anger
  tid — hitta aldrig på)", alltså hämtad ur kundens egen beskrivning av sin
  vecka. Att lägga på en schablon per svar eller per möte hade varit att
  uppfinna exakt den siffra hela punkten går ut på att kunna stå för — och den
  som säljer på en påhittad timme får frågan en gång, och slutar betala när
  svaret inte håller. Rutiner utan uppskattning räknas inte, och **antalet skrivs
  ut i gränssnittet** i stället för att tigas ihjäl.

  Fyra ytor i stället för en: **puls-kortet** (det man möts av), **"Veckan som
  gick"** (siffran med i underlaget, med instruktion att inte räkna om den),
  **kvartalsöverblicken** — inklusive den delbara texten, som är själva den rad
  köparen läser — och panelen som redan hade den.

  Kvartalet krävde en egen **veckoliggare** (`atb_sparad_<slug>`, 26 veckor):
  `routLoad()` nollställs varje ISO-vecka, så kvartalsvyn hade annars kunnat
  visa högst en veckas siffra, alltså just den som är för liten för att övertyga
  någon om ett år till. Liggaren **räknar om** veckan i stället för att räkna
  upp den — körs bokföringen två gånger blir svaret detsamma.

  **Veckobrevet fick en annan siffra, med flit.** Rutten har `teams.config` och
  ingenting annat — historiken och avbockningarna bor i kundens webbläsare — så
  servern kan omöjligt veta vad som gjorts. Brevet säger därför vad rutinerna är
  värda *om de körs*, och prompten säger uttryckligen: nämn den en gång, som vad
  som ligger och väntar, aldrig som något som redan är sparat. Under en halvtimme
  utelämnas siffran helt; saknas uppskattningar står ingenting. Ett veckobrev som
  hittar på en timme är värre än ett utan.

  Tio tester i `test/portal.mjs` och fem i `test/digest.mjs`, mest om vad
  siffran INTE innehåller — det är där den spricker. Mutationsprovat: en
  schablon för rutiner utan tid → tio röda; golvet borttaget i brevet → två röda.

  **Inte kört i webbläsare** (femte passet i rad, se skulden i sprintrutan).

- [x] **P4** Grundteamets agenter går att ändra och avsluta — löst 2026-08-29.

  Tillägget var enkelriktat: kunden kunde LÄGGA TILL agenter, aldrig röra dem
  som kom med bygget. En agent som formats för ett arbetsmoment kunden slutat
  med — eller som fått fel ton, fel namn, fel blick — stod kvar i vänsterspalten
  för alltid, och enda utvägen var en ny Builder-körning. Fel utväg av två skäl:
  den kostar ett nytt bygge, och den slänger historiken.

  `teamExt` bär nu tre saker till, alla frivilliga och alla borttagbara:

  - **`retired`** — grundagenter kunden ställt åt sidan. Det är *avsluta*, inte
    radera: historiken ligger kvar under agentens id, och "Ta tillbaka" ger både
    agenten och samtalet tillbaka. En raderad agent hade tagit med sig ett
    halvårs anteckningar utan att kunden visste att hon förlorade dem. En
    *tillagd* agent tas däremot bort på riktigt — den har ingen originalversion
    att återvända till, och därför står det olika ord på de två knapparna.
  - **`edits`** — namn, raden om vad agenten gör, och systemprompten.
    Originalet skrivs aldrig över; ändringen är ett lager, och "Återställ" tar
    bort lagret i stället för att skriva tillbaka en text vi inte har kvar. En
    instruktion kortare än 40 tecken avvisas: en tömd systemprompt gör agenten
    till en vanlig chatt utan perspektiv, alltså precis det teamet finns för att
    inte vara.
  - **`entry`** — vem som leder veckostart, möten och veckobrev. Sätts
    automatiskt när ingångsagenten avslutas. Utan den raden hade portalen
    laddat med en `entryAgent` som inte finns och fallit tillbaka på "första i
    listan", vilket är slumpen och inte ett val. Bekräftelserutan säger vem som
    tar över *innan* kunden klickar ja, och den räknas av samma funktion som
    själva avslutet (`extEntryEfter`) — annars säger dialogen ett namn och
    portalen väljer ett annat.

  Allt bor i samma tillägg som de tillagda agenterna: localStorage, och med
  kopplad mapp även `team-tillagg.json`. Mappsynken slogs ihop till samma
  `applyTeamExt()` som laddningsvägen — förut hade de var sin sammanslagning,
  alltså två sanningar om samma sak. `retired` är union över datorer (ett avslut
  gjort på kontoret ska gälla hemma), medan en lokal `edits`-post vinner över
  filens: den som just skrivit om en systemprompt ska inte få den överskriven av
  en äldre version.

  **Sextusen tester syns inte i en webbläsare, så det här testades i stället:**
  `applyTeamExt` körs ur källan (`⟦EXT-START⟧`/`⟦EXT-SLUT⟧`) mot **varje riktig
  teamkonfig i `portal/teams/`**, med varje agent avslutad en i taget — 14 filer,
  och kravet är att teamet aldrig blir tomt och att `entryAgent` alltid pekar på
  någon som finns. Plus fallen som inte finns i repot: ett team utan
  `always`-agent, ett tillägg som pekar på id:n som försvunnit ur grundkonfigen
  (ny Builder-körning), och en dubblett som försöker skriva över en grundagent.
  Mutationsprovat: skyddet mot tomt team borttaget → rött; entry-lagningen
  borttagen → rött.

  **Inte kört i webbläsare.** UI-delen (dialogen, knapparna) är verifierad
  statiskt — bland annat att `btn-ghost` inte finns i `portal/portal.css` och
  att `.doc-del` är en 36 px ikonknapp som hade klippt ordet "Avsluta". Båda
  rättade innan commit, men ingen har sett dialogen rita upp sig.

- [x] **P6** Auto-körda rutiners "ligger klar"-bevis överlever en omladdning — löst 2026-08-29.

  `autoDelivered` var en modulvariabel, alltså tom vid varje sidladdning. Följden
  var värre än ett borttappat kort, för `routineMarkDone()` körs i samma
  andetag: kortet *"✅ X ligger klar hos Y — läs"* försvann vid F5,
  tabbåterställning eller nästa öppning av PWA:n — och kortet *"📌 Idag: X"* kom
  inte tillbaka i stället, eftersom rutinen redan var avbockad. Arbetet var
  alltså gjort och betalt, låg färdigt längst ner i en agents historik, och
  portalen sa ingenting om det. Just den effekten — "teamet har redan jobbat när
  jag kommer på måndagen" — är hela skälet till att auto-rutiner finns.

  Kvittot ligger nu i localStorage bredvid rutinloggen, med samma slug-nyckling.
  Två regler tar bort det: **läst** (kunden har öppnat agentens samtal, alltså
  sett svaret) och **föråldrat** (äldre än sju dagar — en auto-rutin är
  veckovis, så därefter har nästa körning lagt ett nytt svar under det gamla).
  Samma etikett igen ersätter det gamla kvittot i stället för att lägga sig
  bredvid.

  **Fällan på vägen, som hade flyttat buggen i stället för att laga den:**
  sidan väljer agent åt kunden vid varje laddning (`selectAgent` i `renderApp`).
  Om det räknats som "öppnat samtalet" hade ett svar hos ingångsagenten —
  alltså det vanligaste fallet, måndagsbriefen — kvitterats som läst innan
  kortet ens visats. Boot-anropet bär därför `{ boot: true }` och kvitterar
  ingenting; varje annat anrop är en kund som navigerat dit.

  `test/portal.mjs` är ny (åtta tester) och kör blocket ur `portal/app.js`
  mellan `⟦AUTO-START⟧`/`⟦AUTO-SLUT⟧` i stället för en kopia. Den täcker
  omladdningen, läskvittot, dubbletten, sjudagarsgränsen, trasigt lager,
  demoläget — och att skrivningen, läsningen och boot-flaggan faktiskt är
  inkopplade. `portal/app.js` hade fram till nu noll tester, trots att B1 låg
  precis där.

  **Inte kört i webbläsare.** Verifieringen är statisk (`node --check`,
  källkoppling i test) plus enhetstesterna. En auto-rutin kräver ett riktigt
  AI-anrop, och den lokala nyckeln är ogiltig.

- [x] **KA4** Perspektiven mäts, inte bara räknas — löst 2026-08-29.

  Kvalitetschecklistan säger "två agenter i samma team delar inte perspektiv".
  Kontrollen var närvaro: `kontrolleraSystemprompter()` och golvet i
  `test/teams.mjs` letade efter rubriken `DITT PERSPEKTIV`. Två agenter kunde
  alltså bära exakt samma text under rubriken och passera överallt. Det är den
  enda raden i checklistan som direkt bär projektets existensberättigande —
  samma input får inte ge samma output — och en kontroll som bara räknar
  rubriker är sämre än ingen, för den ser ut som ett skyddsnät.

  Måttet är en **överlappskoefficient på innehållsord**: andelen av det mindre
  ordförrådet som också finns i det andra perspektivet. Jaccard valdes bort —
  den döljer en kort dubblett bakom en lång text. Stoppord och ord under fyra
  tecken räknas inte, annars lyfter "och att för av" varje par mot varandra.

  **Taket 0,70 är mätt, inte gissat.** 108 agentpar i `portal/teams/`: median
  0,12 · p90 0,23 · p99 0,36 · max 0,42 (`konsult.js`, förslag~erfarenhetsbank).
  37 par i `examples/`: median 0,14 · max 0,38. Dessutom ett golv på 60 tecken
  under rubriken — kortaste riktiga sektionen i repot är 148, och utan golvet
  hade en tom rubrik jämförts med en annan tom rubrik och bedömts som "olika".

  Måttet ligger i `builder/builder.js` mellan markörerna `⟦DELAD-START⟧` och
  `⟦DELAD-SLUT⟧`, körs vid generering (`kontrolleraSystemprompter` fäller
  körningen), och **hämtas ur källan** av `test/teams.mjs` och
  `test/examples.mjs`. Testerna kör alltså samma kod som kunden möter; en kopia
  i testet kunde blivit mildare än den som faktiskt kör — samma fälla som
  prompten och schemat gick i två gånger.

  Fyra grindar, inte en: att måttet känner igen en dubblett (identisk text ger
  1,0; ett omskrivet ord räcker inte för att slippa undan), att det släpper
  igenom två riktiga olika perspektiv, att en tom rubrik fälls, och att
  `kontrolleraSystemprompter` faktiskt **anropar** måttet. Dessutom ett test som
  fäller om något par i repot passerar 0,55 — under taket, men långt över allt
  som finns i dag, så en glidning märks medan den som lade till teamet minns
  varför.

  Mutationsprovat: `perspektivLikhet` som alltid svarar 0 fäller ett test, och
  ett bortkopplat anrop fäller ett annat.

- [x] **K4** Den fria rutten är ett bygge, inte en chatt — löst 2026-08-29.

  Hålet hade två halvor, och den andra var den kommersiella. Rutten tog emot
  vilken systemprompt som helst utan slug, utan konto och utan betalning: dels
  gick den att använda som gratis chatbot på vår nyckel, dels kunde en kund vars
  provmånad eller abonnemang tagit slut ta sin nedladdade teamkonfig — som
  innehåller varje agents fullständiga systemprompt (**BF2**) — utelämna slugen
  och fortsätta använda teamet. Betalväggen gällde bara den som lämnade kvar
  slugen i anropet, alltså bara den ärliga kunden.

  Rättningen är strukturell och inte en kontroll: **klienten skickar ingen
  systemprompt till den fria rutten längre.** Den skickar `step` — ett namn ur
  `BUILD_STEPS` — och servern hämtar prompten själv ur `prompts/` (`env.ASSETS`,
  med självhämtning som reserv). Dessutom tar den fria rutten **exakt ett
  användarmeddelande**: ett byggsteg har aldrig fler, en chatt har alltid fler.
  Steget äger också `max_tokens` och schemat; klientens siffror läses inte.
  Kvar som möjlig utdata: byggets egna mellandokument och ett team-JSON.

  På vägen flyttade tre saker ur `builder/builder.js` till `_build.js`:
  `PORTAL_RULES`, `CLARIFY_PROMPT` och `TEAM_SCHEMA`. Det är inte bara en flytt
  — CLAUDE.md kallade prompten och schemat "ETT kontrakt i två filer" och
  räknade upp två tillfällen då de glidit isär (`starters`/`routines`, sedan
  `firstProject`/`seasons`/`triggers`). Nu står beställningen och schemat i
  samma fil. Alla fyra varianter av sammanställningsprompten (läge × arbetssätt)
  jämfördes byte för byte mot den gamla klientkoden före flytten, och
  `TEAM_SCHEMA` deep-equal-jämfördes.

  Grindarna, båda i `test/ai.mjs`: ett stegnamn i `builder.js` som saknas i
  `BUILD_STEPS` fäller bygget (annars 400 för alla i drift), och en prompt-fil
  som faller ur `PROMPT_FILES` i `build-dist.mjs` gör det också (annars 503 på
  just det steget — och för `first-project.md` bara i konsult-läget, alltså
  precis den sorts fel som får ligga i veckor).

  Portalen är orörd: den skickar `system` som förut och gatas av slug plus
  inloggning. Demoläget rör aldrig rutten — varje anropsställe i `portal/app.js`
  ligger bakom en `state.demo`-spärr, kontrollerat.

  **Vad detta INTE gör:** **BF2** står kvar. Systemprompterna går fortfarande
  att ladda ner gratis ur Buildern; de går bara inte längre att köra hos oss.
  Om de ska sluta delas ut är ett eget beslut, och det hänger ihop med **OM1**.

- [x] **KR2** "Beviset" har en körning bakom sig — löst 2026-08-18. Under
  rubriken *Ingen av dem är påhittad* stod fyra påhittade namn
  (Vera/Ester/Sixten/Malte, hämtade ur `design/`-skisserna) med lerverk-exemplets
  form och andra namn. Det var den enda ytan på sajten utan täckning, och den
  hette "Beviset".

  Nu står **Lerverk** där — en riktig körning ur
  `examples/team-builder/lerverk/test-output.md`: Studiochefen, Veckopiloten,
  Butiksskribenten och Kundpost, med "Klart när"-raderna hämtade ur körningen.
  Avslagen växte från två påhittade till körningens **fyra riktiga**, och de är
  vassare än de uppfunna: fotoassistenten föll för att en agent varken kan
  ljussätta eller fota, lagerbevakningen för att "låtsas ha koll utan åtkomst
  vore teater", och försäljningsanalytikern var en *stark* kandidat som föll på
  solo-taket — hens jobb flyttades till VD:n i stället för att strykas, vilket
  är precis fyndet som räddar VD-rollen från att bli teater.

  En rad ovanför tabellen säger vem kunden är och vad körningen gjorde: sju
  arbetsmoment kartlagda, tre över ribban, fyra agenter, fyra nej.

  Grinden: `test/examples.mjs` läser namnen ur `index.html`s passerkort och
  kräver att var och en finns i en fil under `examples/`. Skrivs avsnittet om
  med nya påhittade namn faller bygget — provat genom att byta tillbaka ett av
  de gamla namnen och se testet fälla.

- [x] **P5** Kollegor har en väg in — löst 2026-08-18. Rutterna
  `functions/api/team/{invite,members,remove}.js` skrevs i M3 och stod därefter
  oanropade. Följden var att den knapp som såg ut att dela teamet —
  delningslänken — ger mottagaren en **låst vy**, och att det riktiga svaret
  ("mejla oss") krävde att vi är vakna.

  Sidfotsknappen heter nu **Kollegor / dela team** och öppnar en ruta där
  platserna listas överst, med adressfält och bort-knapp per rad; länken och
  teamfilen ligger kvar under en egen rubrik som det de faktiskt är — teamet som
  läsbart dokument. Rutan visas bara för ägaren, och vi frågar inte om det:
  `/api/team/members` svarar 404 på allt annat, och då faller gränssnittet
  tillbaka på mejltexten i stället för att visa en tom ruta.

  **Verifierat i emulatorn** (`wrangler pages dev` mot lokal D1, riktig
  inloggning med engångskod): medlemslistan, inbjudan (`ok:true, mailed:true`),
  listan igen med två rader, borttagning, och att `agare@…` inte kan ta bort sig
  själv. Testrader städade efteråt.

  Grinden mot att det upprepas: `test/teams.mjs` läser **katalogen**
  `functions/api/team/` och kräver att varje rutt där nämns i `portal/app.js`.
  Nästa rutt någon lägger till omfattas utan att någon behöver minnas det.
  Grinden är provad röd (en tom `zzzprov.js` i katalogen fällde den med rätt
  meddelande) — ett test som inte kan bli rött är en kommentar.

- [x] **BL2** Ångerrätten är en knapp — löst 2026-08-18. `villkor.html` bar sin
  egen anteckning om att en ångerknapp måste finnas i samma gränssnitt den dag
  ett köpflöde med direktbetalning byggs. Kassan byggdes 2026-08-06; knappen
  fanns inte förrän nu.

  Ny rutt `functions/api/subscription/withdraw.js`, medvetet skild från
  uppsägningen: **uppsägning = sluta framåt** (teamet perioden ut, inga pengar
  tillbaka), **ångerrätt = köpet görs ogjort** (åtkomsten upphör nu, pengarna
  tillbaka). Samma rutt med en flagga hade förr eller senare pekat fel.

  Fristen är 14 dagar från det **senaste** köpet — `purchasedAt()` tar
  `max(created_at, plan_changed_at)`, så en uppgradering från provmånad startar
  en ny frist i stället för att kunden ska ha ångerrätt räknad från den dag hon
  byggde teamet. `/api/auth/me` bär därför ett tredje tal (`planChangedAt`), och
  portalen räknar med samma formel; tre tester i `test/plan.mjs` fäller bygget
  om rutten, portalen och villkorstexten glider isär.

  Ordningen inuti rutten är vald och inte slumpad: Stripe först (`DELETE
  /subscriptions/:id` — därför en femte parameter `method` i `stripeCall`),
  planen sedan, mejlet sist. Faller Stripe avbryts hela anmälan, för det
  omvända hade gett en kund utan tjänst som ändå debiteras. Faller mejlet står
  det i svaret — anmälan är redan registrerad.

  **Ingen kod flyttar pengar.** Rutten stänger dörren och mejlar oss;
  återbetalningen görs för hand inom fristen. Att automatisera en oåterkallelig
  utbetalning är ett större beslut än att stänga en dörr.

  **Verifierat i emulatorn:** GET mot rutten ger 405, POST utan session 401,
  ett 20 dagar gammalt team ger `window_closed`, ett färskt ger `withdrawn` →
  `teams.plan = 'refunded'` i D1 → `/api/teams/:slug` går från 200 till
  `plan_ended`, och en andra anmälan ger `nothing_to_withdraw`.

- [x] **BL3** Konkurrensbilden är inte längre förbigången — löst 2026-08-18 med
  `docs/omvarldsresearch-2026-08-18.md`, en uppföljning på en månad av
  `omvarldsresearch-2026-07-17.md`. Punkten formulerades som "aikollegorna.se
  leder med EU-drift", och det stämmer (4 900 kr/mån, dedikerad hårdvara hos
  kunden, "ingen data lämnar era lokaler") — men det var inte det tyngsta
  fyndet.

  **Tyngst är att det största hotet inte är en konkurrent utan plattformsägaren.**
  Claude Cowork ger filsystemsåtkomst, schemalagda uppgifter och
  bakgrundsarbete gratis på varje betald Claude-plan, och Small
  Business-bundlen lägger integrationer ovanpå. Det är vår mappfunktion plus
  våra rutiner, från Anthropic, för ~210 kr/mån.

  Näst tyngst: **Vorker.ai har lämnat väntelistan** (€25/€59 per månad i beta,
  Fortnox- och Visma Spiris-integrationer, engelskspråkig sajt) — fönstret som
  förra researchen kallade "öppet men inte länge" är alltså i färd med att
  stängas på integrationssidan, men står fortfarande vidöppet på
  skräddarsöm och språk: **ingen konkurrent genererar teamet ur kundens egen
  verksamhet.** Sintra säljer 12 fasta helpers, Marblism 6, AI Kollegorna 3,
  Vorker 1.

  Fem drag ligger som **OM1–OM5** ovan.

- [x] **SE1** Tolv branscher har tolv riktiga sidor — löst 2026-08-17. Uppmätt
  före och efter i webbläsare **med JavaScript avstängt** (det en sökmotor utan
  rendering ser): **0 tecken innehåll före, 1 640 efter.** Med JS på: samma h1,
  samma agentkort, inga konsolfel, och sidan ritas *inte* om till galleriet.

  Sidorna renderas med **klientens egen `renderSingle()`**, körd i Node med ett
  stubbat `window`/`document`. Det är hela poängen: ett andra, handskrivet
  HTML-bygge hade blivit ett andra ställe där layouten kan glida, och den fällan
  har projektet redan gått i (`PORTAL_RULES` mot `portal-team.md`). Ändras
  branschsidan i `app.js` följer de tolv statiska sidorna med automatiskt.

  Filnamnet är `verticals/<slug>.html`, alltså samma katalognivå som
  `index.html` — då gäller varje relativ länk oförändrat. `<base href>` hade
  varit alternativet men CSP:n sätter `base-uri 'none'`. `getV()` känner nu igen
  branschen ur **sökvägen** också, annars hade `boot()` ritat om den statiska
  sidan till galleriet. Sitemapen skrivs vid bygget på en markör (13 → 25 URL:er)
  och gallerikorten pekar på de nya adresserna. Grind i `check-dist.mjs`: varje
  bransch måste ha både en sida och en sitemap-rad — provad genom att ta bort en.

  Att lägga till en bransch är därmed fortfarande **en** ändring: ett objekt i
  `verticals.js`.

- [x] **K2** Anropet räknas innan pengarna spenderas — löst 2026-08-17.
  Bokföringen är delad i två steg: `räkna(1, null)` **före** uppströms och
  väntad på, tokens efteråt med `räkna(0, used)` så anropet inte räknas
  dubbelt. Reservationen är **fail-closed** — går den inte att skriva svarar
  rutten 503 och inget anrop går uppströms.

  **Fönstret är krympt, inte borta,** och det står i koden: kvar är glappet
  mellan sista takläsningen och skrivningen, alltså två DB-anrop i stället för
  hela genereringstiden. Att stänga det helt kräver `allowAttempt`-greppet
  (`RETURNING calls` per tak i stället för att läsa först) — fyra rader i två
  tabeller, och de befintliga taktesterna stubbar SELECT-vägen, så det är en
  ombyggnad. Att det får vänta beror på att `allowAttempt` redan är atomär och
  bara släpper 24 anrop per kvart och IP på den fria rutten; överskridandet
  begränsas därmed till dem som råkar ligga i millisekundglappet, och kostnaden
  för det är ören.

  Två tester mäter **garantin, inte implementationen**: att räkningen är skriven
  när `fetch` körs (stubben ögonblicksbildar skrivningarna just då), och att
  inga pengar spenderas när räkningen inte går att skriva.

- [x] **KA5** Skalningssteget kan inte längre läcka tankekedja — löst
  2026-08-17. `scale.md` skrev "räkna tyst" och motiverade det med att Buildern
  visar steget live för kunden, men koden visade vad som än kom.
  `rensaSkalning()` plockar ut de två beställda raderna och är **strikt mot brus,
  förlåtande mot format**: hittas inget `Skalningsbeslut:` visas råtexten, för
  ett beslut som inte når kunden är värre än ett beslut med brus omkring. Den
  rensade texten går också vidare till proposal-steget — nästa steg ska läsa vad
  som beslutats, inte tvekan. Sju tester, valda efter vad en modell faktiskt gör.

- [x] **BL4** Backup av D1 — löst 2026-08-17. `npm run db:backup` exporterar till
  `backup/` (git-ignorerad; `-- --local` för emulatorns kopia). Skriptet avbryter
  om exporten saknar `users`, `teams` eller `team_access` — en export som
  "lyckades" men är tom är värre än ingen, för den ser ut som ett skyddsnät.
  Provat mot lokala D1 (4,3 kB, alla tre tabellerna), och grinden provad genom
  att kräva en tabell som inte finns.

  **Två fel på vägen, båda värda att minnas:** `spawnSync` startade aldrig
  wrangler på Windows utan `shell: true`, och felmeddelandet blev därför "inte
  inloggad" trots att samma kommando kört för hand fungerade — ett meddelande som
  pekade helt fel håll. Och kommandot byggs nu som *en* sträng för att slippa
  nodes DEP0190-varning vid varje körning; en backup-rutin ska inte se orolig ut.

  **Kopiorna ligger på samma disk som repot.** De skyddar mot en trasig
  migration, inte mot en trasig disk. Skriptet säger det, men flytta dem.

- [x] **D3** Något som kan larma — löst 2026-08-17. `GET /api/health` svarar
  **200 när tjänsten kan svara kunder, 503 när den inte kan**: nyckeln finns,
  D1 svarar, och inget kreditfel de senaste tjugo minuterna. **Inget AI-anrop** —
  en vakt som pollar var femte minut hade kostat pengar dygnet runt. Bara
  booleaner i svaret: rutten är öppen (en vakt kan inte logga in) och antal anrop
  per dygn är affärsinformation.

  Underlaget är nya `ai_errors` (migration 0006): dygn, felkod, antal, senaste
  tidpunkt. Inget innehåll, ingen fråga, inget kund-ID — samma linje som
  `ai_usage`. `/api/ai` skriver dit vid uppströmsfel, nätfel och tömd kredit.

  Åtta tester prövar varje felläge **och motproven**: att ett *gammalt*
  kreditfel ger 200 (en rutt som stannar röd när felet är löst gör att larmet
  ignoreras nästa gång), att saknad tabell ger `null` och inte "friskt", och att
  svaret inte läcker nycklar eller siffror. Ett test i `test/ai.mjs` fångade att
  jag skickade `bokförFel` in i `httpFel` men aldrig använde den — rutten hade
  svarat 503 utan att lämna ett spår. SQL:en är provad mot den riktiga tabellen
  i lokala D1, inte bara mot stubben.

  **Driftsatt och migrerat 2026-08-17.** Deploy `c98ecac7`; migration 0006 körd
  skarpt efter en säkerhetskopia med `npm run db:backup` (20,5 kB, med
  `users`/`teams`/`team_access` verifierade). `ai_errors` finns med både
  primärnyckelindex och `idx_ai_errors_last_at`, och `/api/health` gick från
  `ai_kredit: null` till `ai_kredit: true` — alltså från "okänt" till en riktig
  kontroll. Alla tre kontrollerna är nu skarpa.

  **Ett steg återstår, och det är ditt:** peka en uptime-vakt mot
  `https://mittaiteam.se/api/health` med larm till mejlen. Rutten svarar rätt —
  men tills någon lyssnar finns spåret utan att någon tittar, vilket var exakt
  läget när B1 låg stum i tio dagar.

- [x] **SE5** Strukturerad data finns — löst 2026-08-17. Tre block på startsidan:
  `Organization`, `Product` med tre `Offer` (0/90/290 SEK) och `FAQPage`.
  **FAQ:n är genererad vid bygget** ur de synliga `<details>`-blocken
  (`fyllFaqSchema` i `build-dist.mjs`), inte handskriven: Google kräver att
  markupen matchar det besökaren ser, och sex handkopierade svar i samma fil som
  originalet hade glidit isär vid första omformuleringen. Källfilen bär en tom
  markör, så det finns ingenting att hålla synkroniserat.

  Grinden i `scripts/check-dist.mjs` (CI + bygge + deploy) fångar båda
  felmoderna: JSON som inte tolkar, och markup som inte matchar sidans text.
  **Den första versionen av grinden godkände sig själv** — den sökte frågorna i
  hela dokumentet, alltså även inne i sitt eget JSON-LD, och var grön oavsett
  vad den synliga texten sa. Upptäcktes bara genom att ett svar ändrades med
  flit. Nu klipps schemablocken bort ur höstacken först. Mutationstestad i båda
  riktningarna.

  **Dessutom, hittat i samma svep:** `connect-src` i `_headers` släppte
  fortfarande igenom `https://openrouter.ai` — en kvarleva från nyckelvägen.
  Klienten känner ingen leverantörs-URL sedan 6 augusti och serverns anrop lyder
  inte under sidans CSP, så undantaget var dött men stod kvar som en godkänd
  destination att skicka data till. Nu `'self'` och inget mer.

- [x] **KR1** Branschsidorna leder till bygget — löst 2026-08-17. Noll träffar
  på `builder` i hela `verticals/` tidigare: nav-CTA:t var "Priser", knapparna
  var demo, priser och "boka samtal", och sidfoten hade inga länkar alls. Nu
  fyra vägar per branschsida — nav, hero (primärknapp, med demon som
  andrahandsval, samma ordning som på startsidan), avslutet och sidfoten.
  Etiketten är utan branschnamn med flit: namnen är "Bokföringsbyrå" och
  "Coach / soloföretagare", så interpolation gav obegriplig svenska. Verifierat
  i webbläsare på både galleri- och branschvyn.

- [x] **KA2** `triggers` når kunden — löst 2026-08-17. `stripTeam()` bär fältet,
  portalen visar det som **"Vänd dig hit när"** på agentkortet, och
  `portal-team.md` beskriver det. Kapaciteterna säger vad agenten *kan*;
  triggers säger *när* — den svårare frågan för en kund med sex agenter. De 14
  incheckade teamfilerna saknar fältet och visar då inget alls; nya byggen får
  det. Två tester mäter från båda sidor: att `stripTeam` bär vidare varje fält
  portalen läser, och att portalen faktiskt **visar** triggers (etikett, chips
  och stil) — en läsning utan utskrift är samma dödfält ett steg längre fram.

- [x] **DR3** Alla åtta Pages-secrets plus D1-bindningen står i `CLAUDE.md`,
  med vad som händer om var och en uteblir — 2026-08-17. Prisnycklarna läses
  **dynamiskt** via `TIERS[...].env` och syns därför inte om man greppar efter
  `env.STRIPE_PRICE`; det är utskrivet. Ingen `.dev.vars.example`:
  `.gitignore` täcker `.dev.vars.*`, så filen hade blivit osynlig för git.

- [x] **DR4** `docs/vendor-versioner.md` — 2026-08-17. pdf.js **6.2.108** och
  SheetJS **0.20.3**, båda ur filernas egna versionsströmmar. mammoth är
  **inte** fastställd (bundlens versionssträngar hör till dess beroenden) och
  det står utskrivet i stället för gissat. Filen ligger i `docs/`, inte i
  `portal/vendor/`, eftersom allt under `portal/` publiceras — BL1:s poäng var
  att sluta publicera arbetsanteckningar.

- [x] **DR5** Noten om att kod och schema rullas tillbaka **ihop** står i
  `CLAUDE.md` — 2026-08-17. Så länge migrationerna bara lägger till kolumner är
  en ren kodrollback ofarlig; den dag en migration tar bort något koden läser
  blir den en tyst krasch i drift.

- [x] **TG5** "Får plats i minnet"-pricken har `role="img"` + `aria-label` —
  2026-08-17. Förklaringen låg bara i ett `title` på en icke-fokuserbar `span`,
  som varken nås med tangentbord eller på touch. Pricken avgör om agenten
  faktiskt *vet* vad som står i dokumentet.

- [x] **KA1 + KA3** Enkätvägen kan inte längre bygga på enbart kryssval — löst
  2026-08-17. Enkäten står kvar; det är fritexten som blivit obligatorisk när
  den är det enda som saknas. `enkatBaradIntake()` är sant när inget fritextfält
  bär minst 15 tecken ("nej" och "vet ej" är inte beskrivningar), och i
  personläget mäts `role`/`workplace`/`expectations` i stället för
  verksamhetens fält — annars hade en ifylld roll inte räknats.

  Är intaget bara kryss får `CLARIFY_PROMPT` veta det, med instruktionen att
  **aldrig** svara "OK". Faller anropet, eller svarar det "OK" ändå, tar
  `ENKAT_RESERVFRAGOR` över. **Det är den viktigaste raden i ändringen:** den
  gamla koden startade pipelinen direkt i båda fallen, alltså exakt på det
  underlag som inte gick att bygga på. I tvingande läge finns ingen "Hoppa
  över", och rutan säger varför i klartext — kunden valde enkäten för att det
  är svårt att formulera verksamheten, och att bara spärra knappen hade lästs
  som att formuläret krånglar.

  `test/intake.mjs` (6 tester) mäter **två** saker, och skillnaden är poängen:
  att rent enkätintag fortfarande är oskiljbart (en egenskap hos fasta listval,
  inte en bugg att koda bort) och att koden **vet** det, så att grinden slår
  till. Mutationstestat i båda riktningarna: sänks tröskeln till 1 tecken
  faller ett test, tas grinden bort helt faller tre. Verifierat i webbläsare:
  ingen "Hoppa över", blockering med `role="alert"`, pipelinen startar inte.

- [x] **TG1 + TG2 + TG4** Portalen går att använda med tangentbord och
  skärmläsare — löst 2026-08-17. Inloggningens båda steg har kopplade,
  visuellt dolda etiketter (ny `.vh`; formgivningen har ingen plats för synliga,
  och ledtexten säger redan vad som ska skrivas) och felraden har `role="alert"`
  — "Koden gick inte att verifiera" hände tidigare helt tyst. `openOverlay()`
  sätter nu `role="dialog"`, `aria-modal` och `aria-labelledby`, flyttar fokus
  in, fångar Tab och återställer fokus vid stängning; det gäller alla ~15 rutor
  på en gång. Etiketterna i builderns följdfrågor och portalens "Utveckla
  teamet" är kopplade till sina fält.

  Verifierat i webbläsare mot två rutor: rollerna sitter, titeln nås via
  `aria-labelledby`, **25 Tab-tryck lämnar aldrig rutan**, Escape stänger, och
  fokus kommer tillbaka till exakt den knapp som öppnade. Kontrastfärgen mätt
  live: `rgb(143, 63, 34)`.

- [x] **KL3** Avkapade svar syns för kunden — löst 2026-08-17. `finish_reason`
  lästes ingenstans, så ett svar som slog i tokentaket renderades och sparades
  som färdigt. Parsern läser det nu och anropar `opts.onTruncated`; portalen
  lägger en tydlig rad i själva svaret, så varningen följer med i historik,
  kopiering och nedladdning.

- [x] **Klientkodens första tester** (`test/klient.mjs`, 7 st) — 2026-08-17.
  6 540 rader webbläsarkod hade noll, och det var precis där B1 låg i tio dagar.
  Filen laddas med stubbad `window` och stubbad `fetch`. Täckningen är vald
  efter vad som faktiskt gått sönder: strömning + förbrukning, avkapat svar,
  **motprovet** att ett normalt avslut inte varnar, en chunk delad mitt i en
  JSON-rad, felram mitt i strömmen, och att anropet går till `/api/ai` med
  sessionen — aldrig direkt till en leverantör, vilket var vad nyckelvägen
  gjorde. Mutationstestat: tas `finish_reason`-raden bort faller två av dem.

- [x] **SE3 + SE4** Delade länkar ser ut som något — löst 2026-08-17. De fem
  case-sidorna och `builder/index.html` hade bara `<title>`; nu har de
  metabeskrivning, canonical och Open Graph, med egen text per sida (Lindgren är
  nya på AI, Ordrum hade spridd ChatGPT, IKEA är läge B utan intervju, Advanced
  Studio hade redan byggt själv). `villkor.html` och `integritet.html` har fått
  canonical, och `portal/aktivera.html` `noindex` — den nås bara med ett
  `session_id`. Alla canonicals står nu i den form produktionen faktiskt
  serverar: `en-vecka.html` pekade ut sin egen `.html`-adress, som svarar 308.

- [x] **DR2** Arbetet finns utanför datorn — löst 2026-08-17. `git push origin
  main`: `657c29b..a3e1950`, alltså 69 commits, varav 52 från de senaste elva
  dagarna. CI:t från 16 augusti har därmed fått sin första körning. Taggvanan
  är inte påbörjad — den hör till nästa deploy.

- [x] **DR1** Facit komplett i alla sex exempel — löst 2026-08-17. Lerverks fyra
  agenter har nu Perspektiv, Leverans och "Klart när", skrivna ur det exemplets
  egen research: Studiochefen ser sortimentet mot försäljningssiffrorna,
  Veckopiloten ser kvällens timmar, Butiksskribenten ser pjäsen genom ögonen på
  någon som inte kan hålla den, och Kundpost ser mejlet som ett löfte som är på
  väg att avges. Fyra åtskilda perspektiv, inte en mall fyra gånger — och varje
  block hänvisar uttryckligen till en annan agent i teamet, som i de fem övriga
  exemplen. **120 tester gröna.**

- [x] **BF1** Deploy kör testsviten först — löst 2026-08-17. `npm test &&` ligger
  allra först i `deploy`-scriptet, före bygget, så en röd svit stoppar
  driftsättningen i stället för att upptäckas efteråt. Skälet står i en
  `//deploy`-nyckel i `package.json` intill wrangler-noten: CI triggar på push,
  deploy kräver ingen push, och de två var därför frånkopplade. Sviten tar under
  en sekund — det finns ingen anledning att ta bort raden.

- [x] **KL1** Kapplöpningen vid dubbelklick — löst 2026-08-17. Fixad tvärtom mot
  vad punkten föreslog, och det var viktigt: att flytta spärren *upp* hade lagt
  `state.streaming = true` före ett `await` som ligger **utanför**
  `try/finally`, så ett fel i filläsningen hade låst skrivrutan för resten av
  sessionen — en dubbeldebitering utbytt mot en död ruta. Eftersom allt mellan
  spärrkontrollen och flaggan är synkront räckte det att flytta
  `refreshFolder()` **in** i try-blocket, där `finally` alltid återställer.
  Verifierat med ett skript som räknar `await` mellan spärren och flaggan i båda
  funktionerna: **0 i submitMessage, 0 i runMeeting.** Kunden ser dessutom sitt
  eget meddelande direkt nu, medan filerna läses.

- [x] **KL2** "Rensa samtal" kan inte längre äta upp ett betalt svar — löst
  2026-08-17. Två lager: knapparna "Rensa samtal" och "Töm allt" vägrar medan
  ett svar strömmar och säger varför, och de fyra pusharna som sker *efter* ett
  await går genom en ny `pushHistory()` som återskapar arrayen om den försvunnit.
  Samma princip som filens egna AbortError-grenar redan följde ("behåll det som
  kom; det är betald output"). Provat headless: gamla vägen kastar
  `TypeError: Cannot read properties of undefined (reading 'push')`, nya behåller
  svaret.

  **Hittat på vägen:** `wipe.title` sa fortfarande "Tar bort **nyckel**,
  chatthistorik och team-utkast". Det finns ingen nyckel att ta bort sedan
  2026-08-06 — R2/R3/R5 missade en tooltip. Rättad.

- [x] **TG3** Felröd text klarar AA på inloggningsskärmen — löst 2026-08-17.
  `.setup-err` använder nu den mörkare rosten `#8F3F22` (**6,15:1** mot sanden)
  i stället för `--red` (**4,20:1**), med kontrastvärdena och skälet i en
  kommentar intill, som filen redan gör på två andra ställen.

  **Rättelse av punkten:** `builder/builder.css:34` togs inte med. Den regeln är
  **död** — `setup-err` har noll användningar i `builder.js` sedan nyckelskärmen
  försvann. Den och `.buy-keygate-err` är kandidater för borttagning, men det är
  städning av annat slag och görs inte tyst.

- [x] **SE2** Okända adresser ger 404, inte startsidan — löst 2026-08-17. Ny
  `404.html` i `ITEMS`; Cloudflare Pages serverar den för omatchade sökvägar och
  sätter rätt statuskod. Sidan ligger i designsystemet, visar vilken adress som
  saknades (`textContent`, aldrig `innerHTML` — sökvägen kommer från
  adressfältet), har `noindex` och tre vägar vidare, med Buildern som
  primärknapp. Renderad i 1000 px och 360 px: inga konsolfel, ingen horisontell
  scroll. `check-dist` grön med 60 stämplade referenser.

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

- [x] **C4** `examples/` var facit utan det facit ska visa — löst 2026-08-16.
  Samtliga sex exempel saknade **Perspektiv** och **"Klart när"** helt, och
  fyra av dem saknade Leverans. Prompterna hade skärpts medan facit stod kvar,
  vilket är den tystaste sortens fel: CLAUDE.md skickar varje ny läsare — och
  varje ny modell — dit för att se vad output ska likna.

  Alla **24 agentblock** i de sex exemplen har nu Perspektiv, Leverans och
  "Klart när", skrivna var för sig ur respektive exempels egen research. Inte
  en mall kopierad 24 gånger: perspektiven är åtskilda *inom* varje team, för
  det är hela poängen med sektionen — Studiochefen ser sortiment mot
  försäljning där Veckopiloten ser kvällens timmar, offertagenten ser
  omfattning där researchern ser fackspråkets fällor.

  Nytt `test/examples.mjs` håller ribban: antalet Perspektiv, Leverans och
  "Klart när" måste matcha antalet agenter i varje fil. Provat mot ett
  borttaget avsnitt — testet fäller. 120 tester gröna.

  **Rättelse 2026-08-17: fem av sex, inte sex av sex.**
  `examples/team-builder/lerverk/test-output.md` har 4 agentblock men 0
  Perspektiv, 0 Leverans och 0 "Klart när" — de fem andra exemplen är
  kompletta (uppmätt per fil). "120 tester gröna" gällde alltså inte den
  commit som skrev det; testet fäller på lerverk. Kvar som **DR1** ovan.
  Att testet skrevs samtidigt är det som gjorde felet synligt — golvet
  fungerade, det var facit som inte hann med.

- [x] **C6** Inget golv på systemprompternas innehåll — löst 2026-08-16.
  `TEAM_SCHEMA` garanterade att fältet `system` fanns och var en sträng, men
  inte vad som stod i den. Uppmätt: två av fjorton teamfiler saknade
  `DITT PERSPEKTIV` i **samtliga** agenter, och ingenting sa ifrån.

  Golvet ligger nu på två ställen. `kontrolleraSystemprompter()` i
  `builder/builder.js` fäller sammanställningen med ett läsbart fel och samma
  retry-väg som redan fanns; ett test i `test/teams.mjs` håller det som redan
  ligger i repot till samma ribba, så handskrivet och nygenererat bedöms lika.

  Golvet kräver `DITT PERSPEKTIV` och `LEVERANS`, inte alla tio sektionerna i
  `PORTAL_RULES`. Perspektivet är det som gör att två agenter med närliggande
  uppgifter svarar olika — utan det går kvalitetschecklistans "två agenter i
  samma team delar inte perspektiv" inte att uppfylla ens i teorin. Leveransen
  bär "Klart när"-punkterna. De övriga gör svaret bättre; de två gör det till
  ett team. Ett golv som kräver allt hade gjort bygget ostabilt av kosmetiska
  skäl, och ett golv som aldrig fäller är ingen kontroll utan en förhoppning.

  `accountant.js` (3 agenter) och `coachonline.js` (4) är kompletterade för
  hand — med **olika** perspektiv per agent, eftersom sju likalydande stycken
  hade varit samma fel i ny förpackning. Testet skrevs först och fällde på
  exakt de två filerna innan de lagades. 112 tester gröna.

- [x] **K5** `allowAttempt` hade en kapplöpning — löst 2026-08-16. SELECT följt
  av UPDATE lämnade ett fönster där två samtidiga anrop båda läste samma värde,
  båda bedömde sig som tillåtna, och taket överskreds. Inte teoretiskt: taken
  finns för trafik som kommer många samtidigt, och ett skript skickar sina
  anrop parallellt — precis då kontrollen behövde hålla.

  Nu gör en enda `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` hela jobbet;
  räkningen och beslutet kan inte glida isär för de är samma sats. Fönstret
  nollställs i ett CASE-uttryck, och `window_at` flyttas medvetet **inte** fram
  vid varje träff — annars kunde den som fortsätter knacka hålla sitt eget
  fönster öppet i evighet. Funktionen är dessutom fail-closed: uteblir svaret
  stänger den, för det är inloggning och kassa den skyddar.

  **Verifierat mot riktig databas, i två steg.** Åtta nya tester kör mot
  `node:sqlite` (D1 *är* SQLite), och satsen provades sedan mot den skarpa D1:n
  med en engångshink — den returnerade `{count: 2}`, alltså både RETURNING och
  uppräkningsgrenen. Utan den kontrollen hade ett D1 som inte stödjer RETURNING
  blockerat varje anrop till hela tjänsten. Testraden är borttagen.

- [x] **R8** Builderns nedladdning — löst 2026-08-16. Buildern hade en egen
  trerading som varken kopplade in `<a>` i dokumentet eller fördröjde
  `revokeObjectURL`; portalen hade lagat båda och skrivit ner varför.
  Implementationen bor nu i `atb-claude.js`, som båda ytorna redan laddar, så
  det finns en version att laga i stället för två att glömma.

- [x] **C5** `portal-team.md` mot `builder.js` — löst 2026-08-16. Kvar sedan
  förra rundan: mallen beskrev fortfarande att kunden klistrar in en egen
  Anthropic-nyckel och pratar direkt mot Claude, och att auto-rutiner kostar på
  "kundens nyckel". Dessutom saknade agent-exemplet `job`, `capabilities` och
  `starters` — de tre fält portalens agentkort byggs av, alltså det som skiljer
  portalen från en tom chattruta. Mallen har nu en uttrycklig notis om att den
  speglar `stripTeam()` för hand.

- [x] **C2** Personläget gick inte att nå från `/build-team` — löst 2026-08-16.
  `research.md` har ett helt läge för när teamet byggs åt *en person i sitt
  jobb* i stället för åt en verksamhet, men `intake-interview.md` frågade
  aldrig, så `/build-team` kunde inte producera det kontraktet. Webb-Buildern
  hade läget; kommandot hade det inte. Följden var att en anställd som ville ha
  ett team runt sin egen vecka fick ett byggt runt arbetsgivarens
  organisationsschema — precis den generiska output projektet finns för att
  undvika. Intervjun har nu en **fråga 0** (verksamhet eller person?), två
  följdfrågor för personläget (roll i egna ord, vad omgivningen bedömer på),
  och output-formatet finns i två varianter som speglar `research.md` exakt —
  inklusive att `storlek` står på `solo` oavsett hur stor arbetsplatsen är.

- [x] **C3** `proposal.md` tillät generisk VD-output — löst 2026-08-16. Punkten
  sa att om research inte hittade prioriteringsmoment fick VD ett *generiskt*
  operativt eller strategiskt jobb. Det gjorde undantaget till en genväg förbi
  kärnregeln, och VD är den agent som är lättast att fylla med branschklichéer
  — alltså den vanligaste anledningen till att två kunder får team som liknar
  varandra. Nu står motsatsen: inga funna prioriteringsmoment betyder att
  research inte är klar, med konkreta anvisningar om var besluten faktiskt
  fattas (vad som prioriteras bort när veckan inte räcker, vem som avgör vilken
  kund som får vänta). Filen hämtas live av Buildern, så ändringen gäller båda
  vägarna samtidigt.

- [x] **D1** Ingen CI — löst 2026-08-16. `.github/workflows/test.yml` kör
  testsviten och bygget vid push och pull request. Bygget är inte pynt: det
  fäller om `index.html` länkar till juridiksidor som inte publiceras, och om
  SHELL-/CACHE-raden i `portal/sw.js` skrivits om i en form versionsstämplingen
  inte känner igen. Deployar inte — det vore ett större beslut än att köra
  tester. **Börjar gälla när repot pushas: origin ligger 63 commits efter.**

- [x] **Ny kontroll: `scripts/check-dist.mjs`** (2026-08-16) — verifierar att
  varje stämplad URL pekar på en fil som finns, att hashen stämmer med
  innehållet, att ingen lokal js/css-referens är ostämplad, och att service
  workerns SHELL begär samma URL:er som sidorna. Körs av CI **och** av
  `npm run deploy`, så en trasig stämpling aldrig når produktion. Provad mot
  båda felmoderna: den fäller på fel hash och på en avstämplad referens.

- [x] **D4** `npx --yes wrangler` opinnat — löst 2026-08-16. Pinnat till
  4.123.0, versionen alla deployer hittills är gjorda med. Verktyget rör
  produktionen (deploy, D1-migrationer, emulatorn), och att hämta "vilken
  version som råkade vara ute i dag" är en förändring i driften som inte syns
  i något commit.

- [x] **D6** Prislistetestet kollade namn, aldrig belopp — löst 2026-08-16.
  Nya tester läser de **kundsynliga** beloppen i `index.html` och
  `villkor.html` (HTML-kommentarerna borträknade, eftersom de med flit
  innehåller de strukna nivåerna som varning) och kräver att 90 och 290 finns
  och att 190, 490 och 4 990 inte gör det. Dessutom att builderns `PLANS` och
  kassans `TIERS` inte glidit isär, och att provmånaden är `payment` medan
  standard är `subscription` — det senare styr vad kvittosidan säger till
  kunden. Ordgränser i regexen, för `"290 kr".includes("90 kr")` är sant.

- [x] **BL1** Arbetsanteckningar publicerades — löst 2026-08-16. 21,2 kB
  HTML-kommentarer strippas nu ur `dist/`: strukna prisnivåer med belopp, vad
  vi inte kan leverera och varför, vad ett bygge kostar oss i ören, och
  anteckningar om konkurrenter — allt läsbart med "visa källkod" på
  mittaiteam.se. Källfilerna behåller allt; bara den publicerade kopian städas.
  Bygget kontrollerar först att ingen `<script>`/`<style>` innehåller `<!--`
  eller `-->`, så strippningen inte kan kapa mitt i kod.

  **JS-kommentarerna (97 kB) lämnas kvar, medvetet.** Att ta bort dem kräver
  en riktig tokeniserare — en regex bryter på `https://` och på `//` inuti
  strängar — och en minifierare gör den driftsatta koden oläsbar. Det priset
  är för högt här: felsökningen av B1 byggde på att hämta den skarpa filen och
  läsa den. Konsekvensen att leva med är att klientkoden är offentlig läsning,
  vilket den är i vilket fall.

- [x] **K3** Byggtrafik kunde stänga ute betalande kunder — löst 2026-08-16.
  Det globala dygnstaket (4 000) delades av allt, och bygget är gratis,
  anonymt och obegränsat — alltså den trafik som kan explodera. En dag med
  ovanligt många byggen hade gett betalande kunder 503 till midnatt. Fel kund
  att svika: den som bygger gratis kan komma tillbaka i morgon.

  Bygget har nu en egen andel, 2 500 av 4 000, bokförd på raden `build:global`
  i `ai_usage` — ingen migration behövdes. Portalen har därmed alltid minst
  1 500 svar kvar. Det globala taket gäller fortfarande alla: når vi 4 000 är
  tjänsten nere för allihop, vilket är avsiktligt.

  Både grinden **och** bokföringen är byggda — ett tak som läser en siffra
  ingen skriver är inget tak, vilket är exakt vad planens livscykel led av
  före 2026-08-07. Fem nya tester täcker båda, inklusive det som är hela
  poängen: en betalande kund når fram när byggets tak är fullt.

- [x] **C1** Strikt schema mot prompt — löst 2026-08-16. `additionalProperties:
  false` betyder att ett fält som saknas i schemat inte är valfritt utan
  **förbjudet**, så de fält prompten beställde kunde modellen inte leverera hur
  tydligt den än blev tillsagd. Följderna var tysta och gick åt två håll:
  `seasons` saknades i **alla** genererade teamfiler (portalens årshjul var
  permanent tomt), `firstProject` gick inte att producera (konsult-lägets
  🎯-panel kunde aldrig fyllas trots att first-project-steget kördes och
  betalades), och `triggers` gjorde "Triggas av"-chipsen döda. Omvänt krävde
  schemat ett toppnivå-`why` som ingen prompt definierade och ingen kod läste —
  modellen tvingades hitta på det.

  Lagat i **båda** riktningarna: de tre fälten tillagda i schemat (nullbara
  eller tomma där det är rimligt — inget `minItems` som beställer just de
  påhittade datum prompten förbjuder), `why` borttaget ur schemat, `scaling`
  borttaget ur prompten (lästes av ingen; skalningsbeslutet finns redan som
  eget steg). Prompten fick också en `TRIGGERS`-instruktion — nyckeln fanns i
  schemablocket utan att någonstans förklaras.

  Verifierat **skarpt** mot `/api/ai` i strict-läge med schemat extraherat ur
  `builder.js`: `seasons` kommer tillbaka ifylld, `firstProject`-nyckeln finns
  (null i team-builder-läget), `triggers` genereras per agent, `why` och
  `scaling` är borta, och golven för `starters`/`routines`/`rejected` håller.

- [x] **K1** Teckentaket gick att kliva förbi — löst 2026-08-16. Två vägar, inte
  en: `content` som **array** mättes som `String([...])` = `"[object Object]"`,
  femton tecken oavsett nyttolast; och en array med tusentals meddelanden med
  tom `content` summerades till noll. Båda gick vidare orört uppströms, på vår
  räkning. Lagat genom att validera **formen** i stället för att bara mäta
  bättre: `content` måste vara en sträng, `role` normaliseras till
  `user`/`assistant`, `MAX_MESSAGES = 200`, och det som skickas uppströms är
  vårt eget objekt — aldrig klientens. `functions/api/ai.js`.

- [x] **R1** Kvittosidan bad om en OpenRouter-nyckel som inte finns längre —
  löst 2026-08-16. Rättat i samma svep: sidan påstod också "engångsbetalning,
  inget abonnemang" åt alla, vilket är fel för den som just tecknat Standard.
  `/api/checkout/status` returnerar nu `plan`, och texten säger sant per nivå.

- [x] **R2 / R3 / R5** All kvarvarande nyckeltext i kundytorna — löst
  2026-08-16. Branschsidorna ("kör på er egen AI-nyckel"), portalens "Töm
  allt" och meta-beskrivningar, `site/en-vecka.html`s jämförelsetabell,
  delningsrutans "mottagaren använder sin egen nyckel" (som dessutom lovade
  åtkomst den inte ger), samt fem påståenden i galleriet om att motorn är
  "Claude". Kundcitatet i `site/studio.html:72` står kvar — där är Claude
  kundens eget verktyg, inte vår motor.

- [x] **R6** FAQ sålde ett "konsultpaket" utanför prislistan — löst 2026-08-16.
  Ersatt med det som faktiskt finns: gratis bygge, och offert för det större.

- [x] **R7** Tio olika tidsangivelser för ett bygge — löst 2026-08-16. De mätte
  **två olika saker** och blandades: körningen (28 s uppmätt) och totaltiden
  inklusive formuläret. Nu skilda genomgående — "under en minut" om körningen,
  "en kvart" om kundens totala tidsåtgång.

- [x] **C7** `team.language` hårdkodad — löst 2026-08-16. Fältet låg på **två**
  ställen (`structureTeam` och `stripTeam`, där det senare är det som faktiskt
  når konfigen) och lästes av noll rader kod. Borttaget i stället för
  omskrivet, med mallen uppdaterad — samma sortis dödfält som `defaultModel`,
  som låg kvar i mallen och pekade ut en Claude-modell.

- [x] **D5 + D2** Cachningen — löst 2026-08-16, **men diagnosen i D5 var fel**.
  Punkten sa "no-cache åt JS men inte åt CSS". Sanningen, uppmätt i
  produktion: **Cloudflare Pages äger `Cache-Control` på statiska tillgångar
  och skriver över den.** Varken CSS *eller* JS fick no-cache — hela listan i
  `_headers` hade aldrig gjort någonting, inte heller raderna som lades in
  långt tidigare för `atb-claude.js` och `portal/app.js`.

  Att reglerna träffade bevisades genom att lägga en egen header
  (`X-Regeltest`) på samma sökväg och deploya: den kom fram, `Cache-Control`
  gjorde det inte. Det är alltså inte `_headers` som är trasig och inte
  mönstren — det är just den headern som Pages inte släpper fram.

  Det gjorde saken värre än att bara sakna skyddet: kommentaren i `_headers`
  lovade att applagret alltid revalideras, så en deploy såg ut att nå kunden
  direkt medan den i själva verket kunde ta fyra timmar. Det är samma fyra
  timmar som gjorde B1 svår att lita på som lagad.

  Fixen ligger nu där den fungerar oavsett headers: `build-dist.mjs` sätter
  `?v=<innehållshash>` på varje js/css-referens i HTML **och** i service
  workerns SHELL, med samma URL:er på båda ställena. HTML levereras av Pages
  med `max-age=0, must-revalidate` (också uppmätt), så den nya URL:en når
  besökaren direkt. 58 referenser verifierade mot filernas faktiska innehåll,
  bygget är deterministiskt över två körningar, och alla sju portal-URL:er
  svarar 200 skarpt.

  **Det löste D2 på köpet:** cachenamnet i `portal/sw.js` får en hash av hela
  SHELL vid bygget (`atb-portal-v28-ff211dc2`), så bumpen är inte längre ett
  minneskrav. Bygget avbryter om SHELL- eller CACHE-raden skrivs om i en form
  det inte känner igen, i stället för att gissa.

  **Inte åtgärdat:** `portal/teams/<slug>.js` laddas dynamiskt från JS och
  versionsstämplas inte — en uppdaterad teamkonfig kan nå kunden upp till fyra
  timmar sent. Sällsynt, men det är kvar.

- [x] **Tester för `/api/ai`** (2026-08-16) — rutten hade noll, trots att den
  är den enda filen där en manipulerad klient kan kosta oss pengar. 12 tester
  i `test/ai.mjs` kör den **riktiga** `onRequestPost` med stubbad databas och
  stubbad uppström. Testsviten: 81 gröna.
