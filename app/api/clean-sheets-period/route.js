import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'

// DELETE /api/clean-sheets-period?du=2025-09-01&au=2025-12-31
// Supprime les séances source=sheets sur une période donnée (remplacées par planning)
export async function DELETE(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const du = searchParams.get('du')
    const au = searchParams.get('au')
    if (!du || !au) {
      return NextResponse.json({ success: false, error: 'du et au requis' }, { status: 400 })
    }
    const result = await Seance.deleteMany({ source: 'sheets', date: { $gte: du, $lte: au } })
    return NextResponse.json({ success: true, deleted: result.deletedCount })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
