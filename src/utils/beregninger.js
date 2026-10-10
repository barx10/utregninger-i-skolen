// All beregningslogikk for lønn, skatt, feriepenger og årsoversikt.
// Rene funksjoner – tar inn tariffdata slik at logikken er testbar og datadreven.

export const MND_NAVN = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember',
]

export const ANSIENNITET_TRINN = ['0', '6', '8', '10', '16']

export const kr = (n) =>
  isFinite(n)
    ? new Intl.NumberFormat('nb-NO', {
        style: 'currency',
        currency: 'NOK',
        maximumFractionDigits: 0,
      }).format(Math.round(n))
    : '–'

export const kr2 = (n) =>
  isFinite(n)
    ? new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' kr'
    : '–'

// ---------------------------------------------------------------------------
// Lønnsoppslag
// ---------------------------------------------------------------------------

// Henter riktig Oslo-lønnstabell for valgt år (faller tilbake til 2026).
export function osloLonnstabell(data, aar = 2026) {
  return data.oslo[`lonnstabell_${aar}`] ?? data.oslo.lonnstabell_2026
}

// Oslo undervisningspersonale med ansiennitetsstige.
export function osloBruttoFraStige(data, lr, alt, ansiennitet, aar = 2026) {
  const ramme = data.oslo.lonnrammer[String(lr)]
  if (!ramme) return null
  const altObj = ramme[String(alt)]
  if (!altObj) return null
  const ltr = altObj[String(ansiennitet)]
  if (ltr == null) return null
  const aarslonn = osloLonnstabell(data, aar)[String(ltr)]
  return { ltr, aarslonn }
}

// Oslo – direkte lønnstrinn (ledere / overstyring).
export function osloBruttoFraLtr(data, ltr, aar = 2026) {
  const aarslonn = osloLonnstabell(data, aar)[String(ltr)]
  return aarslonn != null ? { ltr: Number(ltr), aarslonn } : null
}

// KS garantilønn for kategori + ansiennitet.
export function ksGarantilonn(data, kode, ansiennitet) {
  const k = data.ks.stillingskoder[kode]
  if (!k || !k.garantilonn) return null
  return k.garantilonn[String(ansiennitet)] ?? null
}

// ---------------------------------------------------------------------------
// Skattetabell-oppslag (Skatteetatens offisielle tabelltrekk, månedstabell)
// ---------------------------------------------------------------------------

// Slår opp nøyaktig månedlig tabelltrekk for et tabellnummer og månedsbrutto.
// tabellData: { steg, tabeller: { "8100": { fra, trekk: [...] } } }
export function tabellTrekkMaaned(tabellData, tabellnr, maanedsbrutto) {
  if (!tabellData || !tabellnr) return null
  const t = tabellData.tabeller?.[String(tabellnr).trim()]
  if (!t) return null
  const steg = tabellData.steg || 100
  const i = Math.floor((maanedsbrutto - t.fra) / steg)
  if (i < 0) return 0
  if (i >= t.trekk.length) return t.trekk[t.trekk.length - 1]
  return t.trekk[i]
}

// ---------------------------------------------------------------------------
// Skatt
// ---------------------------------------------------------------------------

export function beregnTrinnskatt(inntekt, trinnTabell) {
  // trinnTabell: [{grense, sats(%)}] sortert stigende. Sats gjelder fra grensen
  // og opp til neste grense.
  let skatt = 0
  for (let i = 0; i < trinnTabell.length; i++) {
    const { grense, sats } = trinnTabell[i]
    if (inntekt <= grense) break
    const neste = trinnTabell[i + 1]?.grense ?? Infinity
    const beloepIDetteTrinnet = Math.min(inntekt, neste) - grense
    skatt += beloepIDetteTrinnet * (sats / 100)
  }
  return skatt
}

// Full årsskatt. Pensjonsinnskudd (2 %) er fradragsberettiget i alminnelig
// inntekt (22 %), men ikke i personinntekt (trygdeavgift/trinnskatt).
export function beregnArsskatt(bruttoAarslonn, felles, pensjonProsent = 0) {
  const f = felles
  const pensjon = bruttoAarslonn * (pensjonProsent / 100)

  const trygdeavgift = bruttoAarslonn * (f.trygdeavgift / 100)
  const trinnskatt = beregnTrinnskatt(bruttoAarslonn, f.trinnskatt_2026)

  const minstefradrag = Math.min(
    bruttoAarslonn * (f.minstefradrag.sats / 100),
    f.minstefradrag.maks,
  )
  const alminneligInntekt = Math.max(
    0,
    bruttoAarslonn - pensjon - minstefradrag - f.personfradrag,
  )
  const skattAlminnelig = alminneligInntekt * (f.skatt_alminnelig / 100)

  const totalSkattAar = trygdeavgift + trinnskatt + skattAlminnelig
  const trekkPerMaaned = totalSkattAar / f.skattetrekk_maneder // typisk /10,5
  const effektivProsent = bruttoAarslonn > 0 ? (totalSkattAar / bruttoAarslonn) * 100 : 0

  return {
    pensjon,
    trygdeavgift,
    trinnskatt,
    minstefradrag,
    alminneligInntekt,
    skattAlminnelig,
    totalSkattAar,
    trekkPerMaaned,
    effektivProsent,
  }
}

// ---------------------------------------------------------------------------
// Feriepenger
// ---------------------------------------------------------------------------

export function feriepengeProsent(felles, alder) {
  return alder >= 60 ? felles.feriepenger.over60 : felles.feriepenger.under60
}

export function beregnFeriepenger(felles, feriepengegrunnlag, alder) {
  const prosent = feriepengeProsent(felles, alder)
  return {
    prosent,
    feriepenger: feriepengegrunnlag * (prosent / 100),
  }
}

// ---------------------------------------------------------------------------
// Måneds-, juni- og desemberberegning
// ---------------------------------------------------------------------------

// Skattetrekk på én ordinær månedslønn for valgt metode. Pensjonstrekket
// (ctx.pensjonMnd) reduserer trekkgrunnlaget.
export function maanedsSkatt(metode, maanedsbrutto, ctx) {
  const trekkgrunnlag = maanedsbrutto - (ctx.pensjonMnd ?? 0)
  switch (metode) {
    case 'tabell':
      return ctx.trekkPerMaaned
    case 'prosent':
      return trekkgrunnlag * (ctx.prosent / 100)
    case 'manuell':
      return Math.max(0, trekkgrunnlag - ctx.nettoManuell)
    default:
      return 0
  }
}

// Juni: med tabelltrekk er juni en trekkfri måned (skatten er fordelt på
// 10,5 mnd) og feriepengene trekkfrie. Med prosenttrekk trekkes skatt av
// månedslønn, ferietrekk og feriepenger samlet.
export function beregnJuni({
  felles,
  maanedsbrutto,
  feriepenger,
  alder,
  forsteYrkesar,
  metode,
  skatteCtx,
}) {
  const dagslonn = (maanedsbrutto * 12) / felles.arbeidsdager_aar
  const ferietrekk = dagslonn * felles.feriedager // alltid 25 dager (tariffens 5 uker)
  let feriepengetillegg = feriepenger - ferietrekk

  let merknad = 'Feriepenger utbetales'
  // Særregel første yrkesår: full lønn garantert.
  if (forsteYrkesar && feriepengetillegg < 0) {
    feriepengetillegg = 0
    merknad = 'Første yrkesår: full lønn garantert'
  }

  const pensjon = skatteCtx.pensjonMnd ?? 0
  let skatt
  if (metode === 'tabell') skatt = 0
  else if (metode === 'prosent')
    skatt = Math.max(0, maanedsbrutto - pensjon + feriepengetillegg) * (skatteCtx.prosent / 100)
  else skatt = maanedsSkatt(metode, maanedsbrutto, skatteCtx)

  const brutto = maanedsbrutto + feriepengetillegg
  const netto = maanedsbrutto - pensjon - skatt + feriepengetillegg

  return {
    ferietrekk,
    feriepengetillegg,
    pensjon,
    skatt,
    brutto,
    netto,
    merknad,
  }
}

// Desember: halvt tabelltrekk (gjelder ikke prosent/manuell).
export function beregnDesember({ maanedsbrutto, metode, skatteCtx }) {
  let skatt = maanedsSkatt(metode, maanedsbrutto, skatteCtx)
  let merknad = ''
  if (metode === 'tabell') {
    skatt = skatt / 2
    merknad = 'Halvt skattetrekk'
  }
  const pensjon = skatteCtx.pensjonMnd ?? 0
  return {
    brutto: maanedsbrutto,
    pensjon,
    skatt,
    netto: maanedsbrutto - pensjon - skatt,
    merknad,
  }
}

// ---------------------------------------------------------------------------
// Hovedberegning – samler alt
// ---------------------------------------------------------------------------

export function beregnAlt({
  data,
  bruttoAarslonn,
  metode, // 'tabell' | 'prosent' | 'manuell'
  prosent = 0, // for prosenttrekk
  nettoManuell = 0, // for manuell netto
  alder = 40,
  forsteYrkesar = false,
  feriepengegrunnlag = null, // hvis null → bruk bruttoAarslonn
  feriepengerDirekte = null, // oppgitt beløp («Opptjente feriepenger i år») – overstyrer %-beregning
  tabellTrekkMnd = null, // nøyaktig månedlig tabelltrekk fra Skatteetatens tabell – overstyrer estimatet
  pensjonProsent = 2.0,
}) {
  const felles = data.felles
  const maanedsbrutto = bruttoAarslonn / 12
  const pensjonMnd = maanedsbrutto * (pensjonProsent / 100)

  const skattInfo = beregnArsskatt(bruttoAarslonn, felles, pensjonProsent)
  // Bruk nøyaktig tabelltrekk hvis oppgitt, ellers det beregnede estimatet.
  const brukerTabell = metode === 'tabell' && tabellTrekkMnd != null
  const trekkMnd = brukerTabell ? tabellTrekkMnd : skattInfo.trekkPerMaaned
  const skatteCtx = {
    trekkPerMaaned: trekkMnd,
    prosent,
    nettoManuell,
    pensjonMnd,
  }

  const grunnlag = feriepengegrunnlag ?? bruttoAarslonn
  const { prosent: fpProsent, feriepenger: fpBeregnet } = beregnFeriepenger(felles, grunnlag, alder)
  // Direkte beløp (fra desemberslippen) er mest nøyaktig og overstyrer %-beregningen.
  const feriepenger = feriepengerDirekte != null ? feriepengerDirekte : fpBeregnet
  const grunnlagVist =
    feriepengerDirekte != null ? feriepenger / (fpProsent / 100) : grunnlag

  const juni = beregnJuni({
    felles,
    maanedsbrutto,
    feriepenger,
    alder,
    forsteYrkesar,
    metode,
    skatteCtx,
  })

  const desember = beregnDesember({ maanedsbrutto, metode, skatteCtx })

  // Bygg 12-måneders oversikt.
  const ordinaerSkatt = maanedsSkatt(metode, maanedsbrutto, skatteCtx)
  const maaneder = MND_NAVN.map((navn, i) => {
    if (i === 5) {
      return {
        navn,
        kort: navn.slice(0, 3),
        brutto: juni.brutto,
        pensjon: juni.pensjon,
        skatt: juni.skatt,
        netto: juni.netto,
        merknad: juni.merknad,
        type: 'juni',
      }
    }
    if (i === 11) {
      return {
        navn,
        kort: navn.slice(0, 3),
        brutto: desember.brutto,
        pensjon: desember.pensjon,
        skatt: desember.skatt,
        netto: desember.netto,
        merknad: desember.merknad,
        type: 'desember',
      }
    }
    return {
      navn,
      kort: navn.slice(0, 3),
      brutto: maanedsbrutto,
      pensjon: pensjonMnd,
      skatt: ordinaerSkatt,
      netto: maanedsbrutto - pensjonMnd - ordinaerSkatt,
      merknad: '',
      type: 'ordinaer',
    }
  })

  const aarBrutto = maaneder.reduce((s, m) => s + m.brutto, 0)
  const aarPensjon = maaneder.reduce((s, m) => s + m.pensjon, 0)
  const aarSkatt = maaneder.reduce((s, m) => s + m.skatt, 0)
  const aarNetto = maaneder.reduce((s, m) => s + m.netto, 0)

  return {
    maanedsbrutto,
    bruttoAarslonn,
    skattInfo,
    feriepenger,
    fpProsent,
    brukerTabell,
    trekkMnd,
    feriepengegrunnlag: grunnlagVist,
    juni,
    desember,
    maaneder,
    pensjonMnd,
    aar: { brutto: aarBrutto, pensjon: aarPensjon, skatt: aarSkatt, netto: aarNetto },
    ordinaerNetto: maanedsbrutto - pensjonMnd - ordinaerSkatt,
    ordinaerSkatt,
  }
}

// Hjelpeberegner for Oslo kontaktlærertillegg.
export function osloKontaktlarer(data, antallElever) {
  const k = data.oslo.kontaktlaerer
  return k.grunnbelop + antallElever * k.per_elev
}

// ---------------------------------------------------------------------------
// Vikar / timelønn
// ---------------------------------------------------------------------------

// Timelønn for én undervisningstime på 60 minutter (årsramme i 60-minuttersenheter).
// Oslo (del C pkt. 3.1.8.2): t1 = årslønn × 1500 / (årsramme × 1687,5), t2 = 80 % av t1.
// KS (HTA § 12.4): årslønn × 1400 × 100 / (årsramme × 1687,5 × 112). Feriepenger kommer i tillegg.
export function vikarSatsUndervisning(data, tariff, aarslonn, aarsramme60, tilfeldig = false) {
  const v = data.vikar
  if (!aarsramme60) return 0
  if (tariff === 'oslo') {
    const t1 = (aarslonn * v.oslo.undervisning_faktor) / (aarsramme60 * v.aarsverk)
    return tilfeldig ? t1 * (v.oslo.tilfeldig_prosent / 100) : t1
  }
  return (aarslonn * v.ks.undervisning_faktor * 100) / (aarsramme60 * v.aarsverk * v.ks.feriepenge_deler)
}

// Timelønn for arbeid utenom undervisning (klokketime): årslønn / 1850.
export function vikarSatsAnnet(data, aarslonn) {
  return aarslonn / data.vikar.annet_arbeid_deler
}

// Beregner lønn for en liste økter. Hver økt: { type: 'undervisning' | 'annet',
// minutter, antall, aarsramme60 }. Satsen skaleres lineært med øktlengden.
export function beregnVikar({ data, tariff, aarslonn, okter, tilfeldig, skatteprosent, alder }) {
  const rader = okter.map((o) => {
    const minutter = Number(o.minutter) || 0
    const antall = Number(o.antall) || 0
    const timesats =
      o.type === 'annet'
        ? vikarSatsAnnet(data, aarslonn)
        : vikarSatsUndervisning(data, tariff, aarslonn, Number(o.aarsramme60), tilfeldig)
    const perOkt = timesats * (minutter / 60)
    return { ...o, timesats, perOkt, timer: (minutter * antall) / 60, sum: perOkt * antall }
  })
  const brutto = rader.reduce((s, r) => s + r.sum, 0)
  const timer = rader.reduce((s, r) => s + r.timer, 0)
  const skatt = brutto * ((Number(skatteprosent) || 0) / 100)
  const fpProsent = feriepengeProsent(data.felles, Number(alder) || 40)
  return {
    rader,
    timer,
    brutto,
    skatt,
    netto: brutto - skatt,
    fpProsent,
    feriepenger: brutto * (fpProsent / 100),
  }
}
