'use client'
import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'

function ActionCard({ titre, description, bouton, couleur = '#1A5276', onAction, loading, resultat, erreur }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-title">{titre}</div>
      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>{description}</p>
      <button
        className="btn btn-primary"
        style={{ background: couleur, borderColor: couleur }}
        onClick={onAction}
        disabled={loading}
      >
        {loading ? '⏳ En cours...' : bouton}
      </button>
      {resultat && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#E8F6EE', borderRadius: 8, fontSize: 12, color: '#1E7A43' }}>
          ✓ {resultat}
        </div>
      )}
      {erreur && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#FDEDEC', borderRadius: 8, fontSize: 12, color: '#922B21' }}>
          ✗ {erreur}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [etats, setEtats] = useState({})

  function setEtat(key, etat) {
    setEtats(prev => ({ ...prev, [key]: etat }))
  }

  async function action(key, url, body = {}) {
    setEtat(key, { loading: true })
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()
      if (json.success) {
        const msg = json.ajoutes !== undefined
          ? `${json.ajoutes} séances importées, ${json.doublons ?? 0} doublons ignorés`
          : json.message || 'Opération réussie'
        setEtat(key, { resultat: msg })
      } else {
        setEtat(key, { erreur: json.error || 'Erreur inconnue' })
      }
    } catch (e) {
      setEtat(key, { erreur: e.message })
    }
  }

  async function actionDelete(key, url) {
    if (!confirm('Confirmer la suppression ?')) return
    setEtat(key, { loading: true })
    try {
      const res = await fetch(url, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setEtat(key, { resultat: `${json.deleted} séances supprimées` })
      } else {
        setEtat(key, { erreur: json.error })
      }
    } catch (e) {
      setEtat(key, { erreur: e.message })
    }
  }

  const e = (key) => etats[key] || {}

  return (
    <AppLayout>
      <div className="section-header">
        <span className="section-title">⚙️ Administration</span>
      </div>

      <div style={{ maxWidth: 600 }}>

        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
          Outils d'import et de maintenance de la base de données.
        </p>

        <ActionCard
          titre="🔧 Corriger index base de données"
          description="À exécuter une seule fois si l'import Sheets échoue avec une erreur E11000. Supprime l'index unique sur ireo_uid."
          bouton="🔧 Corriger index"
          couleur="#6C3AAA"
          onAction={() => action('fix_index', '/api/admin?action=drop-ireo-uid-index')}
          loading={e('fix_index').loading}
          resultat={e('fix_index').resultat}
          erreur={e('fix_index').erreur}
        />

        <ActionCard
          titre="📋 Importer l'historique Google Sheets"
          description="Importe toutes les séances du cahier journal Google Sheets (novembre 2025 → juin 2026). Les séances existantes issues du Sheets seront remplacées."
          bouton="↺ Importer depuis Google Sheets"
          couleur="#27AE60"
          onAction={() => action('sheets', '/api/import-sheets')}
          loading={e('sheets').loading}
          resultat={e('sheets').resultat}
          erreur={e('sheets').erreur}
        />

        <ActionCard
          titre="🔧 Corriger index base de données"
          description="À exécuter une seule fois si l'import Sheets échoue avec une erreur E11000. Supprime l'index unique sur ireo_uid."
          bouton="🔧 Corriger index"
          couleur="#6C3AAA"
          onAction={() => action('fix_index', '/api/admin?action=drop-ireo-uid-index')}
          loading={e('fix_index').loading}
          resultat={e('fix_index').resultat}
          erreur={e('fix_index').erreur}
        />

        <ActionCard
          titre="📅 Importer depuis iRéo (depuis août 2025)"
          description="Importe toutes les séances du flux iCal iRéo depuis le 18 août 2025. Les doublons sont automatiquement ignorés."
          bouton="↺ Importer iRéo complet"
          couleur="#2E86C1"
          onAction={() => action('ireo_full', '/api/ireo', { depuis: '2025-08-18' })}
          loading={e('ireo_full').loading}
          resultat={e('ireo_full').resultat}
          erreur={e('ireo_full').erreur}
        />

        <ActionCard
          titre="🔧 Corriger index base de données"
          description="À exécuter une seule fois si l'import Sheets échoue avec une erreur E11000. Supprime l'index unique sur ireo_uid."
          bouton="🔧 Corriger index"
          couleur="#6C3AAA"
          onAction={() => action('fix_index', '/api/admin?action=drop-ireo-uid-index')}
          loading={e('fix_index').loading}
          resultat={e('fix_index').resultat}
          erreur={e('fix_index').erreur}
        />

        <ActionCard
          titre="📅 Importer iRéo — aujourd'hui seulement"
          description="Importe uniquement les séances du jour depuis iRéo. Utile pour le journal quotidien."
          bouton="↺ Importer iRéo aujourd'hui"
          couleur="#1A5276"
          onAction={() => action('ireo_today', '/api/ireo', {})}
          loading={e('ireo_today').loading}
          resultat={e('ireo_today').resultat}
          erreur={e('ireo_today').erreur}
        />

        <ActionCard
          titre="🔧 Corriger index base de données"
          description="À exécuter une seule fois si l'import Sheets échoue avec une erreur E11000. Supprime l'index unique sur ireo_uid."
          bouton="🔧 Corriger index"
          couleur="#6C3AAA"
          onAction={() => action('fix_index', '/api/admin?action=drop-ireo-uid-index')}
          loading={e('fix_index').loading}
          resultat={e('fix_index').resultat}
          erreur={e('fix_index').erreur}
        />

        <ActionCard
          titre="🗑️ Vider les séances iRéo mal parsées"
          description="Supprime toutes les séances importées depuis iRéo (source = 'ireo'). Les séances saisies manuellement ou depuis le Sheets ne sont pas affectées."
          bouton="🗑️ Vider séances iRéo"
          couleur="#A93226"
          onAction={() => actionDelete('reset', '/api/seances/reset')}
          loading={e('reset').loading}
          resultat={e('reset').resultat}
          erreur={e('reset').erreur}
        />

      </div>
    </AppLayout>
  )
}
