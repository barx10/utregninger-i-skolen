import { useEffect, useMemo, useState } from 'react'
import data from './data/tariff2026.json'
import logo from './assets/laererliv-logo.png'

import {
  beregnAlt,
  osloBruttoFraStige,
  osloBruttoFraLtr,
  ksGarantilonn,
  tabellTrekkMaaned,
  kr2,
} from './utils/beregninger.js'

import Seksjon from './components/Seksjon.jsx'
import TariffValg from './components/TariffValg.jsx'
import StillingsValg from './components/StillingsValg.jsx'
import LonnInput from './components/LonnInput.jsx'
import Tillegg from './components/Tillegg.jsx'
import Skattevalg from './components/Skattevalg.jsx'
import Resultater from './components/Resultater.jsx'
import Arsoversikt from './components/Arsoversikt.jsx'
import { InfoBoks, InfoKnapp } from './components/InfoBoks.jsx'

export default function App() {
  const [tariff, setTariff] = useState('oslo')
  const [aar, setAar] = useState(2026)
  const [tilleggListe, setTilleggListe] = useState([])
  const [skattetabell, setSkattetabell] = useState({}) // { 2025: data, 2026: data }

  const [valg, setValg] = useState({
    osloKode: '965', // Lektor
    ksKode: 'Adjunkt',
    ansiennitet: '16',
    alt: 1,
    ltrDirekte: 50,
    osloOverstyr: false, // lokalt avvik: overstyr LR/ltr/brutto
    osloOverstyrLr: '',
    osloOverstyrLtr: '',
    osloOverstyrBrutto: '',
    ksOverstyr: false,
    ksBrutto: 650000,
    metode: 'tabell',
    tabellnr: '', // skattekort-tabellnummer for nøyaktig tabelltrekk
    prosent: 35,
    nettoManuell: 38000,
    alder: 40,
    forsteYrkesar: false,
    fpModus: 'belop', // 'belop' = oppgi beløp fra desemberslipp | 'grunnlag' = beregn fra fjorårslønn
    feriepengegrunnlag: '', // tom → estimat basert på årets lønn
    feriepengerBelop: '', // «Opptjente feriepenger i år» fra desemberslippen
  })

  const set = (patch) => setValg((v) => ({ ...v, ...patch }))

  // --- Beregn grunnlønn (uten tillegg) ---
  const baseLonn = useMemo(() => {
    if (tariff === 'oslo') {
      const kode = data.oslo.stillingskoder[valg.osloKode]
      if (!kode) return 0
      if (kode.leder || !kode.har_stige) {
        return osloBruttoFraLtr(data, valg.ltrDirekte, aar)?.aarslonn ?? 0
      }
      // Lokalt avvik: brutto direkte > lønnstrinn direkte > annen lønnsramme.
      if (valg.osloOverstyr && valg.osloOverstyrBrutto !== '') {
        return Number(valg.osloOverstyrBrutto) || 0
      }
      if (valg.osloOverstyr && valg.osloOverstyrLtr !== '') {
        return osloBruttoFraLtr(data, valg.osloOverstyrLtr, aar)?.aarslonn ?? 0
      }
      const lr = valg.osloOverstyr && valg.osloOverstyrLr ? valg.osloOverstyrLr : kode.lr
      return osloBruttoFraStige(data, lr, valg.alt, valg.ansiennitet, aar)?.aarslonn ?? 0
    }
    // KS
    const kode = data.ks.stillingskoder[valg.ksKode]
    if (!kode) return 0
    if (kode.kap === 3) return Number(valg.ksBrutto) || 0
    if (valg.ksOverstyr) return Number(valg.ksBrutto) || 0
    return ksGarantilonn(data, valg.ksKode, valg.ansiennitet) ?? 0
  }, [tariff, valg, aar])

  const sumTillegg = tilleggListe.reduce((s, t) => s + t.belop, 0)
  const bruttoAarslonn = baseLonn + sumTillegg

  // Last Skatteetatens månedstabell for valgt år når brukeren oppgir tabellnummer.
  useEffect(() => {
    if (valg.metode !== 'tabell' || !valg.tabellnr) return
    if (skattetabell[aar]) return
    let avbrutt = false
    fetch(`${import.meta.env.BASE_URL}skattetabeller/${aar}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!avbrutt && d) setSkattetabell((s) => ({ ...s, [aar]: d }))
      })
      .catch(() => {})
    return () => {
      avbrutt = true
    }
  }, [valg.metode, valg.tabellnr, aar, skattetabell])

  const tabellTrekkMnd =
    valg.metode === 'tabell' && valg.tabellnr && skattetabell[aar]
      ? tabellTrekkMaaned(skattetabell[aar], valg.tabellnr, bruttoAarslonn / 12)
      : null

  const resultat = useMemo(() => {
    if (!bruttoAarslonn) return null
    return beregnAlt({
      data,
      bruttoAarslonn,
      metode: valg.metode,
      prosent: Number(valg.prosent) || 0,
      nettoManuell: Number(valg.nettoManuell) || 0,
      alder: Number(valg.alder) || 40,
      forsteYrkesar: valg.forsteYrkesar,
      feriepengegrunnlag:
        valg.fpModus === 'grunnlag' && valg.feriepengegrunnlag !== ''
          ? Number(valg.feriepengegrunnlag)
          : null,
      feriepengerDirekte:
        valg.fpModus === 'belop' && valg.feriepengerBelop !== ''
          ? Number(valg.feriepengerBelop)
          : null,
      tabellTrekkMnd,
      pensjonProsent: 2.0,
    })
  }, [bruttoAarslonn, valg, tabellTrekkMnd])

  const fpErEstimat =
    (valg.fpModus === 'grunnlag' && valg.feriepengegrunnlag === '') ||
    (valg.fpModus === 'belop' && valg.feriepengerBelop === '')

  return (
    <div className="app-bg min-h-screen">
      {/* Header */}
      <header className="border-b border-white/40 bg-white/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Lærerliv" className="h-10 w-10 rounded-xl object-contain" />
            <div>
              <p className="text-sm font-bold text-slate-800">Lærerøkonomi</p>
              <p className="text-xs text-slate-500">Lønnskalkulator for skolen</p>
            </div>
          </div>
          <a
            href="https://laererliv.no"
            className="hidden rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 sm:block"
          >
            laererliv.no
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="mx-auto max-w-5xl px-5 pt-10 text-center">
        <h1 className="bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
          Hva sitter du igjen med?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Beregn lønn, skatt, feriepenger og juniutbetaling for lærere og skoleledere – Oslo og
          KS. Alt regnes lokalt i nettleseren din.
        </p>
      </div>

      {/* Innhold */}
      <main className="mx-auto max-w-5xl space-y-6 px-5 py-10">
        <Seksjon nr="1" tittel="Tariff og stilling" undertittel="Velg tariffområde og din stillingskode">
          <div className="space-y-6">
            <TariffValg value={tariff} onChange={setTariff} />
            {tariff === 'oslo' && (
              <div>
                <span className="label flex items-center gap-1.5">
                  Lønnsår
                  <InfoKnapp tittel="Lønnsår">
                    Velg 2025 for å sammenligne mot eldre lønnsslipper, eller 2026 for gjeldende
                    satser. Skatteestimatet bruker 2026-satser uansett – bytt skattemetode til
                    prosent/manuell for eldre år.
                  </InfoKnapp>
                </span>
                <div className="inline-flex rounded-xl border border-slate-200 bg-white/70 p-1">
                  {[2025, 2026].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setAar(y)}
                      className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                        aar === y
                          ? 'bg-brand-600 text-white shadow-soft'
                          : 'text-slate-600 hover:text-brand-700'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <StillingsValg data={data} tariff={tariff} valg={valg} set={set} />
            <LonnInput data={data} tariff={tariff} valg={valg} set={set} aar={aar} />
          </div>
        </Seksjon>

        <Seksjon nr="2" tittel="Lønn og tillegg" undertittel="Faste tillegg legges til bruttolønnen">
          <Tillegg data={data} tariff={tariff} tilleggListe={tilleggListe} set={setTilleggListe} />
          {sumTillegg > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
              <span>Sum tillegg per år</span>
              <span>{kr2(sumTillegg)}</span>
            </div>
          )}
        </Seksjon>

        <Seksjon nr="3" tittel="Skatt" undertittel="Velg hvordan skatten din trekkes">
          <Skattevalg valg={valg} set={set} />
        </Seksjon>

        <Seksjon nr="4" tittel="Personlige forhold" undertittel="Påvirker feriepenger og juniutbetaling">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label">Alder</label>
              <input
                type="number"
                min="18"
                max="75"
                className="field max-w-[160px]"
                value={valg.alder}
                onChange={(e) => set({ alder: e.target.value })}
              />
              {Number(valg.alder) >= 60 && (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  60+: feriepenger beregnes med 14,3 %.
                </p>
              )}
            </div>
            <div className="space-y-3">
              <label className="flex items-start gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600"
                  checked={valg.forsteYrkesar}
                  onChange={(e) => set({ forsteYrkesar: e.target.checked })}
                />
                <span className="flex items-center gap-1.5">
                  Første yrkesår
                  <InfoKnapp tittel="Første yrkesår">
                    Første gangs tiltredelse i skoleverket etter fullført lærerutdanning, ansatt
                    minst 1 år. Sikrer full lønn i juni selv ved lavt feriepengegrunnlag.
                  </InfoKnapp>
                </span>
              </label>
              <div>
                <span className="label flex items-center gap-1.5">
                  Feriepenger
                  <InfoKnapp tittel="Feriepenger">
                    Feriepenger du får utbetalt neste juni er opptjent i år. Det <strong>nøyaktige
                    beløpet</strong> står på desember-lønnsslippen som «Opptjente feriepenger i år».
                    Alternativt regner appen 12 % (14,3 % fra 60 år) av fjorårets utbetalte lønn.
                  </InfoKnapp>
                </span>
                <div className="mb-3 inline-flex rounded-xl border border-slate-200 bg-white/70 p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => set({ fpModus: 'belop' })}
                    className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                      valg.fpModus === 'belop'
                        ? 'bg-brand-600 text-white shadow-soft'
                        : 'text-slate-600 hover:text-brand-700'
                    }`}
                  >
                    Beløp fra desemberslipp
                  </button>
                  <button
                    type="button"
                    onClick={() => set({ fpModus: 'grunnlag' })}
                    className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                      valg.fpModus === 'grunnlag'
                        ? 'bg-brand-600 text-white shadow-soft'
                        : 'text-slate-600 hover:text-brand-700'
                    }`}
                  >
                    Beregn fra fjorårslønn
                  </button>
                </div>
                {valg.fpModus === 'belop' ? (
                  <div>
                    <label className="label">Opptjente feriepenger i år (fra desemberslipp)</label>
                    <input
                      type="number"
                      className="field max-w-[220px]"
                      placeholder="F.eks. 88126"
                      value={valg.feriepengerBelop}
                      onChange={(e) => set({ feriepengerBelop: e.target.value })}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Mest nøyaktig: dette er beløpet du faktisk får neste juni. Står på
                      desember-lønnsslippen under «Opptjente feriepenger i år».
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="label">Feriepengegrunnlag (lønn utbetalt i fjor)</label>
                    <input
                      type="number"
                      className="field max-w-[220px]"
                      placeholder={`Estimat: ${Math.round(bruttoAarslonn)}`}
                      value={valg.feriepengegrunnlag}
                      onChange={(e) => set({ feriepengegrunnlag: e.target.value })}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      {fpErEstimat
                        ? 'La stå tomt for et grovt estimat basert på årets lønn. For nøyaktig tall: fyll inn fjorårets utbetalte lønn (Lønn honorar m.m. minus feriepenger utbetalt).'
                        : 'Appen regner 12 % / 14,3 % av dette grunnlaget.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Seksjon>

        <Seksjon nr="5" tittel="Resultater" undertittel="Estimert lønn, skatt og feriepenger">
          {resultat ? (
            <Resultater r={resultat} fpErEstimat={fpErEstimat} />
          ) : (
            <InfoBoks tone="amber">
              Velg stilling og lønn over for å se beregningen.
            </InfoBoks>
          )}
        </Seksjon>

        {resultat && (
          <Seksjon nr="6" tittel="Årsoversikt" undertittel="Måned for måned gjennom hele året">
            <Arsoversikt r={resultat} />
          </Seksjon>
        )}

        <footer className="pb-6 pt-4 text-center text-xs leading-relaxed text-slate-400">
          <p>
            Estimat basert på tariff 2024–2026 (Oslo kommune / KS) og skattesatser for 2026.
            Faktiske beløp kan avvike. Dobbeltsjekk mot lønnsslipp og skattekort.
          </p>
          <p className="mt-1">Datakilde: Utdanningsforbundet, Oslo kommune, KS · Laget for laererliv.no</p>
        </footer>
      </main>
    </div>
  )
}
