// scripts/import-sheets.mjs
// Usage : node scripts/import-sheets.mjs
// Importe toutes les séances du Google Sheets journal dans MongoDB

import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) throw new Error('MONGODB_URI manquant dans .env.local')

// Schéma Seance simplifié pour le script
const SeanceSchema = new mongoose.Schema({
  date: String,
  heure_debut: String,
  heure_fin: String,
  duree_minutes: Number,
  classe: String,
  module: String,
  matiere: String,
  type: String,
  contenu: String,
  source: String,
  statut: String,
  ireo_uid: String,
}, { timestamps: true })

// Données extraites du Google Sheets (format DD/MM/YYYY)
const SEANCES_SHEETS = [
  ["09/06/2026","08:30","09:45","BTS 1 ESF","","BTS 1 ESF — BC1 Habitat Logement"],
  ["09/06/2026","13:10","17:00","BP CMA","","BP CMA — C.5 Maintenance (ETA Prud'homme)"],
  ["08/06/2026","13:10","15:15","BTS 1 ESF","","BTS 1 ESF — BC1 Habitat Logement"],
  ["03/06/2026","08:30","12:15","CS PMATMHT","","CS PMATMHT — SPE1 Remédiation"],
  ["03/06/2026","13:10","15:15","CS PMATMHT","","CS PMATMHT — Démo désherbage mécanique FD CUMA"],
  ["03/06/2026","15:30","17:00","CS PMATMHT","","CS PMATMHT — Démo désherbage mécanique FD CUMA (suite)"],
  ["01/06/2026","13:10","15:15","CS PMATMHT","","CS PMATMHT / UC1 Révision conduite lignes et séquences de bout de champs"],
  ["01/06/2026","15:30","17:00","BTS 2 GDEA","","BTS 2 GDEA / M55 Révision circuits hydrauliques et électricité triphasé"],
  ["01/06/2026","17:30","19:00","AE2","","A.E. 2 / TPE surveillance étude."],
  ["22/05/2026","14:15","15:15","AE1 A","","AE1 A — Identification des éléments du circuit hydraulique du semoir espro 3000"],
  ["21/05/2026","08:30","09:45","BTS 1 GDEA","Commerce","BTS 1 GDEA — Influence de la culture sur la négociation 1"],
  ["20/05/2026","08:30","12:15","BP CMA","","BP CMA — C.5 Maintenance hydraulique et vidéos"],
  ["20/05/2026","13:10","14:10","AE1 A","","AE1 A — MP7 Sciences et technologie des agroéquipements"],
  ["20/05/2026","15:30","17:00","BTS 1 GDEA","Technologie des agroéquipements","BTS 1 GDEA — Bernouli balance de pression"],
  ["20/05/2026","17:30","19:00","SAPAT 1","","SAPAT 1 — 20/05/2026"],
  ["19/05/2026","08:30","12:15","BP CMA","","BP CMA — C.5 Maintenance calculs débits de doses"],
  ["19/05/2026","13:10","17:00","SAPAT 1","","SAPAT 1 — TPE (surveillance CCF)"],
  ["18/05/2026","13:10","15:15","BTS 1 GDEA","Commerce","BTS 1 GDEA — CRM ERP"],
  ["13/05/2026","15:30","16:45","CS PMATMHT","","CS PMATMHT — Bilan de fin de session / Vie de groupe"],
  ["12/05/2026","08:15","09:45","AE1","","AE1 — MP7 Plateforme hydraulique ID System"],
  ["12/05/2026","10:00","12:15","CS PMATMHT","","CS PMATMHT — UC3 Travaux agricoles mécanisés préparation SPE2"],
  ["12/05/2026","15:30","17:00","AE1","","AE1 — MP7 Plateforme hydraulique ID System"],
  ["11/05/2026","09:00","12:30","CS PMATMHT","","CS PMATMHT — Vie de groupe + UC1 / prépa SPE2"],
  ["05/05/2026","13:30","17:00","CS Lait","","CS Lait — Maintenance N1 (moteurs, élec, hydraulique)"],
  ["04/05/2026","08:30","17:00","CTCA","","Titre CTCA — Accompagnement C13/C14"],
  ["30/04/2026","08:30","12:00","CS LAIT Gr.B","","CS LAIT Gr.B — Contrôles avant démarrage"],
  ["30/04/2026","13:10","15:15","CS PMATMHT","","Travail sur fiches SPE2"],
  ["30/04/2026","15:30","16:45","CS PMATMHT","","CS PMATMHT — Vie de groupe / Bilan de fin de session"],
  ["29/04/2026","13:10","15:15","CTCA","Accompagnement","Titre CTCA AXEMA — Accompagnement"],
  ["28/04/2026","08:30","09:45","BTS 2 GDEA","","BTS 2 GDEA — CCF MIL M71"],
  ["28/04/2026","10:00","12:15","BTS 2 GDEA","","BTS 2 GDEA — CCF MIL M71"],
  ["28/04/2026","13:10","15:15","BTS 2 GDEA","","BTS 2 GDEA — CCF MIL M71"],
  ["28/04/2026","15:30","17:00","BTS 2 GDEA","","BTS 2 GDEA — CCF MIL M71"],
  ["27/04/2026","09:00","09:45","CS PMATMHT","","CS PMATMHT — Vie de groupe / Bilan"],
  ["27/04/2026","10:00","11:00","CTCA","","Titre CTCA — Panne complexe JD 530 : relevé d'infos"],
  ["27/04/2026","11:05","12:30","CTCA","","Titre CTCA — Rédaction documents DMS (JD 530)"],
  ["27/04/2026","13:10","15:15","CTCA","","Titre CTCA — Reprise du mémoire"],
  ["27/04/2026","15:30","17:00","CTCA","","Titre CTCA — Rédaction documents DMS (JD 530)"],
  ["24/04/2026","08:30","09:45","BTS 1 GDEA","","BTS 1 GDEA / BC4 Maintenance — Méthodologie SDCHAP"],
  ["24/04/2026","10:00","12:25","CTCA","","CTCA / Rédaction rapports pannes complexes — SDCHAP"],
  ["24/04/2026","13:10","16:45","CTCA","","CTCA / Dédoublement Lely — Organisation maintenance & reporting"],
  ["23/04/2026","13:05","17:10","BTS 2 GDEA","","BTS GDEA / Correction CCF (après-midi)"],
  ["22/04/2026","08:15","09:45","CTCA","C13 – Accompagnement","Accompagnement Lemken — formation animée"],
  ["22/04/2026","09:55","12:10","CTCA","Organisation pédagogique","Réunion — Préparation des cours CTCA"],
  ["22/04/2026","13:10","15:15","BTS 1 GDEA","BC7 – Démonstration","Démonstration machine / matériel"],
  ["22/04/2026","15:30","17:00","CTCA","C13 – Accompagnement","Accompagnement — Préparation journée formation"],
  ["21/04/2026","13:10","15:15","BTS 1 GDEA","BC7 Démonstration","Reprise du positionnement du démonstrateur"],
  ["21/04/2026","15:30","17:00","BTS 1 GDEA","BC7 Démonstration","Préparation de scénarii — démonstration filmée"],
  ["20/04/2026","13:10","15:15","CTCA","S01 — Accueil","Accueil du groupe J1"],
  ["20/04/2026","15:30","17:00","CTCA","S02 — Entretiens","Entretiens individuels J1"],
  ["10/04/2026","08:30","09:45","BTS 2 GDEA","M55 – Technologie des agroéquipements","Automatisation et capteurs — module MIL"],
  ["10/04/2026","13:10","15:15","CS PMATMHT","UC3","Remise à plat administrative et remédiation SPE1"],
  ["10/04/2026","15:30","16:45","CS PMATMHT","Vie de groupe","Interprétation des doses à l'hectare et vie de groupe"],
  ["09/04/2026","08:30","09:45","CS PMATMHT","UC1","Passage de l'épreuve SPE1"],
  ["09/04/2026","10:00","12:15","CS PMATMHT","UC1","Passage de l'épreuve SPE1"],
  ["09/04/2026","13:10","15:15","CS PMATMHT","UC1","Passage de l'épreuve SPE1"],
  ["09/04/2026","15:30","17:00","CS PMATMHT","UC1","Passage de l'épreuve SPE1"],
  ["08/04/2026","08:15","09:45","AE2","MP7","CCF E7.1 — Accompagnement relevé d'informations"],
  ["08/04/2026","10:00","11:00","AE2","MP7","CCF E7.1 — Partie pratique (suite)"],
  ["07/04/2026","09:00","09:45","CS PMATMHT","Vie de groupe","Vie de groupe et bilan épreuve E1"],
  ["07/04/2026","10:00","12:15","CS PMATMHT","UC3","Adventices et traitements phytosanitaires"],
  ["07/04/2026","13:10","15:15","CS PMATMHT","UC3 — Travaux agricoles mécanisés","Gestion des adventices"],
  ["07/04/2026","15:30","17:00","CS PMATMHT","UC3 — Travaux agricoles mécanisés","Gestion des adventices — suite"],
  ["03/04/2026","15:30","16:45","BTS 2 GDEA","Technologie des agroéquipements","Contenu non saisi"],
  ["02/04/2026","08:30","09:45","BTS 2 GDEA","Technologie des agroéquipements","Contenu non saisi"],
  ["02/04/2026","10:00","12:15","BTS 2 GDEA","Technologie des agroéquipements","Contenu non saisi"],
  ["01/04/2026","13:10","14:10","AE2","Sciences et technologiques des agroéquipements","Contenu non saisi"],
  ["01/04/2026","08:30","09:45","BTS 2 GDEA","Module d'initiative locale","Contenu non saisi"],
  ["01/04/2026","10:00","12:15","BTS 2 GDEA","Module d'initiative locale","Contenu non saisi"],
  ["31/03/2026","13:10","14:10","AE2","Sciences et technologiques des agroéquipements","Contenu non saisi"],
  ["31/03/2026","08:30","09:45","BTS 2 GDEA","Module d'initiative locale","Contenu non saisi"],
  ["31/03/2026","14:15","15:15","SAPAT 2","Travaux pratiques encadrés","TPE"],
  ["31/03/2026","15:30","17:00","SAPAT 2","Travaux pratiques encadrés","TPE"],
  ["30/03/2026","15:30","17:00","AE2","Accompagnement","Contenu non saisi"],
  ["30/03/2026","13:10","14:10","Sec P.V.","Accompagnement","Contenu non saisi"],
  ["26/03/2026","10:00","12:15","BP CMA","Maintenance","Contenu non saisi"],
  ["25/03/2026","11:05","12:05","AE1","Sciences et technologiques des agroéquipements","Contenu non saisi"],
  ["25/03/2026","17:30","18:30","AE1","Travaux pratiques encadrés","TPE"],
  ["25/03/2026","18:30","19:00","AE1","Travaux pratiques encadrés","TPE"],
  ["25/03/2026","13:10","15:15","BTS 1 ESF","Sciences physiques et chimiques","Contenu non saisi"],
  ["25/03/2026","15:30","17:00","BTS 1 ESF","Sciences physiques et chimiques","Contenu non saisi"],
  ["25/03/2026","13:10","15:15","BTS 2 ESF","Sciences physiques et chimiques","Contenu non saisi"],
  ["24/03/2026","13:10","14:10","AE1","Sciences et technologiques des agroéquipements","Détails fonctionnels de la pompe à cylindrée variable"],
  ["24/03/2026","08:30","09:45","BTS 1 ESF","Sciences physiques et chimiques","Début de la correction du formatif"],
  ["24/03/2026","08:30","09:45","BTS 2 ESF","Sciences physiques et chimiques","Début de la correction du formatif"],
  ["23/03/2026","10:00","11:00","AE1","Sciences et technologiques des agroéquipements","Travail commun autour de l'autochargeuse"],
  ["23/03/2026","13:10","15:15","BP CMA","Maintenance","Travail sur les blocs et les pompes hydrauliques"],
  ["23/03/2026","15:30","17:00","BTS 1 GDEA","Technologie des agroéquipements","Reprise des basiques de l'électricité"],
  ["23/02/2026","13:10","15:15","BTS 1 GDEA","Commerce","Calcul du DSCR et CAF"],
  ["10/02/2026","08:30","09:45","BTS 1 GDEA","Maintenance","Etude d'une panne hydraulique"],
  ["16/01/2026","10:00","12:20","BTS 1 GDEA","Maintenance","Le diagnostic en mode enquête"],
  ["14/01/2026","10:00","12:15","BTS 1 GDEA","Maintenance","Exercices de schématisation"],
  ["17/12/2025","08:30","09:45","BTS 1 GDEA","Maintenance","Révisions et approfondissement de l'hydrostatique"],
  ["17/12/2025","10:00","12:15","BTS 1 GDEA","Maintenance","TP de câblages de platines électronique"],
  ["09/12/2025","13:10","15:15","BP CMA","Maintenance","Reprise conduite au GPS"],
  ["08/12/2025","09:00","09:45","BP CMA","Maintenance","Relevé d'éléments et schémas"],
  ["08/12/2025","10:00","12:30","BP CMA","Maintenance","Relevé d'éléments et schémas — suite"],
  ["04/12/2025","10:00","12:15","BP CMA","Maintenance","Le centre des distributeurs — remplacement des joints"],
  ["03/12/2025","10:00","12:15","BP CMA","Maintenance","Révisions d'hydraulique"],
  ["03/12/2025","13:10","15:15","BP CMA","Maintenance","ISOBUS"],
  ["01/12/2025","10:00","12:30","BP CMA","Maintenance","Révision formules débit, puissance, pression et schémas"],
  ["28/11/2025","08:15","09:45","AE2","Sciences et technologiques des agroéquipements","Les pompes à cylindrée fixe et à cylindrée variable"],
]

function parseDate(str) {
  // DD/MM/YYYY ou D/M/YYYY
  const parts = str.trim().split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

function detectType(matiere, intitule) {
  const s = (matiere + ' ' + intitule).toLowerCase()
  if (s.includes('ccf') || s.includes('examen') || s.includes('évaluation') || s.includes('evaluation')) return 'ccf'
  if (s.includes('jury')) return 'jury'
  if (s.includes('récup') || s.includes('repos')) return 'recup'
  if (s.includes('veillée') || s.includes('service') || s.includes('soir') || s.includes('surveillance')) return 'service'
  if (s.includes('tpe') || s.includes('travaux pratiques')) return 'service'
  return 'cours'
}

function duree(debut, fin) {
  const [hd, md] = debut.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  return (hf * 60 + mf) - (hd * 60 + md)
}

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: 'journal-formateur' })
  console.log('✓ Connecté à MongoDB')

  const Seance = mongoose.model('Seance', SeanceSchema)

  // Vider les séances existantes importées depuis iRéo (mal parsées)
  const deleted = await Seance.deleteMany({ source: 'ireo' })
  console.log(`✓ ${deleted.deletedCount} séances iRéo supprimées`)

  let ajoutes = 0
  let erreurs = 0

  for (const row of SEANCES_SHEETS) {
    const [dateRaw, debut, fin, classe, module_, intitule] = row
    const date = parseDate(dateRaw)
    if (!date) { erreurs++; continue }

    const dureeMin = duree(debut, fin)
    if (dureeMin <= 0) { erreurs++; continue }

    try {
      await Seance.create({
        date,
        heure_debut: debut,
        heure_fin: fin,
        duree_minutes: dureeMin,
        classe: classe.trim(),
        module: module_.trim(),
        matiere: intitule.trim(),
        type: detectType(module_, intitule),
        contenu: intitule.includes('non saisi') ? '' : intitule.trim(),
        source: 'sheets',
        statut: intitule.includes('non saisi') ? 'a_completer' : 'saisi',
        ireo_uid: '',
      })
      ajoutes++
    } catch (e) {
      console.error(`Erreur ligne ${dateRaw}:`, e.message)
      erreurs++
    }
  }

  console.log(`✓ ${ajoutes} séances importées depuis le Sheets`)
  if (erreurs > 0) console.log(`⚠ ${erreurs} lignes ignorées`)

  await mongoose.disconnect()
  console.log('✓ Terminé')
}

main().catch(console.error)
