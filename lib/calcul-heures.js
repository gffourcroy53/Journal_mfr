// lib/calcul-heures.js
// Moteur de calcul des heures travaillées par jour et par semaine

// Jours fériés français 2025-2026
const JOURS_FERIES = new Set([
  '2025-11-01', // Toussaint
  '2025-11-11', // Armistice
  '2025-12-25', // Noël
  '2026-01-01', // Jour de l'an
  '2026-04-06', // Lundi de Pâques
  '2026-05-01', // Fête du travail
  '2026-05-08', // Victoire 1945
  '2026-05-14', // Ascension
  '2026-05-25', // Lundi de Pentecôte
  '2026-07-14', // Fête nationale
])

// Types comptant comme face-à-face
const TYPES_FAF = new Set(['cours', 'ccf', 'jury'])

// Types congé → jour exclu du total
const TYPES_CONGE = new Set(['conge', 'congé', 'ferie', 'férié'])

// Types récupération → déduites du total contractuel
const TYPES_RECUP = new Set(['recup'])

// Convertit "HH:MM" en minutes depuis minuit
function hm(str) {
  if (!str) return 0
  const [h, m] = str.split(':').map(Number)
  return h * 60 + m
}

// Convertit minutes en "Xh YYmin" ou "Xh"
export function minutesEnHeures(min) {
  if (min <= 0) return '0h'
  const h = Math.floor(Math.abs(min) / 60)
  const m = Math.abs(min) % 60
  const sign = min < 0 ? '-' : ''
  return m === 0 ? `${sign}${h}h` : `${sign}${h}h${String(m).padStart(2, '0')}`
}

function estPremierJourSemaine(dateStr, datesAvecSeances) {
  const d = new Date(dateStr + 'T00:00:00')
  const jourSemaine = d.getDay() // 0=dim, 1=lun, ..., 6=sam
  for (let j = 1; j < jourSemaine; j++) {
    const prev = new Date(d)
    prev.setDate(d.getDate() - (jourSemaine - j))
    const prevStr = prev.toISOString().split('T')[0]
    if (datesAvecSeances.has(prevStr)) return false
  }
  return true
}

export function calculerHeuresJour(seances, dateStr, datesAvecSeances = new Set()) {
  // Jour férié → 0
  if (JOURS_FERIES.has(dateStr)) {
    return { total: 0, faf: 0, service: 0, recup: 0, estConge: true, estFerie: true, detail: 'Jour férié' }
  }

  if (!seances || seances.length === 0) {
    return { total: 0, faf: 0, service: 0, recup: 0, estConge: true, estFerie: false, detail: 'Pas de présence' }
  }

  // Si toutes les séances sont de type congé → 0
  const tousConges = seances.every(s => TYPES_CONGE.has(s.type))
  if (tousConges) {
    return { total: 0, faf: 0, service: 0, recup: 0, estConge: true, estFerie: false, detail: 'Congé' }
  }

  // Séparer les récups des autres activités
  const seancesRecup = seances.filter(s => TYPES_RECUP.has(s.type))
  const seancesActives = seances.filter(s => !TYPES_CONGE.has(s.type) && !TYPES_RECUP.has(s.type))

  // Si UNIQUEMENT des récupérations → jour non travaillé (récup = repos compensateur)
  if (seancesActives.length === 0 && seancesRecup.length > 0) {
    const minutesRecup = seancesRecup.reduce((acc, s) => acc + s.duree_minutes, 0)
    return { total: 0, faf: 0, service: 0, recup: minutesRecup, estConge: false, estFerie: false, estRecup: true, detail: 'Récupération' }
  }

  // Durée des récupérations partielles (sur un jour avec aussi du travail)
  const minutesRecupPartielles = seancesRecup.reduce((acc, s) => acc + s.duree_minutes, 0)

  // Déterminer si vendredi
  const d = new Date(dateStr + 'T00:00:00')
  const estVendredi = d.getDay() === 5

  // Déterminer si premier jour de semaine travaillée
  const premierJour = estPremierJourSemaine(dateStr, datesAvecSeances)

  // Horaires contractuels
  const debutContractuel = premierJour ? hm('08:30') : hm('08:10')
  const finContractuelle = estVendredi ? hm('17:00') : hm('17:10')

  // Horaires réels iRéo (sur les séances actives seulement)
  const toutesSeances = [...seancesActives, ...seancesRecup]
  const debutIreo = Math.min(...toutesSeances.map(s => hm(s.heure_debut)))
  const finIreo   = Math.max(...toutesSeances.map(s => hm(s.heure_fin)))

  // Début et fin effectifs
  const debut = Math.min(debutContractuel, debutIreo)
  const fin   = Math.max(finContractuelle, finIreo)

  // Pause déjeuner : 1h si aucune séance entre 12h00 et 13h00
  const aMidi = toutesSeances.some(s => hm(s.heure_debut) < hm('13:00') && hm(s.heure_fin) > hm('12:00'))
  const pauseDej = aMidi ? 0 : 60

  // Total = plage horaire - pause déj - récupérations partielles
  const totalBrut = fin - debut - pauseDej - minutesRecupPartielles

  // FAF = heures de cours/ccf/jury
  const minutesFaf = seancesActives
    .filter(s => TYPES_FAF.has(s.type))
    .reduce((acc, s) => acc + s.duree_minutes, 0)

  // Service = tout le reste (hors recup et congé)
  const minutesService = seancesActives
    .filter(s => !TYPES_FAF.has(s.type))
    .reduce((acc, s) => acc + s.duree_minutes, 0)

  return {
    total: Math.max(0, totalBrut),
    faf: minutesFaf,
    service: minutesService,
    recup: minutesRecupPartielles,
    estConge: false,
    estFerie: false,
    estRecup: false,
    debut: minutesEnHeures(debut),
    fin: minutesEnHeures(fin),
    pauseDej: pauseDej > 0,
    premierJour,
    detail: `${minutesEnHeures(debut)}→${minutesEnHeures(fin)}${pauseDej ? ' -1h déj' : ''}${minutesRecupPartielles > 0 ? ' -' + minutesEnHeures(minutesRecupPartielles) + ' récup' : ''}`
  }
}

export function calculerPeriode(seancesParDate) {
  const datesAvecSeances = new Set(seancesParDate.keys())

  let totalMinutes   = 0
  let fafMinutes     = 0
  let serviceMinutes = 0
  let recupMinutes   = 0
  let joursTravailes = 0
  let joursRecup     = 0
  let joursConge     = 0
  const parSemaine = {}
  const parJour = {}

  for (const [dateStr, seances] of seancesParDate) {
    const r = calculerHeuresJour(seances, dateStr, datesAvecSeances)
    parJour[dateStr] = r

    if (r.estConge || r.estFerie) {
      joursConge++
    } else if (r.estRecup) {
      joursRecup++
      recupMinutes += r.recup
    } else if (r.total > 0) {
      totalMinutes   += r.total
      fafMinutes     += r.faf
      serviceMinutes += r.service
      recupMinutes   += r.recup
      joursTravailes++

      const semaine = getSemaineISO(dateStr)
      if (!parSemaine[semaine]) parSemaine[semaine] = { total: 0, faf: 0, service: 0 }
      parSemaine[semaine].total   += r.total
      parSemaine[semaine].faf     += r.faf
      parSemaine[semaine].service += r.service
    }
  }

  const ratioFaf = totalMinutes > 0 ? Math.round((fafMinutes / totalMinutes) * 1000) / 10 : 0

  return {
    total_minutes:    totalMinutes,
    faf_minutes:      fafMinutes,
    service_minutes:  serviceMinutes,
    recup_minutes:    recupMinutes,
    total_heures:     minutesEnHeures(totalMinutes),
    faf_heures:       minutesEnHeures(fafMinutes),
    service_heures:   minutesEnHeures(serviceMinutes),
    recup_heures:     minutesEnHeures(recupMinutes),
    ratio_faf:        ratioFaf,
    jours_travailles: joursTravailes,
    jours_recup:      joursRecup,
    jours_conge:      joursConge,
    par_semaine: Object.entries(parSemaine).map(([s, v]) => ({
      semaine: s,
      total:   minutesEnHeures(v.total),
      faf:     minutesEnHeures(v.faf),
      service: minutesEnHeures(v.service),
      total_minutes: v.total,
    })).sort((a, b) => a.semaine.localeCompare(b.semaine)),
    par_jour: parJour,
  }
}

function getSemaineISO(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const startOfWeek = new Date(jan4)
  startOfWeek.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const diff = d - startOfWeek
  const week = Math.floor(diff / (7 * 24 * 3600 * 1000)) + 1
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}
