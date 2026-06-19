import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'

// Règles de reclassification des séances "Autre"
const REGLES = [
  // Classe + type basés sur la matière
  { match: /TPE|Travaux pratiques encadrés/i,          classe: null, type: 'service' },
  { match: /Evaluation Examen|Évaluation Examen/i,     classe: 'Jury', type: 'ccf' },
  { match: /C\.5 Maintenance|Maintenance/i,            classe: 'BP CMA', type: 'cours' },
  { match: /accompagnement/i,                          classe: null, type: 'cours' },
  { match: /Serv.*Midi|Serv.*Matin/i,                  classe: 'Service', type: 'service' },
  { match: /Serv.*Soir|Serv.*Veillées/i,               classe: 'Service', type: 'service' },
  { match: /Récupération/i,                            classe: 'Récupération', type: 'recup' },
  { match: /VIE DE GROUPE|Vie de groupe/i,             classe: 'CS PMATMHT', type: 'cours' },
  { match: /BC1|HABITAT LOGEMENT/i,                    classe: 'BTS 1 ESF', type: 'cours' },
  { match: /MP7|SCIENCES ET TECHNOLOGIQUES/i,          classe: 'A.E.1 A', type: 'cours' },
  { match: /BC5|Robotisation/i,                        classe: 'BTS 1 GDEA', type: 'cours' },
  { match: /Réunion|Conseil classe|conseil/i,          classe: 'Réunion', type: 'reunion' },
  { match: /Intervention Externe|JURY MONTAUBAN/i,     classe: 'Intervention Externe', type: 'jury' },
  { match: /Correction|Corrections/i,                  classe: 'Service', type: 'service' },
  { match: /relecture|rangement|Préparation/i,         classe: 'Service', type: 'service' },
  { match: /points? titre|mémoires/i,                  classe: 'Service', type: 'service' },
  { match: /Trajet/i,                                  classe: 'Service', type: 'service' },
]

export async function POST() {
  try {
    await connectDB()
    const seances = await Seance.find({ classe: 'Autre' })

    let corriges = 0
    let ignores = 0

    for (const s of seances) {
      const matiere = s.matiere || ''
      let updated = false

      for (const regle of REGLES) {
        if (regle.match.test(matiere)) {
          const update = { type: regle.type }
          if (regle.classe) update.classe = regle.classe
          // Pour TPE et accompagnement, on garde la classe existante (déjà Autre)
          // mais on tente d'extraire depuis la matière
          if (!regle.classe) {
            // Extraire la classe depuis la matière si possible
            const classeMatch = matiere.match(/(SAPAT\s*\d?|BTS\s*\d?\s*\w+|A\.E\.\s*\d|AE\s*\d|BP\s*CMA|CS\s*PMATMHT|CTCA|Sec\s*\w+)/i)
            if (classeMatch) update.classe = classeMatch[1].trim()
            else update.classe = 'Service'
          }
          await Seance.findByIdAndUpdate(s._id, { $set: update })
          corriges++
          updated = true
          break
        }
      }
      if (!updated) ignores++
    }

    return NextResponse.json({ success: true, corriges, ignores })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
