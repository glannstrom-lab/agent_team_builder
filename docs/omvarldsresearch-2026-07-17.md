# Omvärldsresearch 2026-07-17

> Underlag till `roadmap-anvandarvarde-2026-07-17.md`. Fyra researchspår:
> konkurrenter ("AI-anställda" för SMB), BYO-frontends & Projects-mönster,
> retention/proaktivitet, samt nordisk marknad + open source-agentekosystem.
> Kompletterar den interna UX-granskningen (samma datum, se roadmappen).

## 1. Marknadsläget i korthet

- **Kategorin "AI-anställda för småföretag" är validerad men likriktad.**
  Marblism: 40 000 kunder på 8 månader (~$24/mån). Sintra: massmarknad,
  $39/mån för en "helper", $97/mån för alla 12. Alla säljer **samma fasta
  roster till alla kunder**, på engelska, med "ersätt anställda"-retorik som
  recensionerna punkterar ("starka utkast, inte utförande").
- **Ingen gör skräddarsytt-per-företag. Ingen gör svenska-first. Ingen säger
  nej till teater-agenter.** Projektets kärnregel är exakt luckan.
- **Svensk konkurrent på väg: Vorker.ai** — Henrik Djurestål (KTH/Saab),
  7,5 Mkr pre-seed okt 2025, öppen beta ~april 2026. "AI-kollega" (en, inte
  team) för företag 1–10 anställda. Fönstret att äga kategorin "AI-*team*
  för svenska småföretag" är öppet men inte länge.
  https://www.tn.se/entreprenorskap/47327/
- **Bokföringsjättarna** (Fortnox, Visma Spcs/Spiris, Bokio) bygger in AI
  som *funktion i ekonomiflödet* — domänsmalt, inget tvärfunktionellt team.
  Tredjepartslager ovanpå Fortnox finns (Flowledger, Zimply).
- **Prisankaren:** svenska AI-konsulter 1 200–2 500 kr/h; fastprispaket mot
  SMB 5 000–10 000 kr/mån (AiDev, SmedjaAI m.fl.); AI-kurser ~8 000 kr/person.
  Svensk SMB (~10 anställda) lägger 2 000–8 000 kr/mån på AI-verktyg totalt.
- **GDPR/EU-hosting och svenska** återkommer i varje svensk köpguide —
  BYO + local-first ("din data lämnar aldrig din webbläsare/mapp") är ett
  starkare integritetsargument än de flesta SaaS-konkurrenters, men det
  måste sägas explicit.
- **Distributionskanaler att utforska:** redovisningsbyråer (vill sälja
  rådgivning runt ekonomidatan som Fortnox/Visma äger) och "bli AI-konsult"-
  vågen (Driva Eget kallar det årets affärsidé 2026) — konsult-läget +
  handoff är i praktiken deras verktyg. Sintras "5 företagsprofiler per
  konto" är mönstret för konsult-/byråpaketering.

## 2. Konkurrenter — vad de gör som är värt att låna

| Produkt | Lånbart | Var de är sämre |
|---|---|---|
| **Sintra** (sintra.ai) | "Brain AI": strukturerat företagsminne med fack (röst/ton, skrivprover, produkter, FAQ) + flera profiler per konto; proaktiva dagliga förslag | Samma 12 helpers till alla; helpers isolerade från varandra, ingen mötesfunktion |
| **Marblism** (marblism.com) | Tidslinje-dagrapport ("Eva sorterade inkorgen kl 7…"); "you approve and move on"-utkastflöde; agentkort med självbeskrivning | Fast roster; kräver deras backend; överlovande retorik |
| **Lindy** (lindy.ai) | Mallbibliotek per bransch som säljargument; "svarar som du" via skrivprov | Automationsbyggare, inte team; kreditångest |
| **Artisan** (artisan.co) | Self-serve-onboarding <10 min utan kort; "anställnings"-ceremonin som framing | En roll (sälj); enterprise-pris |
| **Relevance AI** | Säljer BYOK explicit: "din nyckel, ingen markup, fritt modellval" | Byggverktyg, kräver teknisk mognad |
| **Dust** (dust.tt) | "AI är multiplayer" — delade agenter som pitch | Enterprise, kräver IT |
| **MindStudio** | Marketplace för publicerade agenter (stödjer gallerispåret) | Byggarverktyg |

## 3. BYO-frontends & Projects-mönster (TypingMind, LibreChat, big-AGI, Open WebUI, NotebookLM…)

- **Kostnadsvisning:** TypingMind visar uppskattad $-kostnad/kontextlängd per
  samtal vid inmatningsfältet; big-AGI visar kostnad per svar. Usage finns i
  API-svaren; OpenRouter skickar t.o.m. priser i modellkatalogen vi redan hämtar.
- **Nyckelförtroende:** TypingMind säger explicit i UI:t att nyckeln aldrig
  lämnar webbläsaren + erbjuder AES-kryptering med lösenord. Standardmönster:
  validera nyckeln direkt vid inklistring med billigt anrop (modellista).
- **Historik:** LibreChat har fulltextsök + **fork-knapp** per meddelande
  ("fortsätt härifrån" → ny tråd med historiken dit). Open WebUI: mappar som
  bär kontext (systemprompt + kunskapsbas ärvs av nya chattar).
- **Prompt-bibliotek:** Open WebUI:s prompts har **variabler som ger ett
  miniformulär** vid användning — direkt lånbart till `starters`/`routines`
  (`{{kundnamn}}` → ifyllnadsfält).
- **big-AGI "Beam":** samma fråga till flera modeller blint, sida vid sida,
  sedan merge — extern bekräftelse på att mötesfunktionens "oberoende
  perspektiv → sammanställning" är rätt mönster; deras kolumn-UI värt att snegla på.
- **ChatGPT Projects:** projekt-avgränsat *automatiskt* minne (isolerat per
  projekt). Lånbar variant med grind: agenten *föreslår* minnesrader, kunden
  godkänner. **Claude Projects:** allt underlag "bara finns där" — klibbighet
  = investerat underlag. **NotebookLM:** käll-grundning med hänvisningar
  ("enligt er prislista…") + käll-toggle per fråga — dödar hallucinationsoro.
- **File System Access (vscode.dev):** handtag i IndexedDB + Chrome 122:s
  trevägs-prompt "**Allow on every visit**" (persistent permission) + "senaste
  mappar"-lista. Avgör om mappläget känns som produkt eller demo.
  https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api
- **Obsidian-mönstret:** mappen är sanningen, synk är kundens eget lager
  (OneDrive/Dropbox); vanliga `.md`-filer = "ni äger er data". Skriv nya filer
  hellre än redigera befintliga (synk-konflikter).
- **Dela utan server:** URL-fragment (`#cfg=<base64>`) skickas aldrig till
  servern — PrismJS/Excalidraw-mönstret; Excalidraw lägger dessutom
  krypteringsnyckeln i fragmentet (E2E — relevant för M2:s capability-URL:er).
  Fallback: export/import som fil (LibreChat-presets). Praktisk URL-gräns ~2–8 kB.

## 4. Retention & proaktivitet

- **Sidöppningen är vår enda trigger** (ingen server-push) — varje öppning ska
  belönas med något som redan är gjort eller räknat.
- **Streaks (Duolingo):** rätt enhet för målgruppen är **veckor**, inte dagar
  ("5 veckor i rad med teamet"), med semester-freeze. Streak-etablering
  vecka 1 förutsäger långtidsretention (12% → 55% nästa-dags-retention).
- **Veckorecap (Grammarly/Strava):** kvantifiera värdet varje vecka — i
  produkten, vid första öppning efter söndag, byggd på metadata som redan
  finns lokalt.
- **Wrapped (Spotify/Strava):** kvartals-/årssummering som delbar sida =
  retention + organiskt säljmaterial.
- **Headspace-varningen:** påminnelser tar folk tillbaka men ökar inte
  användningen om återkomstytan inte visar *exakt där de var* (pågående
  projekt, dagens rutin) — aldrig en neutral agentlista.
- **ChatGPT Pulse:** genererade "puls-kort" i stället för tom promptruta.
  **ChatGPT Tasks/Claude scheduled:** stående uppdrag levererar färdiga
  utfall — vår variant: rutiner med `auto: true` körs vid sidöppning på rätt
  dag och ligger klara som utkast.
- **Copilot briefing:** leverera där kunden redan är — vårt svar är
  `från-teamet/veckobrev-YYYY-VV.md` i mappläget → fil-notis via kundens
  egen OneDrive/Dropbox = push utan server.
- **Onboarding:** aha-momentet är sannolikt "agenten bevisade att den kan
  *mitt* företag" — första klickbara förslaget ska bara gå att besvara med
  research-fynden. Checklista 3–5 punkter (60–85% completion är riktmärke);
  tomma vyer utan vägledning → 84% lämnar första sessionen.
- **Quiz-effekten (Irrational Labs):** att se sambandet mellan egna svar och
  rekommendationen mer än dubblade aktivering — koppla varje agent explicit
  till kundens intake-svar vid presentationen.
- **B2B-värdig progression:** "Teamet har lärt sig 14 saker om ert företag"
  (sant + nyttigt), upplåsning efter användning (Box: +32% konvertering),
  fira sällan och stort (3 milstolpar). Jämför mot egen historik, aldrig andra.

## 5. Open source-agentekosystemet

- **CrewAI Studio:** bygg via chatt *och* visuell vy, synkade — UI-nästa-steg
  för Buildern (teamet växer fram som kort medan intervjun pågår).
- **AutoGen Studio:** visar agenternas resonemang/turer/tokens efter körning —
  lånbart som "så här jobbade teamet"-expander under mötesanteckningar.
- **LangGraph Studio:** replay/tidsresa — "ändra ett svar, se hur teamförslaget
  ändras" demonstrerar kärnregeln (output beror på input) live.
- **MetaGPT:** agenter kommunicerar via strukturerade dokumentartefakter (SOP),
  inte fri dialog — ge varje agent 1–2 *namngivna återkommande artefakter*
  ("Veckoplan", "Offertutkast") med fast struktur som sparas i mappen.
- **ChatDev:** parvisa granskningsfaser (en agent kritiserar en annans
  leverans före sammanställning) — mer "företag", verkligt kvalitetsvärde.
- **AgentGPT:** måldekomposition med synlig avbockning — mönster för
  "Första projektet" som levande checklista.
- **Anthropics orchestrator-mönster:** huvudagent delegerar bounded subtasks —
  vår VD-assistent-regel; lånbart är att *visa* delegeringen som synlig
  handoff i portalen.
- **Konvergens:** tre saker säljer multi-agent till icke-tekniker — *synlig
  delegering*, *strukturerade återkommande artefakter*, *företagsmetaforen
  som UI*. Portalen har metaforen; de två andra ger mest wow per byggtimme.

## 6. Källor (urval per område)

- Sintra: https://sintra.ai · https://www.lindy.ai/blog/sintra-ai-review
- Marblism: https://www.marblism.com
- Artisan: https://www.artisan.co/blog/artisan-launches-ava-2-0-the-first-autonomous-ai-bdr-now-self-serve
- Relevance: https://relevanceai.com/pricing · Dust: https://dust.tt/home/pricing
- Vorker: https://www.tn.se/entreprenorskap/47327/
- Svenska prisankare: https://workamo.com/blogg/timpris-it-konsult.html · https://www.teknikministeriet.se/ai-for-sma-och-medelstora-foretag/
- TypingMind: https://docs.typingmind.com/general-faqs · LibreChat: https://www.librechat.ai/docs/features
- big-AGI Beam: https://big-agi.com/blog/beam-multi-model-ai-reasoning
- Open WebUI prompts: https://docs.openwebui.com/features/workspace/prompts/
- ChatGPT Projects-minne: https://help.openai.com/en/articles/10169521-using-projects-in-chatgpt
- NotebookLM: https://genemarks.medium.com/why-googles-notebooklm-is-a-killer-app-for-small-business-72e5e6ce8cce
- FSA persistent permissions: https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api
- URL-fragment-state: https://alfy.blog/2025/10/31/your-url-is-your-state.html · Excalidraw E2E: https://plus.excalidraw.com/blog/end-to-end-encryption
- Duolingo streaks: https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- Recap-mejl: https://newsletter.failory.com/p/surprising-effectiveness-recap-emails
- Headspace/quiz-effekten: https://kristenberman.substack.com/p/lessons-on-habit-formation-from-an
- ChatGPT Pulse: https://techcrunch.com/2025/09/25/openai-launches-chatgpt-pulse-to-proactively-write-you-morning-briefs/
- Empty states: https://userpilot.com/blog/empty-state-saas/ · Aha-moment: https://userpilot.com/blog/aha-moment/
- CrewAI Studio: https://docs.crewai.com/en/enterprise/features/crew-studio
- AutoGen Studio: https://www.microsoft.com/en-us/research/blog/introducing-autogen-studio-a-low-code-interface-for-building-multi-agent-workflows/
- MetaGPT: https://www.ibm.com/think/topics/metagpt · ChatDev: https://www.ibm.com/think/topics/chatdev
- Anthropic multi-agent: https://www.anthropic.com/engineering/multi-agent-research-system
