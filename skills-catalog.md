# Skills-katalog

En kurerad lista över Claude Skills som verktyget får föreslå för agenter.
En skill får bara föreslås om den motiveras av ett konkret fynd, precis
som en agent.

Katalogen växer manuellt. Det är en feature, inte en brist — det håller
förslagen jordade i vad som faktiskt finns och fungerar. Lägg till nya
skills här när du verifierat att de är värda att rekommendera.

## Format

Varje skill listas med:

- **Namn** — det som systemet refererar till
- **Vad den gör** — en mening
- **När föreslå** — konkret trigger från intake/research
- **Källa** — var skillen kommer ifrån (Anthropic, community, egen)

---

## Anthropics publika skills

### docx

**Vad den gör:** Skapar, läser och redigerar Word-dokument med rubriker,
tabeller, fotnoter, bilder och spårade ändringar.

**När föreslå:** Kunden/användaren levererar formella dokument till andra
(rapporter, offerter, avtal). Inte när deras interna dokumentation är markdown.

**Källa:** Anthropic

### pptx

**Vad den gör:** Skapar och redigerar PowerPoint-presentationer.

**När föreslå:** Kunden håller regelbundna presentationer för kunder, styrelse
eller internt. Inte för dagliga interna möten.

**Källa:** Anthropic

### xlsx

**Vad den gör:** Skapar och redigerar Excel-filer med formler, formatering,
diagram och flera blad.

**När föreslå:** Kunden jobbar mycket i Excel och behöver automatisera
beräkningar eller rapporter. Extra relevant för bokföring, analys, rapportering.

**Källa:** Anthropic

### pdf

**Vad den gör:** Skapar PDF-filer, fyller formulär, slår ihop och delar
dokument.

**När föreslå:** Kunden skickar fakturor, kontrakt eller officiella dokument
som PDF. Eller behöver manipulera PDF-filer som input.

**Källa:** Anthropic

### pdf-reading

**Vad den gör:** Läser och extraherar innehåll ur PDF-filer, inklusive
skannade dokument via OCR.

**När föreslå:** Kunden får dokument som PDF från andra (kvitton, fakturor,
kontrakt) och behöver plocka ut information ur dem.

**Källa:** Anthropic

### frontend-design

**Vad den gör:** Skapar moderna, välgjorda frontend-gränssnitt — HTML, CSS,
React-komponenter — utan den generiska AI-estetiken.

**När föreslå:** Kunden bygger webbsidor eller interna verktyg med UI. Inte
när arbetet är rent backend eller skript.

**Källa:** Anthropic

### skill-creator

**Vad den gör:** Hjälper till att skapa nya Claude Skills.

**När föreslå:** Användaren är tillräckligt mogen för att bygga egna skills
(byggarenivå) och har identifierat ett återkommande mönster som skulle passa
som skill. Föreslå inte för nybörjare — det är för avancerat.

**Källa:** Anthropic

### file-reading

**Vad den gör:** Router för att läsa olika filtyper (PDF, Word, Excel, CSV,
bilder) när innehåll inte redan är i kontext.

**När föreslå:** Kunden hanterar blandade filformat och behöver en agent
som kan öppna det mesta. Ofta relevant för bokföring, juridik, administration.

**Källa:** Anthropic

---

## Community-skills

*(Lägg till allteftersom du verifierar dem.)*

---

## Egna skills

*(Lägg till när du bygger egna för återkommande behov.)*

---

## Hur verktyget använder katalogen

När systemet föreslår en agent går det igenom katalogen och frågar: finns
det någon skill här som direkt skulle göra den här agenten bättre, baserat
på ett konkret fynd från research?

- **Max 3 skills per agent.** Hellre två välmotiverade än fem spekulativa.
- **En motivering per skill.** "För att ni nämnde att ni skickar månadsrapporter
  i Word" — inte "för att agenten kanske behöver skriva dokument".
- **Inga spekulativa kopplingar.** Om motiveringen måste börja med "kanske"
  eller "eventuellt" — skippa.
