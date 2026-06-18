import ical from 'node-ical'
import connectDB from './mongodb.js'
import Seance from '../models/Seance.js'

const IREO_ICAL_URL = process.env.IREO_ICAL_URL ||
  'https://ireopignerie.imfr.fr/V2/iplanning/feed/ical/?u=a0Pp70Mn4YTOUGT7JzhAoA6X70vSCLOb'

function formatDateParis(d) {
  const paris = new Date(d.getTime() + 2 * 60 * 60 * 1000)
  const y = paris.getUTCFullYear()
  const m = String(paris.getUTCMonth() + 1).padStart(2, '0')
  const j = String(paris.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${j}`
}

function formatHeureParis(d) {
  const paris = new Date(d.getTime() + 2 * 60 * 60 * 1000)
  const h = String(paris.getUTCHours()).padStart(2, '0')
  const min = String(paris.getUTCMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

function decode(str) {
  if (!str) return ''
  try { return decodeURIComponent(escape(str)) } catch { return str }
}

function detecterType(summary = '') {
  const s = summary.toLowerCase()
  if (s.includes('ccf') || s.includes('examen') || s.includes('évaluation') || s.includes('evaluation')) return 'ccf'
  if (s.includes('jury')) return 'jury'
  if (s.includes('récup') || s.includes('recup') || s.includes('repos')) return 'recup'
  if (s.includes('veillée') || s.includes('veillee') || s.includes('service') || s.includes('soir') || s.includes('surveillance')) return 'service'
  return 'cours'
}

function extraireClasse(summary = '') {
  const s = summary.trim()
  const patterns = [
    [/^(BTS\s*[12]?\s*GDEA)/i, 'BTS GDEA'],
    [/^(BTS\s*[12]?\s*ESF)/i,  'BTS ESF'],
    [/^(A\.?E\.?\s*[12]\s*[AB]?)/i, null],
    [/^(AE\s*[12]\s*[AB]?)/i, null],
    [/^(CS\s+PMATMHT)/i, 'CS PMATMHT'],
    [/^(SAPAT\s*[12]?)/i, null],
    [/^(BP\s+CMA)/i, 'BP CMA'],
    [/^(CTCA)/i, 'CTCA'],
    [/^(CS\s+LAIT)/i, 'CS Lait'],
    [/^(SEC\s+P\.?V\.?)/i, 'Sec P.V.'],
  ]
  for (const [p, override] of patterns) {
    const m = s.match(p)
    if (m) return override || m[1].trim()
  }
  const sep = s.indexOf('–') !== -1 ? s.indexOf('–') : s.indexOf(' - ')
  if (sep > 0) {
    const avant = s.slice(0, sep).trim()
    for (const [p, override] of patterns) {
      const m = avant.match(p)
      if (m) return override || m[1].trim()
    }
  }
  return 'Autre'
}

function extraireMatiere(summary = '') {
  const sep = summary.indexOf('–')
  if (sep !== -1) return summary.slice(sep + 1).trim()
  const sep2 = summary.indexOf(' - ')
  if (sep2 !== -1) return summary.slice(sep2 + 3).trim()
  return summary
}

function dureeMinutes(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 60000)
}

// dateStr : date précise YYYY-MM-DD (ou null pour tout)
// depuis  : date de début YYYY-MM-DD pour filtrer (ex: "2025-08-18")
export async function importerIreo(dateStr = null, depuis = null) {
  await connectDB()

  let events
  try {
    events = await ical.async.fromURL(IREO_ICAL_URL)
  } catch (err) {
    throw new Error(`Impossible de lire le flux iRéo : ${err.message}`)
  }

  const resultats = { ajoutes: 0, doublons: 0, ignores: 0 }

  for (const event of Object.values(events)) {
    if (event.type !== 'VEVENT') { resultats.ignores++; continue }
    if (!event.start || !event.end) { resultats.ignores++; continue }

    const dateEvent = formatDateParis(new Date(event.start))

    // Filtre date précise
    if (dateStr && dateEvent !== dateStr) continue

    // Filtre depuis
    if (depuis && dateEvent < depuis) continue

    const duree = dureeMinutes(event.start, event.end)
    if (duree <= 0) { resultats.ignores++; continue }

    const uid = event.uid || ''
    if (uid) {
      const existant = await Seance.findOne({ ireo_uid: uid })
      if (existant) { resultats.doublons++; continue }
    }

    const summary = decode(event.summary || '')
    const classe  = extraireClasse(summary)
    const matiere = decode(extraireMatiere(summary))
    const type    = detecterType(summary)

    await Seance.create({
      date: dateEvent,
      heure_debut: formatHeureParis(new Date(event.start)),
      heure_fin:   formatHeureParis(new Date(event.end)),
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
    resultats.ajoutes++
  }

  return resultats
}

export async function importerAujourdhui() {
  const d = new Date()
  const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return importerIreo(dateStr)
}

export async function getSeancesParDate(dateStr) {
  await connectDB()
  return Seance.find({ date: dateStr }).sort({ heure_debut: 1 })
}
