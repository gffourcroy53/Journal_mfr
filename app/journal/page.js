'use client'
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { badgeClass } from '@/components/dashboard/index'

function formatDate(d) {
  return d.toISOString().split('T')[0]
}

function labelDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return formatDate(d)
}

export default function JournalPage() {
  const [date, setDate] = useState(formatDate(new Date()))
  const [seances, setSeances] = useState([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editContenu, setEditContenu] = useState('')

  const charger = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/seances?date=${date}`)
    const json = await res.json()
    setSeances(json.success ? json.data : [])
    setLoading(false)
  }, [date])

  useEffect(() => { charger() }, [charger])

  async function importerIreo() {
    setImporting(true)
    await fetch('/api/ireo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    })
    await charger()
    setImporting(false)
  }

  async function sauvegarder(id) {
    await fetch(`/api/seances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu: editContenu })
    })
    setEditId(null)
    await charger()
  }

  function startEdit(s) {
    setEditId(s._id)
    setEditContenu(s.contenu || '')
  }

  return (
    <AppLayout>
      {/* Navigation date */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn" onClick={() => setDate(d => addDays(d, -1))}>← Jour préc.</button>
          <span className="section-title" style={{ textTransform: 'capitalize' }}>
            {labelDate(date)}
          </span>
          <button className="btn" onClick={() => setDate(d => addDays(d, 1))}>Jour suiv. →</button>
        </div>
        <button className="btn btn-primary" onClick={importerIreo} disabled={importing}>
          {importing ? '⏳ Import...' : '↺ Importer depuis iRéo'}
        </button>
      </div>

      {loading && <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Chargement...</p>}

      {!loading && seances.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>
            Aucune séance pour ce jour.
          </p>
          <button className="btn btn-primary" onClick={importerIreo}>
            ↺ Importer depuis iRéo
          </button>
        </div>
      )}

      {seances.map(s => (
        <div
          key={s._id}
          className={`saisie-card ${s.statut === 'a_completer' ? 'orange' : 'vert'}`}
        >
          <div className="saisie-head">
            <div className="saisie-meta">
              <span className={`badge ${badgeClass(s.classe)}`}>{s.classe}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{s.heure_debut} – {s.heure_fin}</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.matiere}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {s.statut === 'saisi'
                ? <span className="tag-ok">✓ Saisi</span>
                : <span className="tag-warn">⚠ À compléter</span>
              }
              <button
                className="btn"
                style={{ padding: '3px 9px', fontSize: 11 }}
                onClick={() => editId === s._id ? setEditId(null) : startEdit(s)}
              >
                ✏️ Éditer
              </button>
            </div>
          </div>

          {editId === s._id ? (
            <div style={{ marginTop: 8 }}>
              <textarea
                rows={3}
                value={editContenu}
                onChange={e => setEditContenu(e.target.value)}
                placeholder="Décrire le contenu de la séance..."
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button className="btn" onClick={() => setEditId(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={() => sauvegarder(s._id)}>Enregistrer</button>
              </div>
            </div>
          ) : (
            s.contenu && <div className="saisie-content">{s.contenu}</div>
          )}

          {/* Documents liés */}
          {s.documents?.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {s.documents.map(d => (
                <span key={d._id} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#EAF2FB', color: '#1A5276' }}>
                  📄 {d.titre}
                </span>
              ))}
            </div>
          )}

          {/* Travaux liés */}
          {s.travaux?.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {s.travaux.map(t => (
                <span key={t._id} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#F0EAF8', color: '#6C3AAA' }}>
                  📝 {t.titre} — {t.statut}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </AppLayout>
  )
}
