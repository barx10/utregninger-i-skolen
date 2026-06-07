import { ANSIENNITET_TRINN, kr2, osloBruttoFraStige } from '../utils/beregninger.js'
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

export default function LonnInput({ data, tariff, valg, set }) {
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
    const oppslag = osloBruttoFraStige(data, kode.lr, valg.alt, valg.ansiennitet)
    return (
      <div className="space-y-4">
        <Ansiennitet
          value={valg.ansiennitet}
          onChange={(a) => set({ ansiennitet: a })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="label flex items-center gap-1.5">
              Lønnsramme
              <InfoKnapp>Forhåndsvalgt fra stillingskoden din.</InfoKnapp>
            </span>
            <div className="field flex items-center bg-slate-50 font-semibold text-slate-700">
              LR {kode.lr}
            </div>
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
              onChange={(e) => set({ alt: e.target.value })}
            />
          </div>
        </div>
        {oppslag ? (
          <InfoBoks tone="green" tittel={`Lønnstrinn ${oppslag.ltr}`}>
            Brutto årslønn: <strong>{kr2(oppslag.aarslonn)}</strong>
          </InfoBoks>
        ) : (
          <InfoBoks tone="amber">
            Fant ikke kombinasjonen LR {kode.lr} / alt {valg.alt} / {valg.ansiennitet} år. Sjekk
            alternativet.
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
