import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'

// GET /api/seances?date=2026-06-17&classe=BTS 1 GDEA&type=cours&statut=a_completer
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)

    const filtre = {}
    if (searchParams.get('date'))    filtre.date    = searchParams.get('date')
    if (searchParams.get('classe'))  filtre.classe  = searchParams.get('classe')
    if (searchParams.get('type'))    filtre.type    = searchParams.get('type')
    if (searchParams.get('statut'))  filtre.statut  = searchParams.get('statut')
    if (searchParams.get('module'))  filtre.module  = searchParams.get('module')

    // Période : ?du=2026-06-01&au=2026-06-30
    if (searchParams.get('du') || searchParams.get('au')) {
      filtre.date = {}
      if (searchParams.get('du')) filtre.date.$gte = searchParams.get('du')
      if (searchParams.get('au')) filtre.date.$lte = searchParams.get('au')
    }

    const seances = await Seance
      .find(filtre)
      .populate('documents', 'titre type fichier_url')
      .populate('travaux', 'titre type statut date_remise')
      .sort({ date: 1, heure_debut: 1 })

    return NextResponse.json({ success: true, data: seances })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// POST /api/seances — créer une séance manuellement
export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()

    // Calcul automatique de la durée si non fournie
    if (!body.duree_minutes && body.heure_debut && body.heure_fin) {
      const [hd, md] = body.heure_debut.split(':').map(Number)
      const [hf, mf] = body.heure_fin.split(':').map(Number)
      body.duree_minutes = (hf * 60 + mf) - (hd * 60 + md)
    }

    const seance = await Seance.create(body)
    return NextResponse.json({ success: true, data: seance }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}
