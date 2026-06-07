# Lærerøkonomi – lønnskalkulator for skolen

Frittstående React-app som beregner **lønn, skatt, feriepenger, juniutbetaling og
årsoversikt** for lærere og skoleledere i Norge (Oslo kommune og KS). All logikk og
data kjører lokalt i nettleseren – ingen backend.

Laget for [laererliv.no](https://laererliv.no).

## Funksjoner

- **To tariffområder:** Oslo kommune (lønnsrammer/lønnstrinn) og KS (garantilønn).
- **Stillingskoder & ansiennitet:** Alle Oslo-koder og KS-kategorier, ansiennitet 0/6/8/10/16 år.
- **Tillegg:** Kontaktlærer-hjelpeberegner, funksjons- og lokale tillegg (inngår i feriepengegrunnlaget).
- **Skatt 2026:** Tabelltrekk (fordelt på 10,5 mnd), prosenttrekk eller oppgi netto selv.
- **Feriepenger:** 12 % / 14,3 % (60+), korrekt ferietrekk (årslønn/260 × 25 dager).
- **Spesialregler:** Første yrkesår (full lønn i juni), halv skatt i desember, pensjonsfradrag.
- **Årsoversikt:** 12-måneders tabell + stolpegraf med juni og desember markert.

## Teknisk

- React 18 + Vite + Tailwind CSS + Framer Motion
- Tariffdata i `src/data/tariff2026.json`
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

Alle beløp er estimat basert på tariff 2024–2026 og skattesatser for 2026.
Faktiske beløp kan avvike – dobbeltsjekk mot lønnsslipp og skattekort.
