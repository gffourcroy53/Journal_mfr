import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'
import Previsionnel from '@/models/Previsionnel'
import { calculerPeriode, minutesEnHeures } from '@/lib/calcul-heures'
import { heuresParClasse, heuresParType, ecartPrevisionnelRealise } from '@/lib/utils'

// GET /api/stats?du=2025-09-01&au=2026-06-30&classe=BTS 1 GDEA
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

    const seances = await Seance.find(filtre).sort({ date: 1, heure_debut: 1 })
    const previsionnel = await Previsionnel.find(filtre)

    // Grouper les séances par date pour le moteur de calcul
    const seancesParDate = new Map()
    for (const s of seances) {
      if (!seancesParDate.has(s.date)) seancesParDate.set(s.date, [])
      seancesParDate.get(s.date).push(s)
    }

    // Calcul heures avec règles contractuelles
    const calcul = calculerPeriode(seancesParDate)

    // Stats complémentaires
    const saisies     = seances.filter(s => s.statut === 'saisi').length
    const aCompleter  = seances.filter(s => s.statut === 'a_completer').length

    return NextResponse.json({
      success: true,
      data: {
        // Heures calculées avec règles contractuelles
        total_minutes:   calcul.total_minutes,
        total_heures:    calcul.total_heures,
        faf_minutes:     calcul.faf_minutes,
        faf_heures:      calcul.faf_heures,
        service_heures:  calcul.service_heures,
        recup_heures:    minutesEnHeures(calcul.recup_minutes),
        ratio_faf:       calcul.ratio_faf,
        jours_travailles: calcul.jours_travailles,
        par_semaine:     calcul.par_semaine,

        // Stats séances
        seances_total:       seances.length,
        seances_saisies:     saisies,
        seances_a_completer: aCompleter,

        // Ventilations
        par_classe: heuresParClasse(seances),
        par_type:   heuresParType(seances),
        ecarts:     ecartPrevisionnelRealise(previsionnel, seances),
      }
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
