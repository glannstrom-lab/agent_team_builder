/* ============================================================
   Vertikaler — datadriven branschkatalog
   En post = en bransch. app.js renderar en landningssida per post
   via ?v=<slug>, och en översiktsgrid utan parameter.
   Lägg till en bransch = lägg till ett objekt här. Inget annat.

   Fält:
     slug, name, icon, tagline   — kort identitet
     intro                       — 1–2 meningar på landningssidan
     pains[]                     — konkreta veckosmärtor (3 st)
     agents[] {icon,name,role}   — exempel-team (4 st: ledning + specialister)
     firstTask                   — ett konkret första AI-jobb
     demoTeam                    — (valfritt) slug i portal/teams för "prova live"
   ============================================================ */

window.VERTICALS = [
  {
    slug: "bokforing",
    name: "Bokföringsbyrå",
    icon: "📋",
    tagline: "Mindre tid i Fortnox, mer tid med klienterna.",
    intro: "Repetitivt periodarbete, klientmejl och rapportsammanställning äter veckan. Ett litet team tar det tunga lyftet så ni hinner med rådgivningen som faktiskt betalar.",
    pains: [
      "Samma frågor från klienter om och om igen — i mejl, hela dagarna",
      "Månads- och kvartalsbokslut som tar dagar av sammanställning",
      "Underlag som kommer in i tio olika format och måste tolkas manuellt",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Din dagliga arbetspartner som orienterar och pekar rätt" },
      { icon: "✉️", name: "Klientsvar-agent", role: "Utkast till svar på återkommande klientfrågor" },
      { icon: "📊", name: "Rapportsammanställare", role: "Formaterar siffror till klientklara rapporter" },
      { icon: "🔍", name: "Underlagsgranskare", role: "Tolkar och sorterar inkommande underlag" },
    ],
    firstTask: "Ett team som drar ihop månadsrapporten åt en klient — från råsiffror till färdigt utskick — på minuter istället för timmar.",
    demoTeam: "accountant",
  },
  {
    slug: "marknadsbyra",
    name: "Marknadsbyrå",
    icon: "📣",
    tagline: "Alla använder ChatGPT — men ingen tillsammans.",
    intro: "Byrån har redan verktygen, men arbetet är osystematiskt och kvaliteten ojämn. Ett team gör processen gemensam så att rätt sak görs på rätt sätt, varje gång.",
    pains: [
      "Var och en promptar på sitt sätt — kvaliteten spretar",
      "Kundrapporter tar en hel dag varje månad",
      "Idéfasen drar igång från noll inför varje kampanj",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller flödet igång och fördelar arbetet" },
      { icon: "📈", name: "Rapport-agent", role: "Drar ihop kunddata till färdiga månadsrapporter" },
      { icon: "💡", name: "Kampanjidé-agent", role: "Genererar och vässar koncept utifrån briefen" },
      { icon: "✍️", name: "Copy-agent", role: "Publiceringsklar copy i kundens röst" },
    ],
    firstTask: "Ett team som förvandlar en månads kunddata till en färdig, kundklar rapport — samma struktur varje gång.",
    demoTeam: "agency",
  },
  {
    slug: "coaching",
    name: "Coach / soloföretagare",
    icon: "🎓",
    tagline: "Lägg tiden på klienterna, inte på marknadsföringen.",
    intro: "Som solo gör du allt själv — coachar, marknadsför, säljer. Ett litet team tar innehåll och leadhantering så att du kan fokusera på det enda du inte kan delegera: själva mötet.",
    pains: [
      "5–7 h i veckan på blogg och nyhetsbrev",
      "Leads som svalnar för att du inte hinner svara i tid",
      "Svårt att veta vilka erbjudanden som faktiskt konverterar",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Daglig partner som håller veckan i ordning" },
      { icon: "✍️", name: "Innehållsskribent", role: "Publiceringsklara bloggar och nyhetsbrev i din röst" },
      { icon: "🎯", name: "Lead-agent", role: "Triagerar inkommande intresse och skriver första kontakt" },
      { icon: "⚡", name: "VD", role: "Prioriterar veckan mellan sessioner, innehåll och leads" },
    ],
    firstTask: "Ett team som triagerar veckans inkommande leads och lägger färdiga svarsutkast på ditt bord — inga tappade klienter.",
    demoTeam: "coachonline",
  },
  {
    slug: "designstudio",
    name: "Design / kreativ studio",
    icon: "🎨",
    tagline: "Mer tid i det kreativa, mindre i kringarbetet.",
    intro: "Ni har redan börjat bygga egna verktyg. Ett strukturerat team tar offerter, kundkommunikation och researchen runt projekten så att timmarna går till hantverket.",
    pains: [
      "Offerter och projektbriefar tar tid från det betalda arbetet",
      "Kundmejl och avstämningar splittrar fokus",
      "Research inför pitchar görs från grunden varje gång",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Koordinerar projekt och kundkontakt" },
      { icon: "📝", name: "Offert-agent", role: "Utkast till offerter och projektbriefar" },
      { icon: "🔎", name: "Research-agent", role: "Sammanställer underlag inför pitchar" },
      { icon: "✉️", name: "Kundkommunikatör", role: "Förbereder avstämningar och uppföljningar" },
    ],
    firstTask: "Ett team som tar en kort brief och levererar ett färdigt offertutkast att granska och skicka.",
    demoTeam: "studio",
  },
  {
    slug: "e-handel",
    name: "E-handel",
    icon: "🛒",
    tagline: "Produkttexter, kundtjänst och kampanjer — utan att drunkna.",
    intro: "Sortimentet växer snabbare än ni hinner beskriva det, och kundtjänsten tar all tid. Ett team håller produktsidor och svar i toppform så ni kan fokusera på tillväxt.",
    pains: [
      "Hundratals produkter som behöver säljande, SEO-vänliga texter",
      "Samma kundfrågor om frakt, retur och storlek varje dag",
      "Kampanjtexter och nyhetsbrev som alltid hamnar sist",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller överblick och fördelar arbetet" },
      { icon: "🏷️", name: "Produkttext-agent", role: "Säljande, SEO-optimerade produktbeskrivningar" },
      { icon: "💬", name: "Kundtjänst-agent", role: "Utkast till svar på återkommande frågor" },
      { icon: "📧", name: "Kampanj-agent", role: "Nyhetsbrev och kampanjtexter som konverterar" },
    ],
    firstTask: "Ett team som skriver säljande, SEO-vänliga texter för en hel produktkategori på en eftermiddag.",
  },
  {
    slug: "restaurang",
    name: "Restaurang / café",
    icon: "🍽️",
    tagline: "Menyer, sociala medier och recensioner — skött.",
    intro: "Driften tar all energi, och marknadsföringen blir lidande. Ett litet team håller er synliga och svarar på gästerna så att ni kan vara i köket och i salen.",
    pains: [
      "Sociala medier som borde uppdateras men aldrig hinns med",
      "Recensioner som ligger obesvarade",
      "Menybeskrivningar och kampanjer som tar tid ni inte har",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller veckans synlighet i ordning" },
      { icon: "📱", name: "Social media-agent", role: "Inläggsutkast och innehållsplan" },
      { icon: "⭐", name: "Recensionssvar-agent", role: "Personliga svar på recensioner" },
      { icon: "🍷", name: "Menytext-agent", role: "Aptitliga beskrivningar och kampanjer" },
    ],
    firstTask: "Ett team som planerar en veckas inlägg och svarar på de senaste recensionerna — på en kafferast.",
  },
  {
    slug: "maklare",
    name: "Fastighetsmäklare",
    icon: "🏠",
    tagline: "Objektbeskrivningar och uppföljning som säljer.",
    intro: "Tiden går åt till beskrivningar, annonser och att hålla kontakt med spekulanter. Ett team tar textarbetet och uppföljningen så att ni kan vara där affärerna görs — på visningarna.",
    pains: [
      "Objektbeskrivningar och annonstexter för varje nytt objekt",
      "Spekulanter som behöver följas upp i tid",
      "Områdesbeskrivningar och utskick som tar kvällstid",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller objekt och kontakter i ordning" },
      { icon: "🏡", name: "Objekttext-agent", role: "Säljande beskrivningar och annonser" },
      { icon: "🎯", name: "Spekulant-agent", role: "Uppföljningsutkast till intresserade" },
      { icon: "📍", name: "Områdes-agent", role: "Områdesfakta och kringtexter" },
    ],
    firstTask: "Ett team som tar fakta om ett nytt objekt och levererar en färdig, säljande beskrivning att granska.",
  },
  {
    slug: "tandvard",
    name: "Tandvård / klinik",
    icon: "🦷",
    tagline: "Patientkommunikation och administration — avlastad.",
    intro: "Receptionen och kommunikationen tar tid från vården. Ett team tar de återkommande svaren och informationen så att personalen kan fokusera på patienterna.",
    pains: [
      "Samma patientfrågor om priser, tider och behandlingar",
      "Påminnelser och efterkontroller som måste skrivas",
      "Information och broschyrtexter som behöver uppdateras",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller klinikens kommunikation i ordning" },
      { icon: "💬", name: "Patientsvar-agent", role: "Utkast till svar på vanliga frågor" },
      { icon: "🔔", name: "Påminnelse-agent", role: "Vänliga påminnelser och efterkontroller" },
      { icon: "📄", name: "Informations-agent", role: "Patientinformation och behandlingstexter" },
    ],
    firstTask: "Ett team som besvarar dagens patientmejl med färdiga, granskningsbara utkast — receptionen hinner andas.",
  },
  {
    slug: "advokatbyra",
    name: "Advokat- / juristbyrå",
    icon: "⚖️",
    tagline: "Research och utkast — ni behåller bedömningen.",
    intro: "Tiden går åt till research, sammanfattningar och standarddokument. Ett team tar förarbetet så att juristerna kan lägga timmarna på bedömning och klient — aldrig på slutligt juridiskt ansvar.",
    pains: [
      "Rättsfallsresearch och sammanfattningar som tar timmar",
      "Standardavtal och dokument som skrivs om från grunden",
      "Klientmejl och statusuppdateringar som hopar sig",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller ärenden och kommunikation i ordning" },
      { icon: "🔎", name: "Research-agent", role: "Sammanfattar underlag och rättskällor" },
      { icon: "📑", name: "Dokumentutkast-agent", role: "Förslag till standarddokument" },
      { icon: "✉️", name: "Klientkommunikatör", role: "Utkast till statusmejl och uppföljning" },
    ],
    firstTask: "Ett team som sammanfattar underlaget i ett ärende till en strukturerad genomgång — bedömningen gör juristen.",
  },
  {
    slug: "hantverkare",
    name: "Bygg / hantverkare",
    icon: "🔨",
    tagline: "Offerter och kundkontakt på kvällen — borta.",
    intro: "Dagarna är på byggena, kvällarna går åt till offerter och mejl. Ett team tar pappersarbetet så att kvällarna blir lediga igen.",
    pains: [
      "Offerter som skrivs sent på kvällen efter en lång dag",
      "Kundförfrågningar som tar för lång tid att svara på",
      "Projektsammanfattningar och fakturaunderlag",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller jobb och förfrågningar i ordning" },
      { icon: "📝", name: "Offert-agent", role: "Snabba, tydliga offertutkast" },
      { icon: "💬", name: "Förfrågnings-agent", role: "Svar på kundförfrågningar" },
      { icon: "🧾", name: "Underlags-agent", role: "Projektsammanfattningar och fakturaunderlag" },
    ],
    firstTask: "Ett team som gör om dina stolpar till en färdig offert — innan du lämnat bygget.",
  },
  {
    slug: "salong",
    name: "Frisör / salong",
    icon: "💇",
    tagline: "Bokningar, sociala medier och kampanjer — fixat.",
    intro: "Stolen är full, men det runtomkring tar tid. Ett team håller er synliga och kommunikationen igång mellan klippningarna.",
    pains: [
      "Sociala medier som borde skötas men aldrig hinns med",
      "Bokningsfrågor och påminnelser i DM och sms",
      "Kampanjer och erbjudanden som aldrig blir av",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller veckans kommunikation i ordning" },
      { icon: "📱", name: "Social media-agent", role: "Inlägg och innehåll mellan kunder" },
      { icon: "🔔", name: "Boknings-agent", role: "Svar och påminnelser till kunder" },
      { icon: "🎁", name: "Kampanj-agent", role: "Erbjudanden och utskick" },
    ],
    firstTask: "Ett team som planerar veckans inlägg och svarar på bokningsfrågorna — utan att du lägger ifrån dig saxen.",
  },
  {
    slug: "konsult",
    name: "Konsultfirma",
    icon: "💼",
    tagline: "Förslag, research och rapporter — snabbare.",
    intro: "Det fakturerbara konkurrerar alltid med förslag, research och rapporter. Ett team tar förarbetet så att fler timmar blir fakturerbara.",
    pains: [
      "Offert- och förslagsskrivning tar tid från uppdrag",
      "Research inför uppdrag görs om från grunden",
      "Statusrapporter och sammanfattningar till kund",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller uppdrag och pipeline i ordning" },
      { icon: "📝", name: "Förslags-agent", role: "Utkast till offerter och projektförslag" },
      { icon: "🔎", name: "Research-agent", role: "Sammanställer underlag inför uppdrag" },
      { icon: "📊", name: "Rapport-agent", role: "Statusrapporter och kundsammanfattningar" },
    ],
    firstTask: "Ett team som gör om en kort förfrågan till ett genomarbetat projektförslag att granska och skicka.",
  },
];
