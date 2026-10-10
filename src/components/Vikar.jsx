import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { beregnVikar, kr2 } from '../utils/beregninger.js'
import Seksjon from './Seksjon.jsx'
import { InfoBoks, InfoKnapp } from './InfoBoks.jsx'

const LENGDER = [30, 45, 60, 90]

let nesteId = 1
const nyOkt = (patch = {}) => ({
  id: nesteId++,
  type: 'undervisning',
  minutter: 45,
  antall: 1,
  aarsrammeId: 'barn',
  ...patch,
})

const kr2des = (n) =>
  isFinite(n)
    ? new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' kr'
    : '–'

function Stat({ label, verdi, tone = 'default', info }) {
  const toner = {
    default: 'bg-white/70 border-slate-200',
    brand: 'bg-brand-600 text-white border-brand-600',
    juni: 'bg-emerald-50 border-emerald-200',
  }
  const labelFarge = tone === 'brand' ? 'text-brand-100' : 'text-slate-500'
  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${toner[tone]}`}>
      <p className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${labelFarge}`}>
        {label}
        {info && <InfoKnapp>{info}</InfoKnapp>}
      </p>
      <p className="mt-1 text-2xl font-bold">{kr2(verdi)}</p>
    </div>
  )
}

function OktRad({ okt, aarsrammer, endre, fjern, kanFjernes }) {
  const egenLengde = !LENGDER.includes(Number(okt.minutter))
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Type arbeid</label>
            <select
              className="field"
              value={okt.type}
              onChange={(e) => endre({ type: e.target.value })}
            >
              <option value="undervisning">Undervisning (vikartimer)</option>
              <option value="annet">Annet arbeid (tilsyn, møter o.l.)</option>
            </select>
          </div>
          {okt.type === 'undervisning' && (
            <div>
              <span className="label flex items-center gap-1.5">
                Trinn og fag
                <InfoKnapp tittel="Årsramme">
                  Timelønnen for undervisning avhenger av årsrammen for faget, altså hvor mange
                  undervisningstimer en heltidslærer har i året. Lavere årsramme gir høyere
                  timesats. Underviser du i flere fag samme time, gjelder laveste årsramme.
                </InfoKnapp>
              </span>
              <select
                className="field"
                value={okt.aarsrammeId}
                onChange={(e) => endre({ aarsrammeId: e.target.value })}
              >
                {aarsrammer.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {kanFjernes && (
          <button
            type="button"
            onClick={fjern}
            className="self-start rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:border-red-300 hover:text-red-600"
          >
            Fjern
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
        <div>
          <label className="label">Øktlengde</label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white/70 p-1 text-sm">
              {LENGDER.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => endre({ minutter: m })}
                  className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                    Number(okt.minutter) === m
                      ? 'bg-brand-600 text-white shadow-soft'
                      : 'text-slate-600 hover:text-brand-700'
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              className={`field max-w-[110px] ${egenLengde ? 'ring-2 ring-brand-200' : ''}`}
              aria-label="Egen øktlengde i minutter"
              value={okt.minutter}
              onChange={(e) => endre({ minutter: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Antall økter</label>
          <input
            type="number"
            min="0"
            className="field max-w-[140px]"
            value={okt.antall}
            onChange={(e) => endre({ antall: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

export default function Vikar({ data, tariff, aarslonn, nrStart }) {
  const aarsrammer = data.vikar.aarsrammer
  const [okter, setOkter] = useState(() => [nyOkt()])
  const [tilfeldig, setTilfeldig] = useState(true)
  const [skatteprosent, setSkatteprosent] = useState(30)
  const [alder, setAlder] = useState(40)

  const endre = (id, patch) => setOkter((l) => l.map((o) => (o.id === id ? { ...o, ...patch } : o)))

  const resultat = useMemo(() => {
    if (!aarslonn) return null
    return beregnVikar({
      data,
      tariff,
      aarslonn,
      okter: okter.map((o) => ({
        ...o,
        aarsramme60: aarsrammer.find((a) => a.id === o.aarsrammeId)?.r60,
      })),
      tilfeldig: tariff === 'oslo' && tilfeldig,
      skatteprosent,
      alder,
    })
  }, [data, tariff, aarslonn, okter, tilfeldig, skatteprosent, alder, aarsrammer])

  const beskriv = (r) => {
    const lengde = `${r.minutter} min`
    if (r.type === 'annet') return `Annet arbeid · ${lengde}`
    const a = aarsrammer.find((x) => x.id === r.aarsrammeId)
    return `${a?.label ?? 'Undervisning'} · ${lengde}`
  }

  return (
    <>
      <Seksjon nr={nrStart} tittel="Økter" undertittel="Legg inn hver type økt du har jobbet">
        <div className="space-y-4">
          {tariff === 'ks' && (
            <InfoBoks tone="blue" tittel="Uten godkjent lærerutdanning?">
              Velg kategorien som ligger nærmest, og kryss av for å oppgi årslønnen selv over. Årslønnen
              står i arbeidsavtalen eller kan fås fra skolen.
            </InfoBoks>
          )}
          {okter.map((o) => (
            <OktRad
              key={o.id}
              okt={o}
              aarsrammer={aarsrammer}
              endre={(patch) => endre(o.id, patch)}
              fjern={() => setOkter((l) => l.filter((x) => x.id !== o.id))}
              kanFjernes={okter.length > 1}
            />
          ))}
          <button
            type="button"
            onClick={() => setOkter((l) => [...l, nyOkt({ aarsrammeId: l[l.length - 1]?.aarsrammeId })])}
            className="rounded-xl border border-dashed border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            + Legg til økttype
          </button>

          {tariff === 'oslo' && (
            <label className="flex items-start gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600"
                checked={tilfeldig}
                onChange={(e) => setTilfeldig(e.target.checked)}
              />
              <span className="flex items-center gap-1.5">
                Tilfeldige vikartimer (inntil tre uker)
                <InfoKnapp tittel="t1 og t2 i Oslo">
                  Oslo betaler tilfeldige vikartimer med inntil tre ukers varighet med 80 % av ordinær
                  timelønn for undervisning (t2). Ved lengre vikariat brukes full sats (t1). Gjelder ikke
                  i KS.
                </InfoKnapp>
              </span>
            </label>
          )}
        </div>
      </Seksjon>

      <Seksjon nr={nrStart + 1} tittel="Skatt og feriepenger" undertittel="Vikarer har ofte prosentkort eller frikort">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <span className="label flex items-center gap-1.5">
              Skattetrekk i prosent
              <InfoKnapp tittel="Skattetrekk">
                Står på skattekortet ditt. Har du frikort, sett 0 %. Er dette en ekstrajobb ved siden av
                en hovedjobb, trekkes vanligvis prosenttrekket på bikortet.
              </InfoKnapp>
            </span>
            <input
              type="number"
              min="0"
              max="100"
              className="field max-w-[160px]"
              value={skatteprosent}
              onChange={(e) => setSkatteprosent(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Alder</label>
            <input
              type="number"
              min="16"
              max="75"
              className="field max-w-[160px]"
              value={alder}
              onChange={(e) => setAlder(e.target.value)}
            />
            {Number(alder) >= 60 && (
              <p className="mt-2 text-xs font-medium text-emerald-700">60+: feriepenger beregnes med 14,3 %.</p>
            )}
          </div>
        </div>
      </Seksjon>

      <Seksjon nr={nrStart + 2} tittel="Resultat" undertittel="Lønn for øktene du har lagt inn">
        {resultat ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Brutto" verdi={resultat.brutto} />
              <Stat label="Skattetrekk" verdi={resultat.skatt} />
              <Stat label="Netto utbetalt" verdi={resultat.netto} tone="brand" />
              <Stat
                label="Feriepenger"
                verdi={resultat.feriepenger}
                tone="juni"
                info={`${resultat.fpProsent} % av bruttolønnen. Timelønnen er uten feriepenger, så de kommer i tillegg. De utbetales normalt i juni året etter, eller på siste lønningsdag hvis arbeidsforholdet avsluttes.`}
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/70">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Økt</th>
                    <th className="px-4 py-3 text-right">Timesats (60 min)</th>
                    <th className="px-4 py-3 text-right">Per økt</th>
                    <th className="px-4 py-3 text-right">Antall</th>
                    <th className="px-4 py-3 text-right">Sum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resultat.rader.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 text-slate-700">{beskriv(r)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{kr2des(r.timesats)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{kr2des(r.perOkt)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{Number(r.antall) || 0}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{kr2(r.sum)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200 font-semibold text-slate-800">
                  <tr>
                    <td className="px-4 py-3" colSpan={3}>
                      Totalt {new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 }).format(resultat.timer)} timer
                    </td>
                    <td />
                    <td className="px-4 py-3 text-right tabular-nums">{kr2(resultat.brutto)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <InfoBoks tone="green" tittel="Ingen trekk for ferie">
              Som timelønnet vikar får du bare betalt for timene du jobber, så du får ikke trekk i lønn
              for ferie slik fast ansatte får i juni. Feriepengene på {resultat.fpProsent} % er det du får
              for ferien. Får du senere fast stilling, regnes feriepengene første sommer av det du tjente
              som vikar året før, mens lønnen trekkes for fem ukers ferie.
            </InfoBoks>

            <InfoBoks tone="blue" tittel="Slik regnes det">
              Årslønn lagt til grunn: {kr2(aarslonn)}.{' '}
              {tariff === 'oslo'
                ? `Undervisning: årslønn × 1500 / (årsramme × 1687,5)${tilfeldig ? ', 80 % for tilfeldige vikartimer' : ''}.`
                : 'Undervisning: årslønn × 1400 × 100 / (årsramme × 1687,5 × 112).'}{' '}
              Annet arbeid: årslønn / 1850 per klokketime. Satsen skaleres etter øktlengden, så en
              økt på 45 minutter gir 45/60 av timesatsen.
            </InfoBoks>
          </motion.div>
        ) : (
          <InfoBoks tone="amber">Velg stilling og lønn over for å se beregningen.</InfoBoks>
        )}
      </Seksjon>
    </>
  )
}
