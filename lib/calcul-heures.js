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

// Types congé/récup → jour non travaillé ou déduction
const TYPES_CONGE = new Set(['conge', 'congé', 'ferie', 'férié'])
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
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

// Détermine si c'est le premier jour travaillé de la semaine
// en regardant si des jours précédents de la même semaine ont des séances
function estPremierJourSemaine(dateStr, datesAvecSeances) {
  const d = new Date(dateStr + 'T00:00:00')
  const jourSemaine = d.getDay() // 0=dim, 1=lun, ..., 6=sam
  // Jours précédents dans la même semaine ISO (lun=1 à sam=6)
  for (let j = 1; j < jourSemaine; j++) {
    const prev = new Date(d)
    prev.setDate(d.getDate() - (jourSemaine - j))
    const prevStr = prev.toISOString().split('T')[0]
    if (datesAvecSeances.has(prevStr)) return false
  }
  return true
}

// Calcule les heures d'une journée
// seances : tableau de séances du jour (triées par heure_debut)
// dateStr : "YYYY-MM-DD"
// datesAvecSeances : Set de toutes les dates qui ont des séances (pour détecter premier jour semaine)
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

  // Filtrer les congés pour le calcul
  const seancesActives = seances.filter(s => !TYPES_CONGE.has(s.type))

  // Récupérations
  const minutesRecup = seancesActives
    .filter(s => TYPES_RECUP.has(s.type))
    .reduce((acc, s) => acc + s.duree_minutes, 0)

  // Déterminer si vendredi
  const d = new Date(dateStr + 'T00:00:00')
  const estVendredi = d.getDay() === 5

  // Déterminer si premier jour de semaine travaillée
  const premierJour = estPremierJourSemaine(dateStr, datesAvecSeances)

  // Horaires contractuels
  const debutContractuel = premierJour ? hm('08:30') : hm('08:10')
  const finContractuelle = estVendredi ? hm('17:00') : hm('17:10')

  // Horaires réels iRéo
  const debutIreo = Math.min(...seancesActives.map(s => hm(s.heure_debut)))
  const finIreo   = Math.max(...seancesActives.map(s => hm(s.heure_fin)))

  // Début et fin effectifs
  const debut = Math.min(debutContractuel, debutIreo)
  const fin   = Math.max(finContractuelle, finIreo)

  // Pause déjeuner : 1h si aucune séance entre 12h00 et 13h00
  const aMidiMoins = seancesActives.some(s => hm(s.heure_debut) < hm('13:00') && hm(s.heure_fin) > hm('12:00'))
  const pauseDej = aMidiMoins ? 0 : 60

  // Total brut
  const totalBrut = fin - debut - pauseDej - minutesRecup

  // Calcul FAF et service
  const minutesFaf = seancesActives
    .filter(s => TYPES_FAF.has(s.type))
    .reduce((acc, s) => acc + s.duree_minutes, 0)

  const minutesService = seancesActives
    .filter(s => !TYPES_FAF.has(s.type) && !TYPES_RECUP.has(s.type))
    .reduce((acc, s) => acc + s.duree_minutes, 0)

  return {
    total: Math.max(0, totalBrut),
    faf: minutesFaf,
    service: minutesService,
    recup: minutesRecup,
    estConge: false,
    estFerie: false,
    debut: minutesEnHeures(debut - hm('00:00')),
    fin: minutesEnHeures(fin - hm('00:00')),
    pauseDej: pauseDej > 0,
    premierJour,
    detail: `${minutesEnHeures(debut)}→${minutesEnHeures(fin)}${pauseDej ? ' -1h déj' : ''}`
  }
}

// Calcule les heures sur une période complète
// seancesParDate : Map { "YYYY-MM-DD" => [séances] }
export function calculerPeriode(seancesParDate) {
  const datesAvecSeances = new Set(seancesParDate.keys())
  
  let totalMinutes = 0
  let fafMinutes   = 0
  let serviceMinutes = 0
  let recupMinutes = 0
  let joursTravailes = 0
  const parSemaine = {}
  const parJour = {}

  for (const [dateStr, seances] of seancesParDate) {
    const r = calculerHeuresJour(seances, dateStr, datesAvecSeances)
    parJour[dateStr] = r

    if (!r.estConge && !r.estFerie && r.total > 0) {
      totalMinutes   += r.total
      fafMinutes     += r.faf
      serviceMinutes += r.service
      recupMinutes   += r.recup
      joursTravailes++

      // Regroupement par semaine ISO
      const semaine = getSemaineISO(dateStr)
      if (!parSemaine[semaine]) parSemaine[semaine] = { total: 0, faf: 0, service: 0 }
      parSemaine[semaine].total   += r.total
      parSemaine[semaine].faf     += r.faf
      parSemaine[semaine].service += r.service
    }
  }

  const ratioFaf = totalMinutes > 0 ? Math.round((fafMinutes / totalMinutes) * 1000) / 10 : 0

  return {
    total_minutes:   totalMinutes,
    faf_minutes:     fafMinutes,
    service_minutes: serviceMinutes,
    recup_minutes:   recupMinutes,
    total_heures:    minutesEnHeures(totalMinutes),
    faf_heures:      minutesEnHeures(fafMinutes),
    service_heures:  minutesEnHeures(serviceMinutes),
    ratio_faf:       ratioFaf,
    jours_travailles: joursTravailes,
    par_semaine:     Object.entries(parSemaine).map(([s, v]) => ({
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
