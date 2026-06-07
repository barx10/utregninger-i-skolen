# Lærerøkonomi – lønnskalkulator for skolen

Frittstående React-app som beregner **lønn, skatt, feriepenger, juniutbetaling og
årsoversikt** for lærere og skoleledere i Norge (Oslo kommune og KS). All logikk og
data kjører lokalt i nettleseren – ingen backend.

Laget for [laererliv.no](https://laererliv.no).

## Funksjoner

- **To tariffområder:** Oslo kommune (lønnsrammer/lønnstrinn) og KS (garantilønn).
- **Stillingskoder & ansiennitet:** Alle Oslo-koder og KS-kategorier, ansiennitet 0/6/8/10/16 år.
- **Tillegg:** Kontaktlærer-hjelpeberegner, funksjons- og lokale tillegg (inngår i feriepengegrunnlaget).
- **Skatt:** Tabelltrekk (fordelt på 10,5 mnd), prosenttrekk eller oppgi netto selv. Oppgi
  skattekort-tabellnummer for **nøyaktig** månedlig trekk fra Skatteetatens offisielle tabeller.
- **Feriepenger:** 12 % / 14,3 % (60+), korrekt ferietrekk (årslønn/260 × 25 dager).
- **Spesialregler:** Første yrkesår (full lønn i juni), halv skatt i desember, pensjonsfradrag.
- **Årsoversikt:** 12-måneders tabell + stolpegraf med juni og desember markert.

## Teknisk

- React 18 + Vite + Tailwind CSS + Framer Motion
- Tariffdata i `src/data/tariff2026.json`
- Skatteetatens månedstabeller i `public/skattetabeller/{2025,2026}.json` (lastes on-demand).
  Generert fra Skatteetatens offisielle tabelltrekk i tekstformat.
- All beregningslogikk i `src/utils/beregninger.js` (rene, testbare funksjoner)

## Utvikling

```bash
npm install
npm run dev      # utviklingsserver
npm run build    # produksjonsbygg → dist/
npm run preview  # forhåndsvis bygget
npm test         # kjør beregningstester (node:test)
```

## Deploy (Vercel)

Konfigurert i `vercel.json`. Koble Vercel til GitHub-repoet:

- Build command: `npm run build`
- Output directory: `dist`
- Ingen miljøvariabler nødvendig

## Forbehold

Lønnstall er Oslo kommune / KS-tariff per **1.5.2026**, og skattesatsene er for
**inntektsåret 2026** (Stortingets skattevedtak). Skatten er et **omtrentlig estimat**
med mindre du oppgir skattekortets tabellnummer (da brukes Skatteetatens offisielle
tabelltrekk). Estimatet tar ikke hensyn til andre fradrag, inntekter eller
individuelle forhold. Faktiske beløp kan avvike – dobbeltsjekk mot lønnsslipp og
skattekort.
