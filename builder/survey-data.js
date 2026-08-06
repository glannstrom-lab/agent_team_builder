/* ============================================================
   Valbar förvalsenkät för Builder-intaget.
   Ren data (window.BUILDER_SURVEY) — UI:t bor i builder.js.
   Tanken: den som tycker det är svårt att beskriva sin verksamhet
   ska kunna kryssa sig fram utan att skriva en enda mening. Svaren
   mappas in i intake-kontraktet (prompts/shared/research.md), de
   ersätter inget — fritexten är fortfarande det som ger mest skärpa.
   Utöka gärna listorna; logiken läser bara strukturen.

   TVÅ ENKÄTER, INTE EN. `sections` frågar en verksamhet om sin vecka;
   `personSections` frågar en enskild person om sin. Det är inte samma
   intervju med andra pronomen: "hur många anställda" och "vilka är era
   kunder" är fel frågor till en ekonomiassistent, och "vad förväntas av
   dig" är fel fråga till ett bolag. Delar de frågeformulär blir teamen
   lika, och då är hela produkten trasig.
   ============================================================ */
window.BUILDER_SURVEY = {
  // type: "single" → en chip kan väljas; "multi" → flera; "moments" →
  // grupperade chips med tre lägen (av → ingår i vardagen → stor tidstjuv).
  sections: [
    {
      key: "industry", type: "single", title: "Bransch",
      hint: "Närmast passande — analysen läser detta som utgångspunkt, inte som facit.",
      options: [
        "Bygg & hantverk", "Redovisning & ekonomitjänster", "Restaurang & café",
        "Butik & detaljhandel", "E-handel", "Skönhet & hälsa",
        "Träning & friskvård", "Konsult & rådgivning", "Marknadsföring & kommunikation",
        "IT & teknik", "Foto, film & kreativt", "Utbildning & kurser",
        "Vård & omsorg", "Fastighet & förvaltning", "Transport & logistik",
        "Jord- & skogsbruk", "Turism & upplevelser", "Förening & organisation",
        "Industri & tillverkning", "Juridik",
      ],
    },
    {
      key: "customers", type: "multi", title: "Vilka är kunderna?",
      options: [
        "Privatpersoner", "Företag", "Offentlig sektor",
        "Föreningar & organisationer", "Återförsäljare & grossister",
        "Få stora kunder", "Många mindre kunder",
        "Mest engångsjobb", "Mest återkommande kunder", "Tydliga säsongskunder",
      ],
    },
    {
      key: "sales", type: "multi", title: "Hur kommer pengarna in?",
      options: [
        "Fysisk butik eller lokal", "Webbshop", "Offerter & anbud",
        "Timdebitering / löpande räkning", "Fasta paket & priser",
        "Abonnemang & avtal", "Bokningar & sessioner",
        "Mässor & marknader", "Via återförsäljare", "Provision & förmedling",
      ],
    },
    {
      key: "moments", type: "moments", title: "Vad ingår i er vardag?",
      hint: "Klicka en gång = ingår i vardagen. Klicka en gång till = stor tidstjuv ⏱. Det här är enkätens viktigaste fråga.",
      groups: [
        { label: "Försäljning & offerter", items: [
          "Skriva offerter", "Räkna på jobb & anbud", "Svara på förfrågningar",
          "Följa upp offerter utan svar", "Hitta nya kunder", "Ta fram prislistor",
        ]},
        { label: "Marknadsföring & synlighet", items: [
          "Inlägg på sociala medier", "Nyhetsbrev", "Uppdatera hemsidan",
          "Skriva produkt- & tjänstetexter", "Annonser (Google, Meta)",
          "Kampanjer & erbjudanden", "Foto & film till kanalerna",
        ]},
        { label: "Kundkontakt & service", items: [
          "Svara på mejl", "Svara i telefon & DM", "Boka & omboka tider",
          "Reklamationer & klagomål", "Orderbekräftelser & statusuppdateringar",
          "Påminna kunder (tider, betalningar)",
        ]},
        { label: "Ekonomi & administration", items: [
          "Fakturera", "Påminna om obetalda fakturor", "Sortera kvitton & underlag",
          "Betala leverantörsfakturor", "Tidrapportering", "Avtal & dokument",
          "Rapportering till myndigheter",
        ]},
        { label: "Planering & produktion", items: [
          "Planera veckans jobb & schema", "Beställa material & varor",
          "Hålla koll på lagret", "Packa & skicka ordrar",
          "Dokumentera utförda jobb", "Kvalitetskontroll",
        ]},
        { label: "Personal & samarbete", items: [
          "Schemalägga personal", "Introducera nya & vikarier",
          "Skriva instruktioner & rutiner", "Personalmöten", "Rekrytering",
        ]},
        { label: "Utveckling & överblick", items: [
          "Prissättning & marginaler", "Hålla koll på konkurrenter",
          "Utveckla nya tjänster & produkter", "Söka bidrag & stöd",
          "Följa vad som händer i branschen",
        ]},
      ],
    },
    {
      key: "tools", type: "multi", title: "Program & system ni använder",
      options: [
        "Fortnox", "Visma", "Bokio", "Annat bokföringsprogram",
        "Excel / Google Kalkylark", "Word / Google Dokument",
        "Outlook / Microsoft 365", "Gmail / Google Workspace",
        "Kassasystem", "Bokningssystem", "Shopify", "WooCommerce",
        "Wix / Squarespace", "CRM-system", "Canva", "Teams / Slack",
        "Mest papper & pärm",
      ],
    },
    {
      key: "channels", type: "multi", title: "Var syns ni i dag?",
      options: [
        "Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube",
        "Nyhetsbrev", "Blogg & hemsida", "Google-annonser",
        "Lokalpress & anslagstavlor", "Mässor & event",
        "Mun-till-mun & rekommendationer", "Offertsajter",
      ],
    },
    {
      key: "rhythm", type: "single", title: "Hur ser året ut?",
      options: [
        "Jämnt året runt", "Högsäsong vår & sommar", "Högsäsong höst & vinter",
        "Deadline-styrt (bokslut, deklarationer …)", "Event- & mässtyrt",
        "Kvälls- & helgtungt",
      ],
    },
    {
      key: "ownai", type: "single", title: "Använder ni redan en AI i dag?",
      hint: "Har ni t.ex. ett ChatGPT-abonnemang kan teamet arbetsleda den i stället för att göra allt själv.",
      options: [
        "Nej / knappt", "ChatGPT (betalt abonnemang)", "ChatGPT (gratis)",
        "Microsoft Copilot", "Google Gemini", "Claude", "Flera olika",
      ],
    },
    {
      key: "goals", type: "multi", title: "Vad ska AI-teamet framför allt ge?",
      options: [
        "Frigöra tid från admin", "Fler kunder & mer försäljning",
        "Jämnare marknadsföring", "Snabbare svar till kunder",
        "Bättre ordning & struktur", "Växa utan att anställa",
        "Mindre kvälls- & helgjobb", "Proffsigare texter & material",
        "Våga ta bättre betalt",
      ],
    },
    {
      key: "nogo", type: "multi", title: "Vad ska AI inte röra?",
      hint: "Blir Avgränsningar i analysen — momenten förblir dina.",
      options: [
        "Prissättning & slutgiltiga offerter", "Kundsamtalen & relationerna",
        "Bokföring & ekonomi", "Juridik & avtal", "Personalfrågor",
        "Det kreativa hantverket", "Rösten i sociala medier",
        "Inget särskilt — AI får hjälpa till överallt",
      ],
    },
  ],

  /* ---------------------------------------------------------------
     Enkäten för en enskild person i sitt jobb.
     Nycklarna återanvänds där betydelsen bär över (industry, tools,
     rhythm, ownai, goals, nogo, moments/tidstjuvar) så att intake-
     blocket kan behandla dem likadant. De personspecifika nycklarna
     — prole, who, expect, friction — finns bara här och blir egna
     rader i intaket.
     --------------------------------------------------------------- */
  personSections: [
    {
      key: "prole", type: "single", title: "Vad är din roll?",
      hint: "Närmast passande. Titeln spelar mindre roll än vad veckan faktiskt består av — den frågan kommer strax.",
      options: [
        "Ekonomi & lön", "Administration & kontor", "Kundtjänst & support",
        "Försäljning", "Marknad & kommunikation", "Projektledning",
        "Inköp", "Logistik & lager", "HR & personal", "IT & teknik",
        "Handläggare", "Chef eller arbetsledare", "Konsult & rådgivare",
        "Lärare & utbildare", "Vård & omsorg", "Hantverk & montage",
        "Egen firma utan anställda", "Annat",
      ],
    },
    {
      key: "industry", type: "single", title: "Vad gör arbetsplatsen?",
      hint: "Samma roll ser helt olika ut på ett bygge och på en advokatbyrå — därför frågar vi.",
      options: [
        "Bygg & hantverk", "Redovisning & ekonomitjänster", "Restaurang & café",
        "Butik & detaljhandel", "E-handel", "Skönhet & hälsa",
        "Träning & friskvård", "Konsult & rådgivning", "Marknadsföring & kommunikation",
        "IT & teknik", "Foto, film & kreativt", "Utbildning & kurser",
        "Vård & omsorg", "Fastighet & förvaltning", "Transport & logistik",
        "Jord- & skogsbruk", "Turism & upplevelser", "Förening & organisation",
        "Industri & tillverkning", "Juridik", "Kommun, region eller myndighet",
      ],
    },
    {
      key: "who", type: "multi", title: "Vem jobbar du mot till vardags?",
      options: [
        "Kunder & beställare", "Kollegor på min avdelning", "Andra avdelningar",
        "Min chef", "Personal jag leder", "Leverantörer & underentreprenörer",
        "Myndigheter", "Medlemmar, patienter eller elever",
        "Externa konsulter & byråer", "Mest på egen hand",
      ],
    },
    {
      key: "moments", type: "moments", title: "Vad består din vecka av?",
      hint: "Klicka en gång = ingår i veckan. Klicka en gång till = stor tidstjuv ⏱. Det här är enkätens viktigaste fråga — teamet byggs runt de här kryssen.",
      groups: [
        { label: "Mejl, möten och avbrott", items: [
          "Läsa och svara på mejl", "Sitta i möten", "Skriva mötesanteckningar",
          "Svara på frågor från kollegor", "Boka och flytta möten",
          "Ringa och bli uppringd", "Bli avbruten mitt i något",
        ]},
        { label: "Underlag och dokument", items: [
          "Leta rätt på information", "Läsa och sammanfatta långa underlag",
          "Skriva rapporter & beslutsunderlag", "Fylla i mallar & blanketter",
          "Granska och rätta andras texter", "Göra presentationer",
          "Skriva protokoll & minnesanteckningar",
        ]},
        { label: "System och registrering", items: [
          "Registrera uppgifter i systemet", "Mata in samma sak på flera ställen",
          "Ta ut listor & rapporter", "Kontrollera att uppgifter stämmer",
          "Följa upp status på ärenden", "Rätta fel i efterhand",
        ]},
        { label: "Kontakter utåt", items: [
          "Svara kunder & beställare", "Reda ut klagomål & missförstånd",
          "Skriva offerter & prisuppgifter", "Följa upp obesvarade ärenden",
          "Boka in kunder & besök", "Skriva utskick & information",
        ]},
        { label: "Siffror och ekonomi", items: [
          "Fakturera", "Attestera & kontera", "Stämma av och leta differenser",
          "Sammanställa siffror åt någon annan", "Tidrapportering",
          "Hålla koll på budget & utfall",
        ]},
        { label: "Planering och egen struktur", items: [
          "Planera min vecka", "Prioritera när allt är brådskande",
          "Påminna andra om sådant de ska göra", "Hålla koll på deadlines",
          "Förbereda inför möten", "Rapportera läget uppåt",
        ]},
        { label: "Rollen och utvecklingen", items: [
          "Lära mig nya system", "Skriva instruktioner & rutiner",
          "Introducera nya kollegor", "Föreslå förbättringar",
          "Hålla mig uppdaterad i mitt område", "Utbilda eller stötta andra",
        ]},
      ],
    },
    {
      key: "expect", type: "multi", title: "Vad förväntas av dig?",
      hint: "Det du mäts på — av chefen, kollegorna eller kunderna. Analysen läser detta som smärta: ett moment du bedöms på men inte hinner med väger tungt.",
      options: [
        "Att jag svarar snabbt", "Att inget faller mellan stolarna",
        "Att deadlines hålls", "Att siffrorna stämmer", "Att kunden är nöjd",
        "Att jag hittar felen innan någon annan gör det",
        "Att jag är tillgänglig", "Att jag håller budget",
        "Att jag hinner med volymen", "Att kvaliteten är hög",
        "Att jag håller ordning åt andra", "Vet inte riktigt — det sägs aldrig rakt ut",
      ],
    },
    {
      key: "friction", type: "multi", title: "Vad stjäl tid utan att synas?",
      hint: "Det som aldrig står i någon arbetsbeskrivning men ändå äter timmar.",
      options: [
        "Avbrott och frågor", "Leta efter information jag vet finns",
        "Mata in samma uppgift på flera ställen", "Vänta på svar från andra",
        "Skriva ungefär samma mejl om igen", "Möten som inte ger något",
        "Rätta underlag som kommer halvfärdiga", "Formatera dokument",
        "Komma ihåg vad jag lovade", "Byta mellan för många system",
        "Städa i mappar och mejl",
      ],
    },
    {
      key: "tools", type: "multi", title: "System du sitter i dagligen",
      options: [
        "Outlook", "Gmail", "Teams", "Slack", "Excel / Google Kalkylark",
        "Word / Google Dokument", "PowerPoint", "SharePoint / OneDrive",
        "Affärssystem (SAP, Business Central …)", "Fortnox", "Visma",
        "CRM-system", "Ärendehanteringssystem", "Journal- eller elevsystem",
        "Tidrapporteringssystem", "Jira / Trello / Asana", "Canva",
        "Bokningssystem", "Mest papper & pärm",
      ],
    },
    {
      key: "rhythm", type: "single", title: "Hur ser ditt år ut?",
      options: [
        "Jämnt året runt", "Tungt vid månadsskiften", "Tungt vid bokslut & deklaration",
        "Terminsstyrt", "Kampanj- & säsongstyrt", "Projektstyrt — toppar när något ska levereras",
        "Sommaren är lugn, resten är full fart",
      ],
    },
    {
      key: "ownai", type: "single", title: "Använder du redan AI i jobbet?",
      hint: "Betalar arbetsgivaren redan för ett AI-verktyg kan teamet arbetsleda det i stället för att göra allt själv.",
      options: [
        "Nej / knappt", "ChatGPT som jag betalar privat",
        "ChatGPT som jobbet betalar", "Microsoft Copilot på jobbet",
        "Google Gemini", "Claude", "Jobbet tillåter inte AI-verktyg än",
      ],
    },
    {
      key: "goals", type: "multi", title: "Vad ska teamet framför allt ge dig?",
      options: [
        "Mer tid till det jag faktiskt är anställd för", "Slippa jobba över",
        "Färre fel och missar", "Snabbare svar till dem som väntar",
        "Bättre ordning på mitt eget", "Skriva bättre och snabbare",
        "Komma ikapp när det blir för mycket", "Kunna säga ifrån med underlag",
        "Lugnare huvud på kvällarna", "Utvecklas i rollen",
      ],
    },
    {
      key: "nogo", type: "multi", title: "Vad ska AI inte röra?",
      hint: "Blir Avgränsningar i analysen. Ta med det arbetsgivaren har bestämt, inte bara det du själv tycker.",
      options: [
        "Personuppgifter om kunder, patienter eller elever",
        "Löner och känsliga siffror", "Interna dokument som inte får lämna huset",
        "Mina samtal och relationer", "Det jag har yrkesansvar för",
        "Beslut som chefen ska fatta", "Ärenden med sekretess",
        "Inget särskilt — AI får hjälpa till överallt",
      ],
    },
  ],
};
