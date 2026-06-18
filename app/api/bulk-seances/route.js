import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'

function dureeMinutes(debut, fin) {
  const [hd, md] = debut.split(':').map(Number)
  const [hf, mf] = fin.split(':').map(Number)
  return (hf * 60 + mf) - (hd * 60 + md)
}

// POST /api/seances/bulk
// body: { seances: [{ date, heure_debut, heure_fin, classe, module, matiere, type, contenu }] }
export async function POST(request) {
  try {
    await connectDB()
    const { seances } = await request.json()

    if (!Array.isArray(seances)) {
      return NextResponse.json({ success: false, error: 'seances doit être un tableau' }, { status: 400 })
    }

    let ajoutes = 0
    let erreurs = 0
    const details = []

    for (const s of seances) {
      try {
        const duree = s.duree_minutes || dureeMinutes(s.heure_debut, s.heure_fin)
        if (duree <= 0) { erreurs++; continue }

        await Seance.create({
          date: s.date,
          heure_debut: s.heure_debut,
          heure_fin: s.heure_fin,
          duree_minutes: duree,
          classe: s.classe || 'Autre',
          module: s.module || '',
          matiere: s.matiere || '',
          type: s.type || 'cours',
          contenu: s.contenu || '',
          source: s.source || 'planning',
          statut: s.statut || 'saisi',
          ireo_uid: '',
        })
        ajoutes++
      } catch (e) {
        erreurs++
        details.push(`${s.date} ${s.heure_debut}: ${e.message}`)
      }
    }

    return NextResponse.json({ success: true, ajoutes, erreurs, details: details.slice(0, 10) })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
