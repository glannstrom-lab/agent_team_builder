# Mitt AI-team — instrumentet för utveckla-projektet

**Löftet** (ur `CLAUDE.md`, `om.html` och startsidans egna ord, inte ur koden):
Mitt AI-team bygger ett skräddarsytt team av AI-kollegor åt ett svenskt småföretag
utifrån hur företaget faktiskt arbetar en vanlig vecka. Bygget är gratis; teamet
används i portalen (provmånad 90 kr, sedan 290 kr/mån) eller kopplat till kundens
egen Claude/ChatGPT. Det ska ersätta den tomma chattrutan: i stället för att kunden
själv måste veta vad hon ska fråga får hon kollegor med var sitt jobb, rutiner och
svenska regler som stämmer.

**Vem det är för:** ägare till små svenska företag (solo till ~10 anställda) som inte
är tekniska — hantverkare, salonger, byråer, B&B.

**Rivaler:** ChatGPT/Claude med egna projekt, Microsoft Copilot, Vorker.ai, Sintra.

## Panelen (`playtests/personas/`)

| Roll | Persona | Dörr |
|---|---|---|
| Primär | Lena Holm 52, måleri | kall länk till startsidan |
| Granskar yrkesmässigt | Maria Sundqvist 45, redovisningskonsult | inloggad provkund, Salong Vinge |
| Marginalexpert | Johan Eklund 38, webbyrå | (ej körd omgång 1) |
| Holdout | Kerstin Björk 61, B&B | kall länk till startsidan |

## Produktionsskydd

Projektet har konton, D1-data och betalning. Alla sessioner körs mot lokal emulator
(`npm run dev:cf`, port 8788) med syntetisk databas. Inget läggs ut — se frågelistan.

## Fråga först (ur CLAUDE.md)

Stripe-läget, priser (OL1), OM4, OL6, policytexterna (DS1/DS2) är Mikaels.

## Utom räckhåll

Känslan av att betala, riktiga mejl (inloggningskoden), Claude/ChatGPT-kopplingen
(kräver publik URL), mobil i riktig telefon.
