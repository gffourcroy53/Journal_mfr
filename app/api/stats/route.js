import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'
import Previsionnel from '@/models/Previsionnel'
import {
  ratioFaceAFace,
  heuresParClasse,
  heuresParType,
  heuresParSemaine,
  ecartPrevisionnelRealise,
  minutesEnHeures
} from '@/lib/utils'

// GET /api/stats?du=2026-09-01&au=2026-06-30&classe=BTS 1 GDEA
export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)

    const filtre = {}
    if (searchParams.get('du') || searchParams.get('au')) {
      filtre.date = {}
      if (searchParams.get('du')) filtre.date.$gte = searchParams.get('du')
      if (searchParams.get('au')) filtre.date.$lte = searchParams.get('au')
    }
    if (searchParams.get('classe')) filtre.classe = searchParams.get('classe')
    if (searchParams.get('type'))   filtre.type   = searchParams.get('type')

    const seances = await Seance.find(filtre)
    const previsionnel = await Previsionnel.find(filtre)

    const totalMinutes = seances.reduce((acc, s) => acc + s.duree_minutes, 0)
    const fafMinutes = seances
      .filter(s => ['cours', 'ccf', 'jury'].includes(s.type))
      .reduce((acc, s) => acc + s.duree_minutes, 0)

    const saisies = seances.filter(s => s.statut === 'saisi').length
    const aCompleter = seances.filter(s => s.statut === 'a_completer').length

    return NextResponse.json({
      success: true,
      data: {
        total_minutes: totalMinutes,
        total_heures: minutesEnHeures(totalMinutes),
        faf_minutes: fafMinutes,
        faf_heures: minutesEnHeures(fafMinutes),
        ratio_faf: ratioFaceAFace(seances),
        seances_total: seances.length,
        seances_saisies: saisies,
        seances_a_completer: aCompleter,
        par_classe: heuresParClasse(seances),
        par_type: heuresParType(seances),
        par_semaine: heuresParSemaine(seances),
        ecarts: ecartPrevisionnelRealise(previsionnel, seances),
      }
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
