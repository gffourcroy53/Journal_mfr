import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'

// POST /api/admin?action=drop-ireo-uid-index
export async function POST(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'drop-ireo-uid-index') {
      try {
        await Seance.collection.dropIndex('ireo_uid_1')
        return NextResponse.json({ success: true, message: 'Index ireo_uid_1 supprimé' })
      } catch (e) {
        // L'index n'existe peut-être pas — pas grave
        return NextResponse.json({ success: true, message: `Index déjà absent : ${e.message}` })
      }
    }

    return NextResponse.json({ success: false, error: 'Action inconnue' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
