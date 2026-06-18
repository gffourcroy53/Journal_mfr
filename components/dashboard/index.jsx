// MetricCard.jsx
export function MetricCard({ label, value, sub, variant = '' }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${variant}`}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

// Badge classe → CSS class
export function badgeClass(classe = '') {
  const c = classe.toLowerCase()
  if (c.includes('bts')) return 'badge-bts'
  if (c.includes('a.e') || c.startsWith('ae')) return 'badge-ae'
  if (c.includes('cs ')) return 'badge-cs'
  if (c.includes('sapat')) return 'badge-sapat'
  if (c.includes('ctca')) return 'badge-ctca'
  if (c.includes('bp ')) return 'badge-bp'
  return 'badge-service'
}

// SeancesJour.jsx
export function SeancesJour({ seances = [], date }) {
  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="card">
      <div className="card-title">
        ⏰ Séances — <span style={{ fontWeight: 400, color: 'var(--text2)', marginLeft: 4 }}>{dateLabel}</span>
      </div>
      {seances.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>Aucune séance importée pour ce jour.</p>
      ) : (
        seances.map((s) => (
          <div className="seance-row" key={s._id}>
            <div className="seance-time">{s.heure_debut} – {s.heure_fin}</div>
            <div style={{ flex: 1 }}>
              <span className={`badge ${badgeClass(s.classe)}`}>{s.classe}</span>
              <div className="seance-name" style={{ marginTop: 3 }}>{s.matiere || s.classe}</div>
              {s.contenu && <div className="seance-desc">{s.contenu}</div>}
            </div>
            <div style={{ flexShrink: 0 }}>
              {s.statut === 'saisi'
                ? <span className="tag-ok">✓</span>
                : <span className="tag-warn">⚠</span>
              }
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// HeuresChart.jsx — barres horizontales par classe
const COULEURS = {
  'BTS 1 GDEA': '#2E86C1',
  'BTS 2 GDEA': '#2E86C1',
  'A.E.1 A':    '#27AE60',
  'A.E.1 B':    '#27AE60',
  'A.E.2':      '#27AE60',
  'CS PMATMHT': '#E67E22',
  'SAPAT 1':    '#A93226',
  'CTCA':       '#6C3AAA',
  'BP CMA':     '#BDC3C7',
}

function couleurClasse(classe) {
  return COULEURS[classe] || '#BDC3C7'
}

export function HeuresChart({ data = [] }) {
  const max = data.length > 0 ? Math.max(...data.map(d => d.minutes)) : 1

  return (
    <div className="card">
      <div className="card-title">📊 Heures par classe (année)</div>
      {data.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>Aucune donnée.</p>
      ) : (
        data.map((d) => (
          <div className="bar-row" key={d.classe}>
            <div className="bar-label">{d.classe}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.round((d.minutes / max) * 100)}%`,
                  background: couleurClasse(d.classe)
                }}
              />
            </div>
            <div className="bar-val">{d.heures}</div>
          </div>
        ))
      )}
    </div>
  )
}

export default MetricCard
