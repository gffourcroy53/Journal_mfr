import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Travail from '@/models/Travail'

// GET /api/travaux?classe=BTS 1 GDEA&statut=en_cours&type=devoir_alternance
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const filtre = {}
    if (searchParams.get('classe')) filtre.classe = searchParams.get('classe')
    if (searchParams.get('statut')) filtre.statut = searchParams.get('statut')
    if (searchParams.get('type'))   filtre.type   = searchParams.get('type')
    if (searchParams.get('module')) filtre.module = searchParams.get('module')

    const travaux = await Travail.find(filtre)
      .populate('seance_origine', 'date heure_debut matiere')
      .sort({ date_remise: 1 })

    return NextResponse.json({ success: true, data: travaux })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// POST /api/travaux
export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const travail = await Travail.create(body)
    return NextResponse.json({ success: true, data: travail }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}

// PUT /api/travaux — mise à jour statut (rendu, corrigé)
export async function PUT(request) {
  try {
    await connectDB()
    const { id, ...update } = await request.json()
    const travail = await Travail.findByIdAndUpdate(id, { $set: update }, { new: true })
    if (!travail) return NextResponse.json({ success: false, error: 'Travail introuvable' }, { status: 404 })
    return NextResponse.json({ success: true, data: travail })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}
