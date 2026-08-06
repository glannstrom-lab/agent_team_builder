/* ============================================================
   Vertikaler — datadriven branschkatalog
   En post = en bransch. app.js renderar en landningssida per post
   via ?v=<slug>, och en översiktsgrid utan parameter.
   Lägg till en bransch = lägg till ett objekt här. Inget annat.

   Fält:
     slug, name, icon, tagline   — kort identitet
     intro                       — 1–2 meningar på landningssidan
     pains[]                     — konkreta veckosmärtor (3 st)
     agents[] {icon,name,role}   — exempel-team (3–5 st: ledning + specialister)
     firstTask                   — ett konkret första AI-jobb
     demoTeam                    — (valfritt) slug i portal/teams för "prova live"
     sizeNote                    — (valfritt) friskrivning när demoTeam är byggt
                                   för en specifik storlek/mognad som inte får
                                   generaliseras till hela branschen (se bokforing)

   REGEL: sidans säljtext måste stämma med demoteamet. Lovar sidan en agent
   som teamet avvisat är produktens bärande argument brutet redan i annonsen.
   Ändras ett team i portal/teams måste posten här följa med.
   ============================================================ */

window.VERTICALS = [
  {
    slug: "bokforing",
    name: "Bokföringsbyrå",
    icon: "📋",
    tagline: "Mindre tid i konteringen, mer tid med klienterna.",
    intro: "Konteringen av kvitton och bankposter tar nästan två dagar i veckan, och samma bedömningar görs om från början varje månad. Ett medvetet litet team tar det repetitiva och gör era rättelser till regler som gäller nästa gång.",
    pains: [
      "Kvitton och banktransaktioner konteras manuellt, timme efter timme",
      "Samma bedömningar görs om från början för varje kund varje månad",
      "Underlag kommer in i tio olika format och måste tolkas för hand",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller status per kund och pekar dig till rätt agent" },
      { icon: "⚡", name: "VD", role: "Äger regelboken — avgör de flaggade frågorna så att de gäller nästa gång" },
      { icon: "📋", name: "Verifikationsklassificering-assistent", role: "Föreslår konto med motivering per post — du granskar och bokför" },
    ],
    firstTask: "En riktig kundbunt genom konteringen: en granskningsklar lista med konto och motivering per post, plus en separat lista över det som behöver ditt beslut.",
    demoTeam: "accountant",
    sizeNote: "Demot nedan är byggt för en byrå på tre anställda, helt ny på AI — därför bara tre agenter. En byrå med fler anställda, eller som redan börjat använda AI, får ett större och mer specialiserat team.",
  },
  {
    slug: "marknadsbyra",
    name: "Marknadsbyrå",
    icon: "📣",
    tagline: "Alla använder ChatGPT — men ingen tillsammans.",
    intro: "Byrån har redan verktygen. Det som saknas är en gemensam ton per kund och ett gemensamt rapportformat — i dag bärs båda i huvudet på den som råkar göra jobbet.",
    pains: [
      "Varje kund vill ha sin egen ton, och tonen bärs i huvudet på den som råkar skriva",
      "Månadsrapporterna byggs för hand, 4–6 timmar per kund och månad",
      "Tre creators timmar ska räcka till 7–9 kunder — det spricker någonstans varje vecka",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Trafikledare — håller leveranserna i rörelse och pekar på rätt agent" },
      { icon: "⚡", name: "VD", role: "Äger beläggningen — räknar timmar mot kunder och säger var veckan spricker" },
      { icon: "🎨", name: "Kundröstaren", role: "Håller en tonguide per kund och skriver alltid mot den" },
      { icon: "📊", name: "Månadsrapportören", role: "Gör månadens siffror till en rapport kunden förstår" },
    ],
    firstTask: "Ett team som förvandlar en månads kunddata till ett granskningsklart rapportutkast — samma struktur varje gång.",
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
      { icon: "🧭", name: "VD-assistent", role: "Daglig partner som orienterar och pekar dig till rätt agent" },
      { icon: "⚡", name: "VD", role: "Bestämmer vad veckan ska fokusera på — sessioner, innehåll eller leads" },
      { icon: "✍️", name: "Innehållsskribent", role: "Publiceringsklara bloggar och nyhetsbrev i din röst" },
      { icon: "🎯", name: "Lead-agent", role: "Triagerar inkommande intresse och skriver första kontakt" },
    ],
    firstTask: "Ett team som triagerar veckans inkommande leads och lägger färdiga svarsutkast på ditt bord — inga tappade klienter.",
    demoTeam: "coachonline",
  },
  {
    slug: "designstudio",
    name: "Design / kreativ studio",
    icon: "🎨",
    tagline: "Besluten finns i huvuden — de borde finnas i text.",
    intro: "Ni har redan börjat bygga egna verktyg. Det som saknas är inte AI, utan att varför en design ser ut som den gör aldrig skrivs ner — och därför återuppfinns vid varje presentation och varje ny medarbetare.",
    pains: [
      "Varför en design ser ut som den gör finns i huvuden, inte i text",
      "En ny designer tar en vecka innan dag ett är produktiv",
      "Presentationer byggs om från grunden, och motiveringarna hittas på i efterhand",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Studio-logistiker — en ingång i stället för sex flikar" },
      { icon: "⚡", name: "VD", role: "Äger portföljavvägningen — kundprojekt mot produktsatsningen" },
      { icon: "📦", name: "Onboarding-paketbyggare", role: "Ett projektspecifikt paket så att dag ett räcker i stället för en vecka" },
      { icon: "📝", name: "Rationale-dokumenterare", role: "Fångar besluten medan de fattas och granskar mot stilguiden" },
      { icon: "🎤", name: "Presentationsskrivare", role: "Sidplan med talarstöd, motiveringarna hämtade ur rationale-dokumenten" },
    ],
    firstTask: "Ett onboarding-paket för ett verkligt projekt — så att nästa person är igång på en dag i stället för en vecka.",
    demoTeam: "studio",
  },
  {
    slug: "e-handel",
    name: "E-handel",
    icon: "🛒",
    tagline: "Färre returer, inte fler besökare.",
    intro: "Trafiken räcker. Det som kostar är att var fjärde plagg kommer tillbaka och att förköpsfrågorna besvaras för sent. Ett litet team läser returerna som ett mönster och skriver texter som gör returen onödig.",
    pains: [
      "Var fjärde plagg kommer tillbaka, och nästan alltid på grund av storleken",
      "Trettio till fyrtio förköpsfrågor i veckan, besvarade mellan packningarna",
      "Artikeltexter skrivs i högar när någon hinner — ingen vet vilka som orsakar returerna",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller ihop veckan mellan lagret, kundtjänsten och butiken" },
      { icon: "⚡", name: "VD", role: "Äger returanalysen — vilka artiklar som kommer tillbaka och vad som ska göras" },
      { icon: "🏷️", name: "Artikeltextaren", role: "Mått och passform före adjektiv — texter som gör returen onödig" },
      { icon: "💬", name: "Förköpssvararen", role: "Svarar innan köpet, och matar tillbaka frågorna till artikeltexterna" },
    ],
    firstTask: "En genomgång av förra veckans returer som slutar i tre åtgärder med artikelnamn på — och en text som skrivs om samma dag.",
    demoTeam: "ehandel",
  },
  {
    slug: "restaurang",
    demoTeam: "restaurang",
    name: "Restaurang / café",
    icon: "🍽️",
    tagline: "Schemat, menyn och fakturorna — innan söndagskvällen.",
    intro: "Driften tar all energi, och det administrativa hamnar på söndagskvällen. Ett litet team lägger bemanningen, sätter lunchmenyn utifrån vad som faktiskt finns i kylen, och läser leverantörsfakturorna som annars godkänns i klump.",
    pains: [
      "Schemat läggs om i sista stund varje gång någon sjukanmäler sig",
      "Lunchmenyn bestäms på tio minuter, utan koll på vad som står i kyl och frys",
      "Leverantörsfakturor godkänns i klump för att ingen hinner granska dem",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller ihop veckan så att inget faller mellan skiften" },
      { icon: "⚡", name: "VD", role: "Äger schemat — lägger bemanningen och visar vad en sjukanmälan kostar" },
      { icon: "🥘", name: "Menyplaneraren", role: "Sätter lunchmenyn utifrån vad som finns, inte vad som låter bra" },
      { icon: "🧾", name: "Fakturagranskaren", role: "Läser leverantörsfakturor mot beställning och tidigare pris" },
    ],
    firstTask: "Ett veckoschema lagt på tjugo minuter i stället för tre timmar — med det känsligaste passet utpekat innan det blir ett problem.",
  },
  {
    slug: "maklare",
    name: "Fastighetsmäklare",
    icon: "🏠",
    tagline: "Beskrivningar som håller, och besked som når alla samtidigt.",
    intro: "Textarbetet görs på kvällen, och dödsbouppdragen tar dubbelt så lång tid — inte för att objekten är svårare, utan för att samma besked ska ges till fyra syskon som inte är överens. Ett litet team tar det som ligger runt förmedlingen. Värdering och budgivning gör mäklaren.",
    pains: [
      "Objektbeskrivningar skrivs sent på kvällen, med uppgifter ingen hunnit kontrollera",
      "Ett dödsbo med fyra delägare betyder fyra samtal om samma besked",
      "Objekt som legat i sju veckor blir liggande — beslutet att göra om något fattas aldrig",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller ordning på vilka objekt som väntar på vad" },
      { icon: "⚡", name: "VD", role: "Äger liggetiden — bestämmer när ett objekt måste göras om" },
      { icon: "🏡", name: "Objekttextaren", role: "Skriver beskrivningen och markerar varje uppgift som saknar källa" },
      { icon: "🕊️", name: "Dödsbo-samordnaren", role: "Ett besked, fyra mottagare, ingen som hör det i andra hand" },
    ],
    firstTask: "Ett besked som går ordagrant till samtliga dödsbodelägare samtidigt — plus listan över vem som fått veta vad.",
    demoTeam: "maklare",
  },
  {
    slug: "tandvard",
    name: "Tandvård / klinik",
    icon: "🦷",
    tagline: "Luckor och pengafrågor — inte en enda klinisk bedömning.",
    intro: "Kliniken har kö. Det som kostar är tomma stolar och patienter som inte förstod kostnadsförslaget förrän räkningen kom. Teamet tar det administrativa runt vården och rör aldrig en journal, en patientuppgift eller en klinisk bedömning.",
    pains: [
      "Sex till åtta besök uteblir varje vecka, och luckan fylls inte trots kö",
      "Tandvårdsstödet och kostnadsförslagen förklaras muntligt flera gånger om dagen",
      "En sjukanmäld tandläkare betyder tio besök som ska flyttas på en förmiddag",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller ihop klinikens vecka utanför behandlingsrummet" },
      { icon: "⚡", name: "VD", role: "Äger ombokningskedjan — löser pusslet när en dag måste göras om" },
      { icon: "🧾", name: "Prisförklararen", role: "Gör kostnadsförslaget begripligt innan räkningen kommer" },
      { icon: "🔔", name: "Kallelse- och återbudsagenten", role: "Fyller luckan utan att avslöja något om någon" },
    ],
    firstTask: "En återbudslista som faktiskt arbetas: tre patienter tillfrågade samtidigt om samma lucka, med svarstid — och luckan fylld samma dag.",
    demoTeam: "tandvard",
  },
  {
    slug: "advokatbyra",
    name: "Advokat- / juristbyrå",
    icon: "⚖️",
    tagline: "Allt runt ärendet — aldrig ärendet självt.",
    intro: "Ett AI-verktyg ska inte göra rättsutredningar, och det här gör det inte. Det som blir kvar är det som faktiskt kostar byrån pengar: arbetad tid som aldrig registreras, och klienter som ringer för att det varit tyst i tre veckor.",
    pains: [
      "Arbetad tid som aldrig registreras — och därmed aldrig faktureras",
      "Klienter i familjerättsmål ringer en kvart i taget för att ingen sagt något",
      "Samma allmänna information förklaras muntligt vid varje nytt uppdrag",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller ihop veckan utan att gå in i ett enda ärende" },
      { icon: "⚡", name: "VD", role: "Äger debiteringsgraden — letar arbetad tid som aldrig blev registrerad" },
      { icon: "✉️", name: "Klientbeskedet", role: "Ett kort statusbesked i stället för en kvarts telefonsamtal" },
      { icon: "📄", name: "Byråtexterna", role: "Byråns egna texter — aldrig ett ord i ett enskilt ärende" },
    ],
    firstTask: "Ett statusbesked var fjortonde dag i ett ärendeslag — anonymiserat, utan bedömning, med nästa avstämning utsatt. Rättsutredningen gör juristen.",
    demoTeam: "advokat",
  },
  {
    slug: "hantverkare",
    demoTeam: "hantverkare",
    name: "Bygg / hantverkare",
    icon: "🔨",
    tagline: "Offerter och ändringar som faktiskt faktureras.",
    intro: "Dagarna är på byggena, kvällarna går åt till offerter. Och ändringarna som bestäms muntligt på bygget blir gjorda men aldrig fakturerade. Ett litet team tar pappersarbetet och fångar det som annars försvinner.",
    pains: [
      "Offerter skrivs sent på kvällen — och tre av fyra leder ingenstans",
      "Ändringar bestäms muntligt på bygget och faktureras aldrig",
      "Kunder ringer och frågar om saker som stod i offerten",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller reda på det som annars ligger i ett block i bilen" },
      { icon: "⚡", name: "VD", role: "Äger kalkylen — räknar på jobben och säger var offerten är för tunn" },
      { icon: "📄", name: "Offertskrivaren", role: "Gör kalkylen till en offert kunden faktiskt förstår" },
      { icon: "🔧", name: "ÄTA-agenten", role: "Fångar ändringarna som annars aldrig faktureras" },
    ],
    firstTask: "En muntlig ändring på bygget som blir ett skriftligt ÄTA-underlag med färdig avstämning till kunden — samma dag.",
  },
  {
    slug: "salong",
    name: "Frisör / salong",
    icon: "💇",
    tagline: "Luckorna i boken, inte fler följare.",
    intro: "Stolen är full tre dagar i veckan och tom mitt på dagen. En tom timme går inte att sälja i efterhand. Ett medvetet litet team — tre agenter — håller boken och hör av sig till dem som redan gillar salongen.",
    pains: [
      "Avbokningar samma dag och glapp mitt på dagen som ingen hinner fylla",
      "Bokningsfrågor i sms och DM som besvaras för sent, mellan klippningar",
      "Kunder som slutar komma utan att någon märker det",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Tar det som sägs mellan klippningarna och gör något av det" },
      { icon: "⚡", name: "VD", role: "Äger boken — ser luckorna innan de blir tomma timmar" },
      { icon: "💇", name: "Återkomstpåminnaren", role: "Hör av sig till dem som redan gillar salongen" },
    ],
    firstTask: "Tio kunder som passerat sitt vanliga intervall, med färdigskrivna sms — och tisdagens lucka fylld.",
    demoTeam: "salong",
  },
  {
    slug: "konsult",
    name: "Konsultfirma",
    icon: "💼",
    tagline: "Beläggningen framåt, och materialet ni redan har.",
    intro: "Uppdragen är korta och säljandet slutar när ett uppdrag börjar — så var sjätte vecka uppstår ett glapp som syntes hela tiden. Och varje förslag skrivs från noll trots att ni gjort samma sak fyra gånger.",
    pains: [
      "Glapp i beläggningen som syns i vecka ett och märks i vecka sex",
      "Varje förslag skrivs från noll, trots fem snarlika uppdrag i mappen",
      "Första veckan i ett uppdrag går åt till att förstå vad kundens data innehåller",
    ],
    agents: [
      { icon: "🧭", name: "VD-assistent", role: "Håller ihop uppdragen och det som ligger mellan dem" },
      { icon: "⚡", name: "VD", role: "Äger beläggningen — ser glappet i vecka sex medan det går att göra något" },
      { icon: "📝", name: "Förslagsskrivaren", role: "Bygger nästa förslag av det ni redan gjort" },
      { icon: "📚", name: "Erfarenhetsbanken", role: "Gör ett avslutat uppdrag återanvändbart innan alla glömt det" },
      { icon: "🔎", name: "Underlagsläsaren", role: "Läser kundens data och säger vad den inte räcker till" },
    ],
    firstTask: "Ett avslutat uppdrag skördat på fyrtio minuter — moment, faktisk tidsåtgång, och det som går rakt in i nästa förslag.",
    demoTeam: "konsult",
  },
];
