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
          info={`Ordinær måned (jan–mai, jul–nov) etter skatt${r.pensjonMnd > 0 ? ` og pensjonstrekk på ${String(r.pensjonProsent).replace('.', ',')} % (${kr2(r.pensjonMnd)})` : ''}. Juni og desember skiller seg ut.`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={fpErEstimat ? 'Feriepenger (estimat)' : 'Feriepenger'}
          verdi={r.feriepenger}
          info={
            (fpErEstimat
              ? `${String(r.fpProsent).replace(".", ",")} % av et estimert grunnlag (${kr2(r.feriepengegrunnlag)} = årets lønn). Feriepenger beregnes egentlig av FJORÅRETS utbetalte lønn – fyll inn det i seksjon 4 for et nøyaktig tall.`
              : `${String(r.fpProsent).replace(".", ",")} % av feriepengegrunnlaget fra i fjor (${kr2(r.feriepengegrunnlag)}).`) +
            (r.fpBegrenset
              ? ` Tillegget på 2,3 % for 60+ er bare regnet av grunnlag opp til 6G (${kr2(r.fpTak)}), jf. ferieloven § 10. Over det gis 12 %.`
              : '')
          }
        />
        <Stat
          label="Netto i juni"
          verdi={r.juni.netto}
          tone="juni"
          info="Månedslønn + feriepenger − trekk for 25 feriedager (5 uker). Se oppstillingen under."
        />
        <Stat
          label="Netto i desember"
          verdi={r.desember.netto}
          tone="des"
          info={r.desember.merknad || 'Desemberlønn'}
        />
        <Stat label="Skatt per måned" verdi={r.ordinaerSkatt} />
      </div>

      {/* Juni: feriepenger og ferietrekk */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          Juni: feriepenger og trekk for ferie
          <InfoKnapp tittel="Ferietrekk">
            Fast ansatte får trukket lønn for fem ukers ferie (årslønn / 260 × 25 dager) i juni,
            samme måned som feriepengene utbetales. Feriepengene regnes av fjorårets lønn. Var
            fjorårslønnen lav, for eksempel fordi du var vikar eller begynte sent på året, blir
            feriepengene lavere enn trekket og junilønnen lav.
          </InfoKnapp>
        </p>
        <dl className="grid max-w-md gap-y-2 text-sm">
          <Rad k="Månedslønn" v={r.maanedsbrutto} />
          <Rad
            k={r.fpBegrenset ? `Feriepenger (${String(r.fpProsent).replace(".", ",")} % opp til 6G, 12 % over)` : `Feriepenger (${String(r.fpProsent).replace(".", ",")} %)`}
            v={r.feriepenger}
          />
          <Rad k="Trekk for ferie (25 dager)" v={-r.juni.ferietrekk} />
          <Rad k="Feriepenger minus trekk" v={r.juni.feriepengetillegg} />
          {r.juni.pensjon > 0 && <Rad k="Pensjonstrekk (2 %)" v={-r.juni.pensjon} />}
          <Rad k="Skattetrekk i juni" v={r.juni.skatt ? -r.juni.skatt : 0} />
          <Rad k="Utbetalt i juni" v={r.juni.netto} sum />
        </dl>
        {r.feriepenger < r.juni.ferietrekk && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {r.juni.merknad === 'Første yrkesår: full lønn garantert'
              ? 'Feriepengene er lavere enn trekket for ferie, men første yrkesår gir full lønn i juni.'
              : `Feriepengene er ${kr2(r.juni.ferietrekk - r.feriepenger)} lavere enn trekket for ferie, så junilønnen blir lavere enn en vanlig måned.`}
          </p>
        )}
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
          {r.skattInfo.pensjon > 0 && <Rad k="Pensjonsinnskudd (2 %)" v={r.skattInfo.pensjon} />}
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

function Rad({ k, v, raa, sum }) {
  return (
    <div
      className={`flex justify-between py-1.5 ${
        sum ? 'font-semibold text-slate-800' : 'border-b border-slate-100 text-slate-600'
      }`}
    >
      <dt>{k}</dt>
      <dd className="font-medium text-slate-800">{raa ? v : kr2(v)}</dd>
    </div>
  )
}
