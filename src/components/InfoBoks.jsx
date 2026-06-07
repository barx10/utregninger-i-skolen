import { useState } from 'react'

// Liten "i"-knapp med popover for kompliserte regler.
export function InfoKnapp({ children, tittel }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={tittel || 'Mer informasjon'}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 transition hover:bg-brand-200"
      >
        i
      </button>
      {open && (
        <span className="absolute left-1/2 top-7 z-20 w-64 -translate-x-1/2 rounded-2xl border border-slate-100 bg-white p-3 text-left text-xs leading-relaxed text-slate-600 shadow-card">
          {tittel && <span className="mb-1 block font-semibold text-slate-800">{tittel}</span>}
          {children}
        </span>
      )}
    </span>
  )
}

// Stående informasjonsboks med farge.
export function InfoBoks({ tone = 'blue', tittel, children }) {
  const toner = {
    blue: 'bg-brand-50 border-brand-100 text-brand-900',
    green: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-900',
  }
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${toner[tone]}`}>
      {tittel && <p className="mb-0.5 font-semibold">{tittel}</p>}
      <div className="opacity-90">{children}</div>
    </div>
  )
}
