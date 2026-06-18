import { NextResponse } from 'next/server'
import { importerIreo, importerAujourdhui } from '@/lib/ireo'

// POST /api/ireo
// body: { date: "2026-06-17" }     → importe une date précise
// body: { depuis: "2025-08-18" }   → importe tout depuis cette date
// body: {}                          → importe aujourd'hui
// body: { tout: true }              → importe tout le flux
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))

    let resultats
    if (body.tout || body.depuis) {
      resultats = await importerIreo(null, body.depuis || null)
    } else if (body.date) {
      resultats = await importerIreo(body.date)
    } else {
      resultats = await importerAujourdhui()
    }

    return NextResponse.json({ success: true, ...resultats })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
