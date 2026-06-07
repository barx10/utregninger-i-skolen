import { kr2 } from '../utils/beregninger.js'

const farger = {
  ordinaer: 'bg-brand-500',
  juni: 'bg-emerald-500',
  desember: 'bg-amber-500',
}

export default function Arsoversikt({ r }) {
  const maxNetto = Math.max(...r.maaneder.map((m) => m.netto))

  return (
    <div className="space-y-8">
      {/* Stolpegraf */}
      <div>
        <p className="mb-4 text-sm font-semibold text-slate-700">Netto per måned</p>
        <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: 200 }}>
          {r.maaneder.map((m) => (
            <div key={m.navn} className="group flex flex-1 flex-col items-center justify-end">
              <div className="relative w-full">
                <div
                  className={`mx-auto w-full rounded-t-lg transition-all duration-500 ${farger[m.type]} group-hover:opacity-80`}
                  style={{ height: Math.max(4, (m.netto / maxNetto) * 170) }}
                />
                <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-xs font-medium text-white group-hover:block">
                  {kr2(m.netto)}
                </div>
              </div>
              <span className="mt-2 text-[10px] font-medium text-slate-500 sm:text-xs">
                {m.kort}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <Legend farge="bg-brand-500" tekst="Ordinær måned" />
          <Legend farge="bg-emerald-500" tekst="Juni (feriepenger)" />
          <Legend farge="bg-amber-500" tekst="Desember (halv skatt)" />
        </div>
      </div>

      {/* Tabell */}
      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-4 font-semibold">Måned</th>
              <th className="py-2 pr-4 text-right font-semibold">Brutto</th>
              <th className="py-2 pr-4 text-right font-semibold">Skatt</th>
              <th className="py-2 pr-4 text-right font-semibold">Netto</th>
              <th className="py-2 font-semibold">Merknad</th>
            </tr>
          </thead>
          <tbody>
            {r.maaneder.map((m) => (
              <tr
                key={m.navn}
                className={`border-b border-slate-100 ${
                  m.type !== 'ordinaer' ? 'font-medium' : ''
                }`}
              >
                <td className="py-2.5 pr-4 text-slate-700">{m.navn}</td>
                <td className="py-2.5 pr-4 text-right text-slate-600">{kr2(m.brutto)}</td>
                <td className="py-2.5 pr-4 text-right text-slate-600">{kr2(m.skatt)}</td>
                <td className="py-2.5 pr-4 text-right font-semibold text-slate-800">
                  {kr2(m.netto)}
                </td>
                <td className="py-2.5 text-xs text-slate-500">{m.merknad}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 font-bold text-slate-800">
              <td className="py-3 pr-4">Sum år</td>
              <td className="py-3 pr-4 text-right">{kr2(r.aar.brutto)}</td>
              <td className="py-3 pr-4 text-right">{kr2(r.aar.skatt)}</td>
              <td className="py-3 pr-4 text-right text-brand-700">{kr2(r.aar.netto)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function Legend({ farge, tekst }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${farge}`} />
      {tekst}
    </span>
  )
}
