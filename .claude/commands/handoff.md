# /handoff

Avslutar ett ai-consultant-uppdrag: producerar överlämningsdokumentet
som gör kunden självständig. Motsvarar det sista steget som
`/consult` utlovar.

## Förutsättning

Målprojektet har ett team genererat i konsult-läget (`.claude/agents/`
finns, gärna även `first-project-brief.md`). Om teamet saknas — säg
det och föreslå `/consult` istället. Om teamet är genererat i
team-builder-läget (syns i kommentarblocken) — fråga om kunden ändå
vill ha ett överlämningsdokument; formatet fungerar men de
pedagogiska delarna kan tonas ner.

## Flöde

Läs `prompts/ai-consultant/handoff.md` och följ den steg för steg.
Dokumentmallen är `templates/ai-consultant/handoff-document.md`.

Kort:

1. **Inventera teamet** — läs `.claude/agents/`, sammanfatta varje
   agent och varför den finns.
2. **Samla erfarenheter** — fråga kunden vad som fungerat, vad som
   inte gjort det, och vad de lärt sig. Gissa inte.
3. **Skriv dokumentet** — enligt mallen, inklusive den obligatoriska
   sektionen "När ska ni höra av er igen" (tillväxttecken som
   motiverar ett uppföljningsuppdrag).
4. **Visa och justera** — dokumentet är kundens; de ska känna igen
   sina egna ord i det.

Skriv till `.claude/agents/handoff.md` (eller den plats kunden
föredrar). Skriv aldrig över ett befintligt överlämningsdokument
tyst — visa diff.

## Regler

1. **Språk följer kunden.**
2. **Kundens ord i centrum** — citera vad de sa under uppdraget,
   inte generisk AI-rådgivning.
3. **"När ringer ni tillbaka"-sektionen är obligatorisk** — det är
   den kvalitetschecklistan i CLAUDE.md kräver.
