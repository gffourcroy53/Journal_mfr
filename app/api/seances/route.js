import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)

    const filtre = {}
    if (searchParams.get('date'))   filtre.date   = searchParams.get('date')
    if (searchParams.get('classe')) filtre.classe = searchParams.get('classe')
    if (searchParams.get('type'))   filtre.type   = searchParams.get('type')
    if (searchParams.get('statut')) filtre.statut = searchParams.get('statut')
    if (searchParams.get('module')) filtre.module = searchParams.get('module')

    if (searchParams.get('du') || searchParams.get('au')) {
      filtre.date = {}
      if (searchParams.get('du')) filtre.date.$gte = searchParams.get('du')
      if (searchParams.get('au')) filtre.date.$lte = searchParams.get('au')
    }

    const seances = await Seance
      .find(filtre)
      .sort({ date: 1, heure_debut: 1 })

    return NextResponse.json({ success: true, data: seances })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()

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
