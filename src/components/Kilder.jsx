import { KILDER } from '../data/kilder.js'

// Liste over kildene appen bygger på, gruppert etter tema.
export default function Kilder() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Tallene og reglene i appen er hentet fra disse kildene. Tariffavtaler og satser endres ved
        hvert lønnsoppgjør og statsbudsjett, så sjekk alltid mot gjeldende avtale og lønnsslipp.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        {KILDER.map((gruppe) => (
          <div key={gruppe.tema}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {gruppe.tema}
            </h3>
            <ul className="space-y-3">
              {gruppe.lenker.map((k) => (
                <li key={k.url} className="text-sm">
                  <a
                    href={k.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-500"
                  >
                    {k.navn}
                  </a>
                  <p className="text-xs leading-relaxed text-slate-500">{k.brukt}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
