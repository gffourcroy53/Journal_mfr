import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'

// DELETE /api/seances/reset — vide toutes les séances (réimport propre)
export async function DELETE() {
  try {
    await connectDB()
    const result = await Seance.deleteMany({})
    return NextResponse.json({ success: true, deleted: result.deletedCount })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
