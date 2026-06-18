import ical from 'node-ical'
import { format, parseISO } from 'date-fns'
import connectDB from './mongodb.js'
import Seance from '../models/Seance.js'

const IREO_ICAL_URL = process.env.IREO_ICAL_URL ||
  'https://ireopignerie.imfr.fr/V2/iplanning/feed/ical/?u=a0Pp70Mn4YTOUGT7JzhAoA6X70vSCLOb'

// Détermine le type de séance depuis le titre iRéo
function detecterType(summary = '') {
  const s = summary.toLowerCase()
  if (s.includes('ccf') || s.includes('examen') || s.includes('évaluation')) return 'ccf'
  if (s.includes('jury')) return 'jury'
  if (s.includes('récup') || s.includes('recup') || s.includes('repos')) return 'recup'
  if (s.includes('veillée') || s.includes('veillee') || s.includes('service')) return 'service'
  if (s.includes('tpe') || s.includes('accompagnement')) return 'cours'
  return 'cours'
}

// Extrait la classe depuis le titre iRéo
// Ex: "BTS 1 GDEA – BC5 Robotisation" → "BTS 1 GDEA"
function extraireClasse(summary = '') {
  const patterns = [
    /^(BTS\s+\d?\s*GDEA)/i,
    /^(BTS\s+\d?\s*ESF)/i,
    /^(A\.?E\.?\s*\d\s*[AB]?)/i,
    /^(CS\s+PMATMHT)/i,
    /^(SAPAT\s*\d?)/i,
    /^(BP\s+CMA)/i,
    /^(CTCA)/i,
    /^(AE\s*\d)/i,
  ]
  for (const p of patterns) {
    const m = summary.match(p)
    if (m) return m[1].trim()
  }
  return 'Autre'
}

// Extrait le module/matière depuis le titre
// Ex: "BTS 1 GDEA – BC5 Robotisation et automatismes" → "BC5 Robotisation et automatismes"
function extraireMatiere(summary = '') {
  const sep = summary.indexOf('–')
  if (sep !== -1) return summary.slice(sep + 1).trim()
  const sep2 = summary.indexOf('-')
  if (sep2 !== -1) return summary.slice(sep2 + 1).trim()
  return summary
}

// Calcule la durée en minutes entre deux dates
function dureeMinutes(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 60000)
}

// Importe les événements iRéo pour une date donnée (YYYY-MM-DD)
// Si aucune date, importe tous les événements futurs
export async function importerIreo(dateStr = null) {
  await connectDB()

  let events
  try {
    events = await ical.async.fromURL(IREO_ICAL_URL)
  } catch (err) {
    throw new Error(`Impossible de lire le flux iRéo : ${err.message}`)
  }

  const resultats = { ajoutes: 0, doublons: 0, ignores: 0 }

  for (const event of Object.values(events)) {
    // On ne traite que les événements VEVENT
    if (event.type !== 'VEVENT') { resultats.ignores++; continue }

    // Filtrer par date si demandé
    const dateEvent = format(new Date(event.start), 'yyyy-MM-dd')
    if (dateStr && dateEvent !== dateStr) continue

    const uid = event.uid || ''
    const summary = event.summary || ''
    const description = event.description || ''

    // Ignorer les rappels et événements sans heure
    if (!event.start || !event.end) { resultats.ignores++; continue }

    const duree = dureeMinutes(event.start, event.end)
    if (duree <= 0) { resultats.ignores++; continue }

    // Vérifier doublon via ireo_uid
    if (uid) {
      const existant = await Seance.findOne({ ireo_uid: uid })
      if (existant) { resultats.doublons++; continue }
    }

    const classe = extraireClasse(summary)
    const matiere = extraireMatiere(summary)
    const type = detecterType(summary)

    const seance = new Seance({
      date: dateEvent,
      heure_debut: format(new Date(event.start), 'HH:mm'),
      heure_fin: format(new Date(event.end), 'HH:mm'),
      duree_minutes: duree,
      classe,
      matiere,
      module: '',
      type,
      contenu: '',
      source: 'ireo',
      statut: 'a_completer',
      ireo_uid: uid,
    })

    await seance.save()
    resultats.ajoutes++
  }

  return resultats
}

// Importe uniquement les séances du jour
export async function importerAujourdhui() {
  const today = format(new Date(), 'yyyy-MM-dd')
  return importerIreo(today)
}

// Récupère les séances d'une date depuis la base (sans import)
export async function getSeancesParDate(dateStr) {
  await connectDB()
  return Seance.find({ date: dateStr }).sort({ heure_debut: 1 })
}
