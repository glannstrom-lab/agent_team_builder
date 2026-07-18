/* ============================================================
   Valbar förvalsenkät för Builder-intaget.
   Ren data (window.BUILDER_SURVEY) — UI:t bor i builder.js.
   Tanken: den som tycker det är svårt att beskriva sin verksamhet
   ska kunna kryssa sig fram utan att skriva en enda mening. Svaren
   mappas in i intake-kontraktet (prompts/shared/research.md), de
   ersätter inget — fritexten är fortfarande det som ger mest skärpa.
   Utöka gärna listorna; logiken läser bara strukturen.
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
      key: "moments", type: "moments", title: "Vad ingår i din vardag?",
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
};
