import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
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

test('KS: Lærer 16 år garantilønn', () => {
  assert.equal(ksGarantilonn(data, 'Lærer', 16), 665400)
})

test('Trinnskatt 2026 er progressiv og 0 under første grense', () => {
  assert.equal(beregnTrinnskatt(200000, felles.trinnskatt_2026), 0)
  // 500 000: trinn 1 (217 400→306 050) 1,7% + trinn 2 (306 050→500 000) 4,0%
  const forventet =
    (306050 - 217400) * 0.017 + (500000 - 306050) * 0.04
  assert.ok(Math.abs(beregnTrinnskatt(500000, felles.trinnskatt_2026) - forventet) < 0.5)
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
