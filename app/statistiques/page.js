'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'

const ANNEE_DEBUT = '2025-08-18'
const ANNEE_FIN   = '2026-07-06'
const REF_MFR     = 1607 * 60 // minutes

function minutesEnHeures(min) {
  if (!min || min <= 0) return '0h'
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2,'0')}`
}

function BarreHoriz({ label, minutes, max, couleur, total }) {
  const pct = max > 0 ? Math.round((minutes / max) * 100) : 0
  const pctTotal = total > 0 ? Math.round((minutes / total) * 10) / 10 : 0
  return (
    <div className="bar-row">
      <div className="bar-label" style={{ minWidth: 130, fontSize: 11 }}>{label}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: couleur }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text2)', minWidth: 48, textAlign: 'right' }}>
        {minutesEnHeures(minutes)}
      </div>
      {total > 0 && (
        <div style={{ fontSize: 10, color: 'var(--text3)', minWidth: 36, textAlign: 'right' }}>
          {pctTotal}%
        </div>
      )}
    </div>
  )
}

function MetriqueClé({ label, value, sub, couleur = 'var(--text)' }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: couleur, fontSize: 20 }}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

export default function StatistiquesPage() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [du, setDu]           = useState(ANNEE_DEBUT)
  const [au, setAu]           = useState(ANNEE_FIN)
  const [classe, setClasse]   = useState('')
  const [classes, setClasses] = useState([])

  async function charger() {
    setLoading(true)
    const params = new URLSearchParams({ du, au })
    if (classe) params.set('classe', classe)
    const res  = await fetch(`/api/stats?${params}`)
    const json = await res.json()
    if (json.success) {
      setStats(json.data)
      // Extraire classes distinctes pour le filtre
      const cls = json.data.par_classe.map(c => c.classe).filter(c =>
        !['Récupération','Congés','Service','Préparation','Réunion','Correction',
          'Jury','Intervention Externe','Préparation (implicite)','Formation externe',
          'Forum','Accompagnement','Logistique','Visite de stage','Personnel'].includes(c)
      )
      setClasses(cls)
    }
    setLoading(false)
  }

  useEffect(() => { charger() }, [du, au, classe])

  const ecartMin = stats ? stats.total_minutes - REF_MFR : 0
  const ecartStr = ecartMin >= 0
    ? `+${minutesEnHeures(ecartMin)} au-dessus`
    : `-${minutesEnHeures(Math.abs(ecartMin))} en dessous`
  const ecartCouleur = ecartMin >= 0 ? 'var(--vert)' : 'var(--orange)'

  // Ventilation pour le graphique
  const ventilation = stats ? [
    { label: 'Face-à-face (cours/CCF/jury)', minutes: stats.faf_minutes, couleur: '#2E86C1' },
    { label: 'Service institutionnel',        minutes: (stats.par_classe.find(c=>c.classe==='Service')?.minutes||0), couleur: '#1A5276' },
    { label: 'Préparation',                   minutes: (stats.par_classe.find(c=>c.classe==='Préparation')?.minutes||0) + (stats.par_classe.find(c=>c.classe==="Préparation (implicite)")?.minutes||0), couleur: '#27AE60' },
    { label: 'Réunions',                      minutes: (stats.par_classe.find(c=>c.classe==='Réunion')?.minutes||0), couleur: '#E67E22' },
    { label: 'Corrections',                   minutes: (stats.par_classe.find(c=>c.classe==='Correction')?.minutes||0), couleur: '#F4D03F' },
    { label: 'Jury / Évaluation',             minutes: (stats.par_classe.find(c=>c.classe==='Jury')?.minutes||0), couleur: '#A93226' },
    { label: 'Résidentiel Italie',            minutes: (stats.par_classe.find(c=>c.classe==='Résidentiel Italie')?.minutes||0), couleur: '#6C3AAA' },
    { label: 'Interventions externes',        minutes: (stats.par_classe.find(c=>c.classe==='Intervention Externe')?.minutes||0), couleur: '#BDC3C7' },
  ].filter(v => v.minutes > 0) : []

  const maxVentil = ventilation.length > 0 ? Math.max(...ventilation.map(v => v.minutes)) : 1

  return (
    <AppLayout>
      {/* Filtres */}
      <div className="section-header" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span className="section-title">📊 Statistiques</span>
        <div className="filters" style={{ margin: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Du</span>
          <input type="date" value={du} onChange={e => setDu(e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>au</span>
          <input type="date" value={au} onChange={e => setAu(e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)' }} />
          <select value={classe} onChange={e => setClasse(e.target.value)}
            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)' }}>
            <option value="">Toutes les classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn" onClick={() => { setDu(ANNEE_DEBUT); setAu(ANNEE_FIN); setClasse('') }}>
            ✕ Réinitialiser
          </button>
        </div>
      </div>

      {loading && <p style={{ fontSize: 12, color: 'var(--text3)', margin: '20px 0' }}>Chargement...</p>}

      {stats && (
        <>
          {/* Métriques clés */}
          <div className="metric-grid" style={{ marginBottom: 16 }}>
            <MetriqueClé
              label="Heures travaillées"
              value={stats.total_heures}
              sub={`${stats.jours_travailles} jours`}
            />
            <MetriqueClé
              label="Référence MFR"
              value="1607h"
              sub="base contractuelle annuelle"
            />
            <MetriqueClé
              label="Écart / référence"
              value={ecartStr}
              couleur={ecartCouleur}
              sub="sur la période"
            />
            <MetriqueClé
              label="Ratio face-à-face"
              value={`${stats.ratio_faf} %`}
              sub="plafond 42 % (sept. 2027)"
              couleur={stats.ratio_faf > 42 ? 'var(--orange)' : 'var(--vert)'}
            />
          </div>

          <div className="two-col" style={{ marginBottom: 12 }}>
            {/* Ventilation des heures */}
            <div className="card">
              <div className="card-title">⏱️ Ventilation des heures travaillées</div>
              {ventilation.map(v => (
                <BarreHoriz
                  key={v.label}
                  label={v.label}
                  minutes={v.minutes}
                  max={maxVentil}
                  couleur={v.couleur}
                  total={stats.total_minutes}
                />
              ))}
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Récupérations soldées</span>
                <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{stats.recup_heures}</span>
              </div>
            </div>

            {/* Heures par classe pédagogique */}
            <div className="card">
              <div className="card-title">📚 Heures par classe / groupe</div>
              {stats.par_classe
                .filter(c => !['Récupération','Congés','Service','Préparation','Réunion',
                  'Correction','Jury','Intervention Externe','Préparation (implicite)',
                  'Formation externe','Forum','Accompagnement','Logistique',
                  'Visite de stage','Personnel','Résidentiel Italie'].includes(c.classe))
                .slice(0, 12)
                .map(c => (
                  <BarreHoriz
                    key={c.classe}
                    label={c.classe}
                    minutes={c.minutes}
                    max={stats.par_classe.filter(x => !['Récupération','Congés','Service','Préparation',
                      'Réunion','Correction','Jury','Intervention Externe','Préparation (implicite)',
                      'Formation externe','Forum','Accompagnement','Logistique',
                      'Visite de stage','Personnel','Résidentiel Italie'].includes(x.classe))
                      .reduce((max, x) => Math.max(max, x.minutes), 0)}
                    couleur="#2E86C1"
                    total={0}
                  />
                ))
              }
            </div>
          </div>

          {/* Évolution par semaine */}
          <div className="card">
            <div className="card-title">📈 Évolution hebdomadaire</div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', minWidth: stats.par_semaine.length * 28, height: 110, padding: '4px 0' }}>
                {stats.par_semaine.map(s => {
                  const maxSem = Math.max(...stats.par_semaine.map(x => x.total_minutes))
                  const h = maxSem > 0 ? Math.round((s.total_minutes / maxSem) * 70) : 0
                  const label = s.semaine.replace('20','').replace('-W','S')
                  return (
                    <div key={s.semaine} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ fontSize: 8, color: 'var(--text2)', fontWeight: 500, whiteSpace: 'nowrap', marginBottom: 2 }}>
                        {s.total}
                      </div>
                      <div title={`${s.semaine} : ${s.total}`}
                        style={{ width: 20, height: h, background: '#2E86C1', borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                      <div style={{ fontSize: 8, color: 'var(--text3)', transform: 'rotate(-45deg)', transformOrigin: 'top left', marginTop: 6, whiteSpace: 'nowrap' }}>
                        {label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--text2)' }}>
                Moy. / semaine : <strong>{minutesEnHeures(Math.round(stats.total_minutes / Math.max(stats.par_semaine.length, 1)))}</strong>
              </span>
              <span style={{ fontSize: 11, color: 'var(--text2)' }}>
                Moy. / jour : <strong>{minutesEnHeures(Math.round(stats.total_minutes / Math.max(stats.jours_travailles, 1)))}</strong>
              </span>
              <span style={{ fontSize: 11, color: 'var(--text2)' }}>
                {stats.par_semaine.length} semaines
              </span>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}
