import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'

// ID du Google Sheets journal
const SHEET_ID = '1fKGJSH8LFxIJxfqOKyZt2Zgazb0GWjC2XxMXxDxOQ4I'
const SHEET_NAME = 'Journal'

function parseDate(str) {
  if (!str) return null
  const parts = str.trim().split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  if (!d || !m || !y) return null
  return `${y.padStart(4,'0')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

function dureeMinutes(debut, fin) {
  const [hd, md] = debut.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  return (hf * 60 + mf) - (hd * 60 + md)
}

function detectType(module_, intitule) {
  const s = (module_ + ' ' + intitule).toLowerCase()
  if (s.includes('ccf') || s.includes('examen') || s.includes('évaluation')) return 'ccf'
  if (s.includes('jury')) return 'jury'
  if (s.includes('récup') || s.includes('repos')) return 'recup'
  if (s.includes('veillée') || s.includes('service') || s.includes('soir')) return 'service'
  if (s.includes('tpe') || s.includes('travaux pratiques')) return 'service'
  return 'cours'
}

export async function POST() {
  try {
    await connectDB()

    // Lecture du Sheets via l'API publique Google Sheets (export CSV)
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Erreur lecture Sheets: ${res.status}`)

    const csv = await res.text()
    const lignes = csv.split('\n').slice(1) // skip header

    // Vider les séances issues de sheets (réimport propre)
    await Seance.deleteMany({ source: 'sheets' })

    let ajoutes = 0
    let ignores = 0

    for (const ligne of lignes) {
      // Parse CSV simple (les champs peuvent être entre guillemets)
      const cols = ligne.match(/(".*?"|[^,]+)(?=,|$)/g)
      if (!cols || cols.length < 3) { ignores++; continue }

      const clean = (s) => (s || '').replace(/^"|"$/g, '').trim()

      const dateRaw  = clean(cols[0])
      const debut    = clean(cols[1])
      const fin      = clean(cols[2])
      const classe   = clean(cols[3])
      const module_  = clean(cols[4])
      const intitule = clean(cols[5])
      const contenu  = clean(cols[6])

      if (!dateRaw || !debut || !fin || !classe) { ignores++; continue }

      const date = parseDate(dateRaw)
      if (!date) { ignores++; continue }

      const duree = dureeMinutes(debut, fin)
      if (duree <= 0) { ignores++; continue }

      const estSaisi = contenu && contenu !== 'Contenu non saisi' && contenu !== ''

      await Seance.create({
        date,
        heure_debut: debut,
        heure_fin: fin,
        duree_minutes: duree,
        classe,
        module: module_,
        matiere: intitule,
        type: detectType(module_, intitule),
        contenu: estSaisi ? contenu : '',
        source: 'sheets',
        statut: estSaisi ? 'saisi' : 'a_completer',
        ireo_uid: '',
      })
      ajoutes++
    }

    return NextResponse.json({ success: true, ajoutes, ignores })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
