import { InfoBoks } from './InfoBoks.jsx'

const METODER = [
  {
    id: 'tabell',
    navn: 'Tabelltrekk',
    beskrivelse: 'Standard for fastansatte. Skatten fordeles på 10,5 mnd – ingen trekk i juni, halvt i desember.',
  },
  {
    id: 'prosent',
    navn: 'Prosenttrekk',
    beskrivelse: 'Fast prosent fra skattekortet. Trekkes likt alle måneder, også juni og desember.',
  },
  {
    id: 'manuell',
    navn: 'Oppgi netto selv',
    beskrivelse: 'Du oppgir faktisk netto per måned fra lønnsslippen.',
  },
]

export default function Skattevalg({ valg, set }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {METODER.map((m) => {
          const aktiv = valg.metode === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => set({ metode: m.id })}
              className={`rounded-2xl border p-4 text-left transition ${
                aktiv
                  ? 'border-brand-500 bg-brand-50/80 ring-2 ring-brand-200'
                  : 'border-slate-200 bg-white/70 hover:border-brand-300'
              }`}
            >
              <span className="font-semibold text-slate-800">{m.navn}</span>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{m.beskrivelse}</p>
            </button>
          )
        })}
      </div>

      {valg.metode === 'tabell' && (
        <InfoBoks tone="blue">
          Skatten estimeres ut fra 2026-satser (trygdeavgift 7,7 %, 22 % alminnelig inntekt,
          trinnskatt og minstefradrag). Dette er et estimat – din faktiske tabell kan avvike noe.
        </InfoBoks>
      )}

      {valg.metode === 'prosent' && (
        <div className="max-w-xs">
          <label className="label">Trekkprosent fra skattekortet</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="60"
              className="field pr-9"
              value={valg.prosent}
              onChange={(e) => set({ prosent: e.target.value })}
            />
            <span className="absolute right-4 top-2.5 text-slate-400">%</span>
          </div>
        </div>
      )}

      {valg.metode === 'manuell' && (
        <div className="max-w-xs">
          <label className="label">Faktisk netto per måned</label>
          <input
            type="number"
            className="field"
            value={valg.nettoManuell}
            onChange={(e) => set({ nettoManuell: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
