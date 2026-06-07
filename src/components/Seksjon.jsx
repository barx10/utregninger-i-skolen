import { motion } from 'framer-motion'

// Standard seksjonskort med nummer, tittel og animert innfelling.
export default function Seksjon({ nr, tittel, undertittel, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass p-6 sm:p-8"
    >
      <header className="mb-6 flex items-start gap-3">
        <span className="section-num">{nr}</span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">{tittel}</h2>
          {undertittel && <p className="text-sm text-slate-500">{undertittel}</p>}
        </div>
      </header>
      {children}
    </motion.section>
  )
}
