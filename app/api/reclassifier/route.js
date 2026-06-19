import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'

// Règles de reclassification des séances classe=Service non institutionnelles
const REGLES_SERVICE = [
  // Vrais services institutionnels → on garde
  { match: /Serv\s*:|Services?\s*(matin|midi|soir|veillées|veillee)/i, garder: true },
  { match: /^Service (soir|veillées|matin|midi|veillee)/i, garder: true },
  { match: /surveillance/i, garder: true },

  // Évaluation examen → ccf, classe Jury
  { match: /Évaluation|Evaluation|Examen/i, classe: 'Jury', type: 'ccf' },

  // Préparation → préparation
  { match: /Préparation|Preparation|prépa/i, classe: 'Préparation', type: 'service' },
  { match: /Courses|rangement|Rangement/i, classe: 'Préparation', type: 'service' },

  // Réservé visites → Visite de stage
  { match: /Réservé visite|réservé visite/i, classe: 'Visite de stage', type: 'service' },

  // Corrections → Correction
  { match: /Correction|correction/i, classe: 'Correction', type: 'service' },

  // CAP MFR → Formation externe
  { match: /CAP MFR/i, classe: 'Formation externe', type: 'service' },

  // Forum → Forum
  { match: /Forum/i, classe: 'Forum', type: 'service' },

  // Trajet réunion → Intervention externe
  { match: /Trajet/i, classe: 'Intervention Externe', type: 'service' },

  // Seconde MFR → Accompagnement
  { match: /Seconde MFR|Seconde mfr/i, classe: 'Accompagnement', type: 'service' },

  // RDV médical → Récupération
  { match: /RDV médical|RDV medical|médical|Rendez-médical|Rendez.médical/i, classe: 'Récupération', type: 'recup' },

  // Retours tracteurs, Livraison GNR → Préparation
  { match: /Retours|Livraison/i, classe: 'Préparation', type: 'service' },

  // Point mémoires, relecture → Correction
  { match: /Point mémoires|relecture|Point correction|mémoires|Correction mémoires/i, classe: 'Correction', type: 'service' },

  // Sortie CS → Accompagnement
  { match: /Sortie CS/i, classe: 'Accompagnement', type: 'service' },

  // Présentation kit → Préparation
  { match: /Présentation kit|Presentation kit/i, classe: 'Préparation', type: 'service' },

  // Service externe → Intervention Externe
  { match: /Service externe/i, classe: 'Intervention Externe', type: 'service' },

  // Services veillées / soir (format long) → garder Service
  { match: /Services (veillées|soir|matin|veillee)/i, garder: true },
]

// POST /api/reclassifier — reclassifie les séances mal typées
export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json().catch(() => ({}))
    const cible = body.classe || 'Service'

    const seances = await Seance.find({ classe: cible })

    let corriges = 0
    let gardes = 0
    let ignores = 0

    for (const s of seances) {
      const matiere = s.matiere || ''
      let traite = false

      for (const regle of REGLES_SERVICE) {
        if (regle.match.test(matiere)) {
          if (regle.garder) {
            gardes++
          } else {
            await Seance.findByIdAndUpdate(s._id, {
              $set: { classe: regle.classe, type: regle.type }
            })
            corriges++
          }
          traite = true
          break
        }
      }
      if (!traite) ignores++
    }

    return NextResponse.json({ success: true, corriges, gardes, ignores })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
