const VALG = [
  {
    id: 'oslo',
    navn: 'Oslo kommune',
    beskrivelse: 'Eget tariffområde med lønnsrammer og lønnstrinn',
  },
  {
    id: 'ks',
    navn: 'KS (resten av landet)',
    beskrivelse: 'Garantilønn etter ansiennitet – mange tjener mer',
  },
]

export default function TariffValg({ value, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {VALG.map((v) => {
        const aktiv = value === v.id
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            className={`rounded-2xl border p-5 text-left transition ${
              aktiv
                ? 'border-brand-500 bg-brand-50/80 shadow-soft ring-2 ring-brand-200'
                : 'border-slate-200 bg-white/70 hover:border-brand-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">{v.navn}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  aktiv ? 'border-brand-500 bg-brand-500' : 'border-slate-300'
                }`}
              >
                {aktiv && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{v.beskrivelse}</p>
          </button>
        )
      })}
    </div>
  )
}
