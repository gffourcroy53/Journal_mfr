import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'

// GET /api/seances/:id
export async function GET(request, { params }) {
  try {
    await connectDB()
    const seance = await Seance.findById(params.id)
      .populate('documents')
      .populate('travaux')
    if (!seance) return NextResponse.json({ success: false, error: 'Séance introuvable' }, { status: 404 })
    return NextResponse.json({ success: true, data: seance })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// PUT /api/seances/:id — mettre à jour (contenu, statut, documents, travaux...)
export async function PUT(request, { params }) {
  try {
    await connectDB()
    const body = await request.json()

    // Si on passe un contenu → passer automatiquement en "saisi"
    if (body.contenu && body.contenu.trim() !== '') {
      body.statut = 'saisi'
    }

    const seance = await Seance.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate('documents').populate('travaux')

    if (!seance) return NextResponse.json({ success: false, error: 'Séance introuvable' }, { status: 404 })
    return NextResponse.json({ success: true, data: seance })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}

// DELETE /api/seances/:id
export async function DELETE(request, { params }) {
  try {
    await connectDB()
    const seance = await Seance.findByIdAndDelete(params.id)
    if (!seance) return NextResponse.json({ success: false, error: 'Séance introuvable' }, { status: 404 })
    return NextResponse.json({ success: true, message: 'Séance supprimée' })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
