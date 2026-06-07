import { motion } from 'framer-motion'
import { kr2 } from '../utils/beregninger.js'
import { InfoKnapp } from './InfoBoks.jsx'

function Stat({ label, verdi, tone = 'default', stor = false, info }) {
  const toner = {
    default: 'bg-white/70 border-slate-200',
    brand: 'bg-brand-600 text-white border-brand-600',
    juni: 'bg-emerald-50 border-emerald-200',
    des: 'bg-amber-50 border-amber-200',
  }
  const labelFarge = tone === 'brand' ? 'text-brand-100' : 'text-slate-500'
  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${toner[tone]} ${stor ? 'sm:col-span-2' : ''}`}>
      <p className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${labelFarge}`}>
        {label}
        {info && <InfoKnapp>{info}</InfoKnapp>}
      </p>
      <p className={`mt-1 font-bold ${stor ? 'text-3xl' : 'text-2xl'}`}>{kr2(verdi)}</p>
    </div>
  )
}

export default function Resultater({ r, fpErEstimat = false }) {
  return (
    <motion.div
      key={Math.round(r.bruttoAarslonn)}
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Brutto årslønn" verdi={r.bruttoAarslonn} />
        <Stat label="Brutto per måned" verdi={r.maanedsbrutto} />
        <Stat
          label="Netto per måned"
          verdi={r.ordinaerNetto}
          tone="brand"
          info="Ordinær måned (jan–mai, jul–nov). Juni og desember skiller seg ut."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={fpErEstimat ? 'Feriepenger (estimat)' : 'Feriepenger'}
          verdi={r.feriepenger}
          info={
            fpErEstimat
              ? `${r.fpProsent} % av et estimert grunnlag (${kr2(r.feriepengegrunnlag)} = årets lønn). Feriepenger beregnes egentlig av FJORÅRETS utbetalte lønn – fyll inn det i seksjon 4 for et nøyaktig tall.`
              : `${r.fpProsent} % av feriepengegrunnlaget fra i fjor (${kr2(r.feriepengegrunnlag)}).`
          }
        />
        <Stat
          label="Netto i juni"
          verdi={r.juni.netto}
          tone="juni"
          info="Månedslønn + trekkfritt feriepengetillegg. Ferietrekk for 25 dager er gjort."
        />
        <Stat
          label="Netto i desember"
          verdi={r.desember.netto}
          tone="des"
          info={r.desember.merknad || 'Desemberlønn'}
        />
        <Stat label="Skatt per måned" verdi={r.ordinaerSkatt} />
      </div>

      {/* Detaljer skatt */}
      <div className="rounded-2xl border border-slate-200 bg-white/60 p-5">
        <p className="mb-3 text-sm font-semibold text-slate-700">
          {r.brukerTabell ? 'Skatt – nøyaktig tabelltrekk' : 'Skatteberegning (estimat)'}
        </p>
        {r.brukerTabell ? (
          <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Månedlig trekk hentet fra Skatteetatens offisielle tabell:{' '}
            <strong>{kr2(r.trekkMnd)}</strong> per ordinær måned. Postene under er kun et
            informativt estimat på fordelingen.
          </p>
        ) : (
          <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <strong>Omtrentlig estimat</strong> basert på årssatser for 2026. Tar ikke hensyn til
            andre fradrag, inntekter eller individuelle forhold, og kan avvike fra faktisk
            skattetrekk. For nøyaktig trekk: velg «Tabelltrekk» og oppgi skattekortets
            tabellnummer.
          </p>
        )}
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Rad k="Trygdeavgift (7,6 %)" v={r.skattInfo.trygdeavgift} />
          <Rad k="Skatt alminnelig inntekt (22 %)" v={r.skattInfo.skattAlminnelig} />
          <Rad k="Trinnskatt" v={r.skattInfo.trinnskatt} />
          <Rad k="Minstefradrag" v={r.skattInfo.minstefradrag} />
          <Rad k="Pensjonsinnskudd (2 %)" v={r.skattInfo.pensjon} />
          <Rad
            k="Effektiv skatt"
            v={`${r.skattInfo.effektivProsent.toFixed(1)} %`}
            raa
          />
        </dl>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-slate-800">
          <span>Total skatt per år</span>
          <span>{kr2(r.skattInfo.totalSkattAar)}</span>
        </div>
      </div>
    </motion.div>
  )
}

function Rad({ k, v, raa }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1.5 text-slate-600">
      <dt>{k}</dt>
      <dd className="font-medium text-slate-800">{raa ? v : kr2(v)}</dd>
    </div>
  )
}
