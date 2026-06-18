// Types comptant comme face-à-face
const TYPES_FACE_A_FACE = ['cours', 'ccf', 'jury']

// Convertit des minutes en "Xh YYmin" ou "Xh"
export function minutesEnHeures(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

// Calcule le ratio face-à-face sur le total
export function ratioFaceAFace(seances = []) {
  const total = seances.reduce((acc, s) => acc + s.duree_minutes, 0)
  const faf = seances
    .filter(s => TYPES_FACE_A_FACE.includes(s.type))
    .reduce((acc, s) => acc + s.duree_minutes, 0)
  if (total === 0) return 0
  return Math.round((faf / total) * 1000) / 10 // 1 décimale
}

// Regroupe les heures par classe
export function heuresParClasse(seances = []) {
  const map = {}
  for (const s of seances) {
    if (!map[s.classe]) map[s.classe] = 0
    map[s.classe] += s.duree_minutes
  }
  return Object.entries(map)
    .map(([classe, minutes]) => ({ classe, minutes, heures: minutesEnHeures(minutes) }))
    .sort((a, b) => b.minutes - a.minutes)
}

// Regroupe les heures par type
export function heuresParType(seances = []) {
  const map = {}
  for (const s of seances) {
    if (!map[s.type]) map[s.type] = 0
    map[s.type] += s.duree_minutes
  }
  return Object.entries(map)
    .map(([type, minutes]) => ({ type, minutes, heures: minutesEnHeures(minutes) }))
    .sort((a, b) => b.minutes - a.minutes)
}

// Regroupe les heures par semaine (retourne un tableau trié)
export function heuresParSemaine(seances = []) {
  const map = {}
  for (const s of seances) {
    const semaine = getSemaineISO(s.date)
    if (!map[semaine]) map[semaine] = 0
    map[semaine] += s.duree_minutes
  }
  return Object.entries(map)
    .map(([semaine, minutes]) => ({ semaine, minutes, heures: minutesEnHeures(minutes) }))
    .sort((a, b) => a.semaine.localeCompare(b.semaine))
}

// Retourne le numéro de semaine ISO (ex: "2026-W23")
function getSemaineISO(dateStr) {
  const d = new Date(dateStr)
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const startOfWeek = new Date(jan4)
  startOfWeek.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const diff = d - startOfWeek
  const week = Math.floor(diff / (7 * 24 * 3600 * 1000)) + 1
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

// Calcule les écarts prévisionnel vs réalisé par classe
export function ecartPrevisionnelRealise(previsionnel = [], seances = []) {
  const prevMap = {}
  for (const p of previsionnel) {
    if (!prevMap[p.classe]) prevMap[p.classe] = 0
    prevMap[p.classe] += p.duree_minutes
  }
  const realMap = {}
  for (const s of seances) {
    if (!realMap[s.classe]) realMap[s.classe] = 0
    realMap[s.classe] += s.duree_minutes
  }
  const classes = new Set([...Object.keys(prevMap), ...Object.keys(realMap)])
  return Array.from(classes).map(classe => {
    const prevu = prevMap[classe] || 0
    const realise = realMap[classe] || 0
    const ecart = realise - prevu
    return {
      classe,
      prevu_minutes: prevu,
      realise_minutes: realise,
      ecart_minutes: ecart,
      prevu: minutesEnHeures(prevu),
      realise: minutesEnHeures(realise),
      ecart: (ecart >= 0 ? '+' : '') + minutesEnHeures(Math.abs(ecart)),
    }
  }).sort((a, b) => b.realise_minutes - a.realise_minutes)
}
