import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  tabellTrekkMaaned,
  beregnTrinnskatt,
  beregnArsskatt,
  beregnFeriepenger,
  osloBruttoFraStige,
  osloBruttoFraLtr,
  ksGarantilonn,
  beregnJuni,
  beregnDesember,
  beregnAlt,
} from './beregninger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(__dirname, '../data/tariff2026.json'), 'utf8'))
const felles = data.felles

test('Oslo: LR 931 alt 02 ansiennitet 16 → ltr 50 → 843 927', () => {
  const r = osloBruttoFraStige(data, 931, 2, 16)
  assert.equal(r.ltr, 50)
  assert.equal(r.aarslonn, 843927)
})

test('Oslo: direkte lønnstrinn 50', () => {
  assert.equal(osloBruttoFraLtr(data, 50).aarslonn, 843927)
})

test('Oslo lønnsår: 2025 vs 2026 for ltr 50 (verifisert mot desemberslipp)', () => {
  // Desemberslipp 2025: månedslønn 67 525 = 810 300/år (2025-tabell ltr 50)
  assert.equal(osloBruttoFraLtr(data, 50, 2025).aarslonn, 810300)
  assert.equal(osloBruttoFraStige(data, 931, 2, 16, 2025).aarslonn, 810300)
  assert.equal(Math.round(810300 / 12), 67525)
  // 2026-satsen er høyere
  assert.equal(osloBruttoFraLtr(data, 50, 2026).aarslonn, 843927)
  // Ugyldig år faller tilbake til 2026
  assert.equal(osloBruttoFraLtr(data, 50, 2099).aarslonn, 843927)
})

test('Lokalt avvik: overstyr lønnsramme og direkte lønnstrinn', () => {
  // Annen lønnsramme enn stillingskoden (lokalt forhandlet)
  assert.equal(osloBruttoFraStige(data, 928, 2, 16, 2026).ltr,
    data.oslo.lonnrammer['928']['2']['16'])
  // Direkte lønnstrinn vinner over rammen
  assert.equal(osloBruttoFraLtr(data, 55, 2026).aarslonn, data.oslo.lonnstabell_2026['55'])
  assert.equal(osloBruttoFraLtr(data, 55, 2025).aarslonn, data.oslo.lonnstabell_2025['55'])
})

test('KS: Lærer 16 år garantilønn (1.5.2026)', () => {
  assert.equal(ksGarantilonn(data, 'Lærer', 16), 639900)
})

test('Trinnskatt 2026 er progressiv og 0 under første grense', () => {
  assert.equal(beregnTrinnskatt(200000, felles.trinnskatt_2026), 0)
  // 500 000: trinn 1 (226 100→318 300) 1,7% + trinn 2 (318 300→500 000) 4,0%
  const forventet =
    (318300 - 226100) * 0.017 + (500000 - 318300) * 0.04
  assert.ok(Math.abs(beregnTrinnskatt(500000, felles.trinnskatt_2026) - forventet) < 0.5)
  // Trinn 5 (17,8 % over 1 467 200) skal være med
  const hoy = beregnTrinnskatt(1500000, felles.trinnskatt_2026)
  const forventetHoy =
    (318300 - 226100) * 0.017 +
    (725050 - 318300) * 0.04 +
    (980100 - 725050) * 0.137 +
    (1467200 - 980100) * 0.168 +
    (1500000 - 1467200) * 0.178
  assert.ok(Math.abs(hoy - forventetHoy) < 0.5, `trinn5 ${hoy}`)
})

test('Årsskatt: pensjon reduserer alminnelig inntekt', () => {
  const utenPensjon = beregnArsskatt(700000, felles, 0)
  const medPensjon = beregnArsskatt(700000, felles, 2)
  assert.ok(medPensjon.totalSkattAar < utenPensjon.totalSkattAar)
  // Differansen skal være ~ pensjon * 22 %
  const diff = utenPensjon.totalSkattAar - medPensjon.totalSkattAar
  assert.ok(Math.abs(diff - 700000 * 0.02 * 0.22) < 1)
})

test('Feriepenger: 12 % under 60, 14,3 % fra 60', () => {
  assert.equal(beregnFeriepenger(felles, 600000, 45).feriepenger, 72000)
  assert.ok(Math.abs(beregnFeriepenger(felles, 600000, 61).feriepenger - 600000 * 0.143) < 0.001)
})

test('Juni tabelltrekk: ingen skatt på månedslønn, feriepengetillegg trekkfritt', () => {
  const maanedsbrutto = 50000
  const feriepenger = 80000
  const juni = beregnJuni({
    felles,
    maanedsbrutto,
    feriepenger,
    alder: 40,
    forsteYrkesar: false,
    metode: 'tabell',
    skatteCtx: { trekkPerMaaned: 15000, prosent: 0, nettoManuell: 0 },
  })
  assert.equal(juni.skatt, 0)
  const ferietrekk = (maanedsbrutto * 12 / felles.arbeidsdager_aar) * felles.feriedager
  assert.ok(Math.abs(juni.feriepengetillegg - (feriepenger - ferietrekk)) < 0.01)
  assert.ok(Math.abs(juni.netto - (maanedsbrutto + feriepenger - ferietrekk)) < 0.01)
})

test('Første yrkesår: full lønn i juni selv ved lavt feriepengegrunnlag', () => {
  const juni = beregnJuni({
    felles,
    maanedsbrutto: 50000,
    feriepenger: 10000, // lavt → negativt tillegg
    alder: 30,
    forsteYrkesar: true,
    metode: 'tabell',
    skatteCtx: { trekkPerMaaned: 15000 },
  })
  assert.equal(juni.feriepengetillegg, 0)
  assert.equal(juni.netto, 50000)
  assert.match(juni.merknad, /Første yrkesår/)
})

test('Desember tabelltrekk: halvt trekk', () => {
  const des = beregnDesember({
    maanedsbrutto: 50000,
    metode: 'tabell',
    skatteCtx: { trekkPerMaaned: 15000 },
  })
  assert.equal(des.skatt, 7500)
  assert.equal(des.netto, 42500)
})

test('Regresjon mot faktisk lønnsslipp (Oslo, LR931 alt2 ltr50, kontaktlærer)', () => {
  // Verifisert mot ekte junislipp 2025: ferietrekk og feriepenger til øret.
  const aarslonnFaktisk = 65158.33 * 12 // 781 900
  // Ferietrekk: årslønn / 260 * 25
  const r = beregnAlt({
    data,
    bruttoAarslonn: aarslonnFaktisk,
    metode: 'tabell',
    alder: 50,
    feriepengegrunnlag: 702006, // fjorårets utbetalte lønn (84 240 / 12 %)
    pensjonProsent: 2,
  })
  assert.ok(Math.abs(r.juni.ferietrekk - 75182.69) < 0.5, `ferietrekk ${r.juni.ferietrekk}`)
  assert.ok(Math.abs(r.feriepenger - 84240.72) < 1, `feriepenger ${r.feriepenger}`)
})

test('Feriepenger direkte beløp (fra desemberslipp) overstyrer %-beregning', () => {
  const r = beregnAlt({
    data,
    bruttoAarslonn: 829580,
    metode: 'tabell',
    alder: 50,
    feriepengerDirekte: 88126.54, // «Opptjente feriepenger i år»
  })
  assert.equal(r.feriepenger, 88126.54)
  // Vist grunnlag utledes: beløp / 12 %
  assert.ok(Math.abs(r.feriepengegrunnlag - 88126.54 / 0.12) < 0.01)
})

test('Feriepengegrunnlag faller tilbake til årets lønn når ikke oppgitt', () => {
  const r = beregnAlt({
    data,
    bruttoAarslonn: 800000,
    metode: 'tabell',
    alder: 40,
    feriepengegrunnlag: null,
  })
  assert.equal(r.feriepengegrunnlag, 800000)
  assert.ok(Math.abs(r.feriepenger - 800000 * 0.12) < 0.01)
})

test('Skattetabell-oppslag: tabell 8100 (2025) mot desemberslipp', () => {
  const tab = JSON.parse(
    readFileSync(join(__dirname, '../../public/skattetabeller/2025.json'), 'utf8'),
  )
  // Desemberslipp 2025 (tabell 8100): halvt trekk 10 656 → fullt ~21 312
  const full = tabellTrekkMaaned(tab, '8100', 69131)
  assert.ok(full > 20000 && full < 22000, `fikk ${full}`)
  // Innenfor ett tabelltrinn av slippen (rundingsavvik i grunnlaget)
  assert.ok(Math.abs(full / 2 - 10656) < 200, `halv ${full / 2}`)
  // Ukjent tabell → null, lav inntekt → 0
  assert.equal(tabellTrekkMaaned(tab, '9999', 60000), null)
  assert.equal(tabellTrekkMaaned(tab, '8100', 5000), 0)
})

test('beregnAlt: tabellTrekkMnd overstyrer estimatet og halveres i desember', () => {
  const r = beregnAlt({
    data,
    bruttoAarslonn: 829580,
    metode: 'tabell',
    alder: 50,
    tabellTrekkMnd: 21100,
  })
  assert.equal(r.brukerTabell, true)
  assert.equal(r.ordinaerSkatt, 21100)
  assert.equal(r.desember.skatt, 10550)
  assert.equal(r.juni.skatt, 0)
})

test('beregnAlt: 12 måneder, juni og desember markert', () => {
  const r = beregnAlt({
    data,
    bruttoAarslonn: 843927,
    metode: 'tabell',
    alder: 40,
    pensjonProsent: 2,
  })
  assert.equal(r.maaneder.length, 12)
  assert.equal(r.maaneder[5].type, 'juni')
  assert.equal(r.maaneder[11].type, 'desember')
  assert.ok(r.aar.netto > 0)
  assert.ok(Math.abs(r.maanedsbrutto - 843927 / 12) < 0.01)
})
