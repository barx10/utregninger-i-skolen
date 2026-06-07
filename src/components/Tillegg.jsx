import { useState } from 'react'
import { kr2, osloKontaktlarer } from '../utils/beregninger.js'
import { InfoBoks, InfoKnapp } from './InfoBoks.jsx'

export default function Tillegg({ data, tariff, tilleggListe, set }) {
  const [navn, setNavn] = useState('')
  const [belop, setBelop] = useState('')
  const [elever, setElever] = useState('')

  const leggTil = (n, b) => {
    if (!n || !b) return
    set([...tilleggListe, { id: crypto.randomUUID(), navn: n, belop: Number(b) }])
    setNavn('')
    setBelop('')
  }

  const fjern = (id) => set(tilleggListe.filter((t) => t.id !== id))

  const kontaktBelop = elever ? osloKontaktlarer(data, Number(elever)) : 0

  return (
    <div className="space-y-5">
      <InfoBoks tone="blue">
        Legg inn faste tillegg i kr per år. Disse inngår i bruttolønnen og i
        feriepengegrunnlaget. Eksempler: kontaktlærer, funksjonstillegg, realfagstillegg,
        lokale tillegg.
      </InfoBoks>

      {/* Hjelpeberegner kontaktlærer */}
      <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          Hjelpeberegner: kontaktlærertillegg
          <InfoKnapp tittel="Kontaktlærer">
            {tariff === 'oslo'
              ? 'Oslo 2026: 5 000 kr grunnbeløp + 900 kr per elev.'
              : 'KS: minstesats i SFS 2213, varierer per kommune (typisk 7 500–21 000 kr). Sjekk med tillitsvalgt.'}
          </InfoKnapp>
        </p>
        {tariff === 'oslo' ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-32">
              <label className="label">Antall elever</label>
              <input
                type="number"
                min="0"
                className="field"
                value={elever}
                onChange={(e) => setElever(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-600">
              = <strong className="text-brand-700">{kr2(kontaktBelop)}</strong> / år
            </div>
            <button
              type="button"
              disabled={!kontaktBelop}
              onClick={() => {
                set([
                  ...tilleggListe,
                  { id: crypto.randomUUID(), navn: `Kontaktlærer (${elever} elever)`, belop: kontaktBelop },
                ])
                setElever('')
              }}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-40"
            >
              Legg til
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            KS-kontaktlærertillegg varierer per kommune. Legg inn beløpet ditt manuelt nedenfor
            (sjekk lønnsslipp eller tillitsvalgt).
          </p>
        )}
      </div>

      {/* Egendefinert tillegg */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <label className="label">Tillegg (navn)</label>
          <input
            className="field"
            placeholder="F.eks. funksjonstillegg"
            value={navn}
            onChange={(e) => setNavn(e.target.value)}
          />
        </div>
        <div className="w-40">
          <label className="label">Beløp (kr/år)</label>
          <input
            type="number"
            className="field"
            value={belop}
            onChange={(e) => setBelop(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => leggTil(navn, belop)}
          className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-900"
        >
          Legg til
        </button>
      </div>

      {/* Liste */}
      {tilleggListe.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white/70">
          {tilleggListe.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-slate-700">{t.navn}</span>
              <span className="flex items-center gap-3">
                <strong className="text-slate-800">{kr2(t.belop)}</strong>
                <button
                  type="button"
                  onClick={() => fjern(t.id)}
                  className="text-slate-400 transition hover:text-red-500"
                  aria-label="Fjern"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
