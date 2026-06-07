import {
  ANSIENNITET_TRINN,
  kr2,
  osloBruttoFraStige,
  osloBruttoFraLtr,
} from '../utils/beregninger.js'
import { InfoBoks, InfoKnapp } from './InfoBoks.jsx'

function Ansiennitet({ value, onChange }) {
  return (
    <div>
      <span className="label flex items-center gap-1.5">
        Ansiennitet
        <InfoKnapp tittel="Ansiennitet">
          Nyansatte etter 27.09.2022 (KS): all arbeidserfaring teller. Tidligere ansatte
          følger gammel beregning. Tilkallingsvikariater teller ikke.
        </InfoKnapp>
      </span>
      <div className="grid grid-cols-5 gap-2">
        {ANSIENNITET_TRINN.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onChange(a)}
            className={`rounded-xl border py-2 text-sm font-semibold transition ${
              value === a
                ? 'border-brand-500 bg-brand-500 text-white shadow-soft'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
            }`}
          >
            {a} år
          </button>
        ))}
      </div>
    </div>
  )
}

export default function LonnInput({ data, tariff, valg, set, aar = 2026 }) {
  if (tariff === 'oslo') {
    const kode = data.oslo.stillingskoder[valg.osloKode]
    const erLeder = !!kode?.leder
    const harStige = !!kode?.har_stige

    if (erLeder || !harStige) {
      // Ledere / koder uten stige: oppgi lønnstrinn direkte fra lønnsslippen.
      return (
        <div className="space-y-4">
          <InfoBoks tone="blue">
            {erLeder
              ? 'Skoleledere har flat lønnsramme. Oppgi lønnstrinnet ditt direkte fra lønnsslippen.'
              : 'Denne stillingskoden har ikke ansiennitetsstige. Oppgi lønnstrinnet ditt direkte.'}
          </InfoBoks>
          <div className="max-w-xs">
            <label className="label">Lønnstrinn (1–80)</label>
            <input
              type="number"
              min="1"
              max="80"
              className="field"
              value={valg.ltrDirekte}
              onChange={(e) => set({ ltrDirekte: e.target.value })}
            />
          </div>
        </div>
      )
    }

    // Undervisningspersonale med stige.
    // Lokalt avvik: brukeren kan overstyre lønnsramme og/eller lønnstrinn.
    const overstyr = !!valg.osloOverstyr
    const effektivLr = overstyr && valg.osloOverstyrLr ? valg.osloOverstyrLr : kode.lr
    const direkteBrutto =
      overstyr && valg.osloOverstyrBrutto !== '' && valg.osloOverstyrBrutto != null
    const direkteLtr =
      !direkteBrutto && overstyr && valg.osloOverstyrLtr !== '' && valg.osloOverstyrLtr != null
    const laast = direkteBrutto || direkteLtr // ramme/alt/ansiennitet ignoreres
    const oppslag = direkteBrutto
      ? { ltr: null, aarslonn: Number(valg.osloOverstyrBrutto) || 0 }
      : direkteLtr
        ? osloBruttoFraLtr(data, valg.osloOverstyrLtr, aar)
        : osloBruttoFraStige(data, effektivLr, valg.alt, valg.ansiennitet, aar)

    // Lønnsrammer for undervisningspersonale (ikke ledere 901–906).
    const undervisningsLr = Object.keys(data.oslo.lonnrammer)
      .filter((k) => Number(k) >= 908)
      .sort((a, b) => Number(a) - Number(b))

    return (
      <div className="space-y-4">
        {!laast && (
          <Ansiennitet value={valg.ansiennitet} onChange={(a) => set({ ansiennitet: a })} />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="label flex items-center gap-1.5">
              Lønnsramme
              <InfoKnapp>
                {overstyr
                  ? 'Velg lønnsramme manuelt hvis du har et lokalt avvik fra stillingskoden.'
                  : 'Forhåndsvalgt fra stillingskoden din.'}
              </InfoKnapp>
            </span>
            {overstyr ? (
              <select
                className="field"
                value={effektivLr}
                disabled={laast}
                onChange={(e) => set({ osloOverstyrLr: e.target.value })}
              >
                {undervisningsLr.map((lr) => (
                  <option key={lr} value={lr}>
                    LR {lr}
                  </option>
                ))}
              </select>
            ) : (
              <div className="field flex items-center bg-slate-50 font-semibold text-slate-700">
                LR {kode.lr}
              </div>
            )}
          </div>
          <div>
            <span className="label flex items-center gap-1.5">
              Alternativ (1–25)
              <InfoKnapp tittel="Alternativ">
                Lønnsalternativet ditt finner du på lønnsslippen eller hos tillitsvalgt.
                Standard er 1.
              </InfoKnapp>
            </span>
            <input
              type="number"
              min="1"
              max="25"
              className="field"
              value={valg.alt}
              disabled={laast}
              onChange={(e) => set({ alt: e.target.value })}
            />
          </div>
        </div>

        {/* Lokalt avvik */}
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-4">
          <label className="flex items-start gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600"
              checked={overstyr}
              onChange={(e) =>
                set({
                  osloOverstyr: e.target.checked,
                  osloOverstyrLr: valg.osloOverstyrLr || String(kode.lr),
                })
              }
            />
            <span className="flex items-center gap-1.5">
              Lokalt avvik – overstyr lønnsramme/lønnstrinn/brutto
              <InfoKnapp tittel="Lokalt avvik">
                Noen har lokalt forhandlet en annen lønnsramme eller et høyere lønnstrinn enn
                stillingskoden tilsier. Velg riktig lønnsramme over, oppgi lønnstrinnet direkte,
                eller skriv inn brutto årslønn nøyaktig fra lønnsslippen (nyttig for deltid eller
                måneder før et lønnsoppgjør er lagt inn).
              </InfoKnapp>
            </span>
          </label>
          {overstyr && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Eller oppgi lønnstrinn direkte (1–80)</label>
                <input
                  type="number"
                  min="1"
                  max="80"
                  placeholder="La stå tomt for å bruke rammen"
                  className="field"
                  value={valg.osloOverstyrLtr}
                  disabled={direkteBrutto}
                  onChange={(e) => set({ osloOverstyrLtr: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Eller brutto årslønn direkte (kr)</label>
                <input
                  type="number"
                  placeholder="F.eks. 781900"
                  className="field"
                  value={valg.osloOverstyrBrutto}
                  onChange={(e) => set({ osloOverstyrBrutto: e.target.value })}
                />
              </div>
              {laast && (
                <p className="text-xs text-slate-500 sm:col-span-2">
                  {direkteBrutto
                    ? 'Brutto årslønn oppgitt direkte – lønnsramme, alternativ og ansiennitet ignoreres.'
                    : 'Lønnstrinn oppgitt direkte – alternativ og ansiennitet ignoreres.'}
                </p>
              )}
            </div>
          )}
        </div>

        {oppslag && oppslag.aarslonn ? (
          <InfoBoks
            tone="green"
            tittel={oppslag.ltr != null ? `Lønnstrinn ${oppslag.ltr}` : 'Manuell brutto årslønn'}
          >
            Brutto årslønn{oppslag.ltr != null ? ` (${aar})` : ''}:{' '}
            <strong>{kr2(oppslag.aarslonn)}</strong>
          </InfoBoks>
        ) : (
          <InfoBoks tone="amber">
            Fant ikke{' '}
            {direkteLtr
              ? `lønnstrinn ${valg.osloOverstyrLtr}`
              : `kombinasjonen LR ${effektivLr} / alt ${valg.alt} / ${valg.ansiennitet} år`}
            . Sjekk verdiene.
          </InfoBoks>
        )}
      </div>
    )
  }

  // ---- KS ----
  const ksKode = data.ks.stillingskoder[valg.ksKode]
  const erSkoleleder = ksKode?.kap === 3

  if (erSkoleleder) {
    return (
      <div className="space-y-4">
        <InfoBoks tone="blue" tittel="Skoleleder – kapittel 3">
          {ksKode.merknad} Oppgi din faktiske bruttoårslønn.
        </InfoBoks>
        <div className="max-w-xs">
          <label className="label">Brutto årslønn</label>
          <input
            type="number"
            className="field"
            value={valg.ksBrutto}
            onChange={(e) => set({ ksBrutto: e.target.value })}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Ansiennitet value={valg.ansiennitet} onChange={(a) => set({ ansiennitet: a })} />
      <InfoBoks tone="amber" tittel="Garantilønn = minstelønn">
        Tabellen viser garantilønn etter ansiennitet. Mange lærere tjener over dette pga.
        lokale tillegg – huk av for å overstyre med din faktiske bruttolønn.
      </InfoBoks>
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-brand-600"
          checked={valg.ksOverstyr}
          onChange={(e) => set({ ksOverstyr: e.target.checked })}
        />
        Jeg vil oppgi faktisk bruttolønn selv
      </label>
      {valg.ksOverstyr && (
        <div className="max-w-xs">
          <label className="label">Faktisk brutto årslønn</label>
          <input
            type="number"
            className="field"
            value={valg.ksBrutto}
            onChange={(e) => set({ ksBrutto: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
