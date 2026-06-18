import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'

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
  if (!debut || !fin) return 0
  const [hd, md] = debut.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  return (hf * 60 + mf) - (hd * 60 + md)
}

function detectType(module_, intitule, contenu) {
  const s = (module_ + ' ' + intitule + ' ' + contenu).toLowerCase()
  if (s.includes('ccf') || s.includes('examen') || s.includes('évaluation')) return 'ccf'
  if (s.includes('jury')) return 'jury'
  if (s.includes('récup') || s.includes('repos')) return 'recup'
  if (s.includes('veillée') || s.includes('service') || s.includes('soir')) return 'service'
  if (s.includes('tpe') || s.includes('travaux pratiques')) return 'service'
  return 'cours'
}

// Parse une ligne CSV en tenant compte des guillemets
function parseCsvLine(line) {
  const result = []
  let inQuotes = false
  let current = ''
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export async function POST() {
  try {
    await connectDB()

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
      if (!ligne.trim()) { ignores++; continue }

      const cols = parseCsvLine(ligne)
      if (cols.length < 3) { ignores++; continue }

      const dateRaw  = cols[0] || ''
      const debut    = cols[1] || ''
      const fin      = cols[2] || ''
      const classe   = cols[3] || ''
      const module_  = cols[4] || ''
      const intitule = cols[5] || ''
      const contenu  = cols[6] || ''
      // const obs   = cols[7] || ''  // Observations — pas stocké pour l'instant

      if (!dateRaw || !debut || !fin || !classe) { ignores++; continue }
      if (dateRaw === 'Date') { ignores++; continue } // ligne d'en-tête parasite

      const date = parseDate(dateRaw)
      if (!date) { ignores++; continue }

      const duree = dureeMinutes(debut, fin)
      if (duree <= 0) { ignores++; continue }

      // Le contenu est saisi si non vide et différent de "Contenu non saisi"
      const contenuPropre = contenu && contenu !== 'Contenu non saisi' ? contenu : ''
      const estSaisi = contenuPropre !== ''

      try {
        await Seance.create({
          date,
          heure_debut: debut,
          heure_fin: fin,
          duree_minutes: duree,
          classe: classe.trim(),
          module: module_.trim(),
          matiere: intitule.trim(),
          type: detectType(module_, intitule, contenu),
          contenu: contenuPropre,
          source: 'sheets',
          statut: estSaisi ? 'saisi' : 'a_completer',
          ireo_uid: '',
        })
        ajoutes++
      } catch (e) {
        ignores++
      }
    }

    return NextResponse.json({ success: true, ajoutes, ignores })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
