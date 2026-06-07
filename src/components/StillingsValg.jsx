export default function StillingsValg({ data, tariff, valg, set }) {
  if (tariff === 'oslo') {
    const koder = Object.entries(data.oslo.stillingskoder)
    return (
      <div className="max-w-md">
        <label className="label">Stillingskode</label>
        <select
          className="field"
          value={valg.osloKode}
          onChange={(e) => set({ osloKode: e.target.value })}
        >
          {koder.map(([id, k]) => (
            <option key={id} value={id}>
              {id} – {k.navn}
            </option>
          ))}
        </select>
      </div>
    )
  }

  const kategorier = Object.entries(data.ks.stillingskoder)
  return (
    <div className="max-w-md">
      <label className="label">Stillingskategori</label>
      <select
        className="field"
        value={valg.ksKode}
        onChange={(e) => set({ ksKode: e.target.value })}
      >
        {kategorier.map(([id, k]) => (
          <option key={id} value={id}>
            {k.label}
          </option>
        ))}
      </select>
    </div>
  )
}
