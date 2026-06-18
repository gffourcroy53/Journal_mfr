import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Document from '@/models/Document'

// GET /api/documents?module=BC5&classe=BTS 1 GDEA&type=fiche_tp
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const filtre = {}
    if (searchParams.get('module')) filtre.module = searchParams.get('module')
    if (searchParams.get('type'))   filtre.type   = searchParams.get('type')
    if (searchParams.get('classe')) filtre.classes = searchParams.get('classe')
    if (searchParams.get('tag'))    filtre.tags   = searchParams.get('tag')

    const docs = await Document.find(filtre).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, data: docs })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// POST /api/documents
export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const doc = await Document.create(body)
    return NextResponse.json({ success: true, data: doc }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 })
  }
}
