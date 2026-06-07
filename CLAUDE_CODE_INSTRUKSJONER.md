# Instruksjoner: Lærerøkonomi-kalkulator

## Mål
Bygg en frittstående React-app som beregner lønn, feriepenger, juniutbetaling og årsoppsummering for lærere og skoleledere i Norge. Appen deployes til Vercel og lenkes til fra laererliv.no.

---

## Teknisk stack
- React 18 + Vite
- Tailwind CSS
- Ingen backend — all logikk og data er lokal
- Deploy: Vercel (koble til GitHub-repo)

---

## Datakilder (inkluder i `/src/data/`)

Kopier `laererkalkulator_komplett_2026.json` inn i `/src/data/tariff2026.json`. Filen inneholder:
- `oslo.lonnstabell_2026` — alle lønnstrinn 1–80 med årsverdi (kr)
- `oslo.lonnrammer` — LR 901–931 med alle 25 alternativer og ansiennitetstrinn 0/6/8/10/16 år
- `oslo.stillingskoder` — 14 stillingskoder med navn, LR og metadata
- `ks.stillingskoder` — 6 stillingskategorier med garantilønn per ansiennitetstrinn
- `felles` — skatteregler, feriepengeprosenter, trinnskatt 2026

---

## Appstruktur

```
src/
  data/
    tariff2026.json
  components/
    TariffValg.jsx       — Oslo vs KS
    StillingsValg.jsx    — Stillingskode/kategori
    LonnInput.jsx        — Lønn/lønnsramme-input
    Tillegg.jsx          — Kontaktlærer, funksjonstillegg etc.
    Skattevalg.jsx       — Tabelltrekk / prosenttrekk / manuell netto
    Resultater.jsx       — Alle beregninger
    Arsoppsikt.jsx       — 12-månedstabell + graf
  utils/
    beregninger.js       — All beregningslogikk
  App.jsx
```

---

## Flyt: Oslo kommune

### Brukervalg
1. Tariffområde: Oslo
2. Stillingskode (fra nedtrekksliste med alle 14 koder)
3. For undervisningspersonale med ansiennitetsstige:
   - Ansiennitet: 0 / 6 / 8 / 10 / 16 år
   - Lønnsramme: forhåndsvalgt basert på stillingskode (LR 927–931), vises som info
   - Alternativ: 1–25 (tallinnput, default 1)
   - Kalkulatoren slår opp lønnstrinn fra `lonnrammer[lr][alt][ansiennitet]`
   - Kroneverdien hentes fra `lonnstabell_2026[ltr]`
4. For skoleledere (LR 901–906, flat ramme):
   - Brukeren oppgir lønnstrinn direkte fra lønnsslippen
   - Kalkulatoren slår opp kroneverdien

### Beregning Oslo
```
bruttoAarslonn = lonnstabell_2026[ltr]
pensjonsTrekk = bruttoAarslonn * 0.02
skattefundament = bruttoAarslonn - pensjonsTrekk  // SPK-trekk er fradragsberettiget
maanedsbrutto = bruttoAarslonn / 12
```

---

## Flyt: KS

### Brukervalg
1. Tariffområde: KS
2. Stillingskategori (6 valg for undervisning + skoleleder)
3. For undervisningspersonale:
   - Ansiennitet: 0 / 6 / 8 / 10 / 16 år
   - Kalkulatoren viser garantilønn fra tabellen
   - Obs: Mange tjener over garantilønn. Brukeren kan overstyre med faktisk bruttolønn.
4. For skoleleder (kap. 3):
   - Brukeren oppgir faktisk bruttolønn
   - Info: 4,0% tillegg fra mai 2026 av lønn per 30.4.2026

---

## Skatteberegning

Brukeren velger én av tre metoder:

### A: Tabelltrekk (standard for fastansatte)
```js
// Skatten fordeles over 10,5 måneder
// Juni: ingen skattetrekk på feriepenger
// Desember: halvt skattetrekk

function beregnArsskatt(bruttoAarslonn) {
  const trygdeavgift = bruttoAarslonn * 0.077
  const minstefradrag = Math.min(bruttoAarslonn * 0.46, 104450)
  const alminneligInntekt = bruttoAarslonn - minstefradrag - 108550 // personfradrag
  const skattAlminnelig = Math.max(0, alminneligInntekt * 0.22)
  
  // Trinnskatt 2026
  const trinnskatt = beregnTrinnskatt(bruttoAarslonn)
  
  const totalSkattAar = trygdeavgift + skattAlminnelig + trinnskatt
  // Fordelt på 10,5 måneder:
  const trekkPerMaaned = totalSkattAar / 10.5
  return { totalSkattAar, trekkPerMaaned }
}

function beregnTrinnskatt(inntekt) {
  let skatt = 0
  if (inntekt > 217400) skatt += (Math.min(inntekt, 306050) - 217400) * 0.017
  if (inntekt > 306050) skatt += (Math.min(inntekt, 697150) - 306050) * 0.040
  if (inntekt > 697150) skatt += (Math.min(inntekt, 942400) - 697150) * 0.137
  if (inntekt > 942400) skatt += (inntekt - 942400) * 0.167
  return skatt
}
```

### B: Prosenttrekk
Brukeren oppgir prosent fra skattekortet. Trekkes likt alle måneder inkl. juni og desember.

### C: Oppgi netto selv
Brukeren oppgir faktisk netto per måned. Kalkulatoren regner differanser fra dette.

---

## Feriepenger

```js
function beregnFeriepenger(feriepengegrunnlag, alder, forsteYrkesar) {
  const prosent = alder >= 60 ? 0.143 : 0.12
  const feriepenger = feriepengegrunnlag * prosent
  return feriepenger
}
```

**Feriepengegrunnlag:** Summen av all lønn utbetalt forrige kalenderår (oppgis av brukeren, vanligvis fra desemberlønnsslipp). Sensorgodtgjøring inngår IKKE (Oslo-spesifikk regel).

---

## Juniutbetaling

```js
function beregnJuni(bruttoMaanedlon, feriepenger, alder, forsteYrkesar, skatteMetode) {
  // Ferietrekk: trekk for 25 feriedager
  const dagslonn = (bruttoMaanedlon * 12) / 260
  const ferietrekk = dagslonn * 25
  
  // Feriepengetillegg = feriepenger - ferietrekk
  const feriepengetillegg = feriepenger - ferietrekk
  
  // Særregel første yrkesår: full lønn garantert uansett
  if (forsteYrkesar && feriepengetillegg < 0) {
    // Brukeren får full lønn i juni
    return {
      junibrutto: bruttoMaanedlon,
      feriepengetillegg: 0,
      merknad: 'Første yrkesår: full lønn garantert',
    }
  }
  
  // Juniutbetaling = ordinær lønn + feriepengetillegg
  // Feriepengetillegg er trekkfritt
  // Ordinær junilønn skattes normalt (tabelltrekk: trekkes som vanlig)
  
  const skatteJunilonn = beregnSkattetrekk(bruttoMaanedlon, skatteMetode)
  const nettoJuni = (bruttoMaanedlon - skatteJunilonn) + feriepengetillegg
  
  return { junibrutto: bruttoMaanedlon + feriepengetillegg, feriepengetillegg, nettoJuni, skatteJunilonn }
}
```

**Viktig:** Feriepengetillegget er trekkfritt. Selve månedslønnen i juni skattes som normalt med tabelltrekk.

---

## Desemberutbetaling

```js
function beregnDesember(bruttoMaanedlon, skatteMetode) {
  if (skatteMetode === 'tabell') {
    const vanligTrekk = trekkPerMaaned
    const halvtTrekk = vanligTrekk / 2
    const nettoDesember = bruttoMaanedlon - halvtTrekk
    return { bruttoDesember: bruttoMaanedlon, halvtTrekk, nettoDesember }
  }
  // Prosenttrekk: halvt trekk gjelder ikke — full prosent trekkes
}
```

---

## Tillegg

Brukeren legger inn tillegg manuelt i kr/år. Disse inngår i feriepengegrunnlaget.

### Kontaktlærer Oslo
```
Hjelpeberegner: antall elever × 900 + 5000 = kontaktlærertillegg per år
```

### Kontaktlærer KS
Fritekstfelt: "Hva er ditt kontaktlærertillegg? (sjekk med tillitsvalgt — varierer per kommune)"

### Andre tillegg
- Realistillegg (Oslo: 1 ekstra lønnstrinn for 60 stp, 2 for 120 stp)
- Doktorgradstillegg (Oslo: søknad til HR)
- Lokale tillegg fra forhandlinger
- Funksjonstillegg

---

## Årsoppsummering

Vis tabell med alle 12 måneder:

| Måned | Brutto | Skatt | Netto | Merknad |
|-------|--------|-------|-------|---------|
| Jan   | X      | X     | X     |         |
| ...   |        |       |       |         |
| Jun   | X      | X     | X     | Feriepenger |
| ...   |        |       |       |         |
| Des   | X      | X/2   | X     | Halv skatt |

Total netto for året.

Enkel stolpegraf som viser netto per måned (juni og desember skiller seg ut).

---

## Spesielle regler som MÅ implementeres

### Første yrkesår
- Full lønn i juni garantert, selv om feriepengegrunnlag er lavt
- Gjelder: første gangs tiltredelse i skoleverket etter fullført lærerutdanning, ansatt minst 1 år
- Brukeren huker av en checkbox

### Alder over 60
- Feriepengeprosent: 14,3% (ikke 12%)
- Feriedager: 31 (ikke 25) — men tariffavtalen sikrer 5 uker uansett
- For ferietrekk: bruk 25 dager (tariffens 5 uker), ikke 31

### Ansiennitet — viktig merknad
- Nyansatte etter 27. september 2022 (KS): all arbeidserfaring teller
- Ansatte fra før: gammel beregning, avhengig av godvilje fra arbeidsgiver
- Tilkallingsvikariater teller IKKE
- Appen viser en informasjonsboks om dette

### Oslo-spesifikke noter
- Pensjon (2%) er ALLEREDE trukket fra i lønnsrammetabellen — lønnstrinnene er brutto eksklusive pensjon (dvs. pensjonsinnskuddet trekkes av netto som vanlig)
- Sensorgodtgjøring inngår IKKE i feriepengegrunnlaget (Oslo-særregel)
- Kontaktlærertillegg 2026: 5 000 kr grunnbeløp + 900 kr per elev

---

## Design

- Norsk språk gjennomgående
- Profesjonell, ryddig og lett å forstå for lærere som ikke er økonomer
- Responsiv (mobil og desktop)
- Tydelig seksjonsinndeling: 1) Velg tariff og stilling → 2) Lønn og tillegg → 3) Skatt → 4) Resultater
- Fargekode månedene i grafen (juni og desember markert)
- Tooltip/infoknapper der regler er kompliserte

---

## Dataflyt i koden

```js
// Eksempel: Oslo, LR 931 alt 02, 16 år ansiennitet
const lr = '931'
const alt = '2'
const ans = '16'
const ltr = data.oslo.lonnrammer[lr][alt][ans]  // → 50
const aarslonn = data.oslo.lonnstabell_2026[ltr.toString()]  // → 843927
const maanedsbrutto = Math.round(aarslonn / 12)  // → 70327

// KS: Lektor m/tillegg, 16 år
const garantilonn = data.ks.stillingskoder['LektorTillegg'].garantilonn[16]  // → 867400
```

---

## Vercel deploy

1. Koble Vercel til GitHub-repo
2. Build command: `npm run build`
3. Output directory: `dist`
4. Ingen environment variables nødvendig

---

## Viktige beregningsprinsipper å verifisere

1. **Ferietrekk**: årslønn / 260 × 25 dager (IKKE månedlig × antall måneder)
2. **Feriepengetillegg** er trekkfritt — junilønn skattes separat
3. **Tabelltrekk** fordeles på 10,5 måneder (ingen trekk juni, halvt trekk desember)
4. **Prosenttrekk** trekkes likt alle måneder inkl. juni og desember
5. **Pensjonsinnskudd** på 2% trekkes fra brutto og er fradragsberettiget — påvirker netto skattbart
6. **KS-garantilønn** er minstelønn — mange tjener mer. Kalkulatoren skal la bruker overstyre.
7. **Første yrkesår** gjelder begge tariffområder og sikrer full lønn i juni
