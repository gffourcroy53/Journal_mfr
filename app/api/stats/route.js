import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Seance from '@/models/Seance'
import Previsionnel from '@/models/Previsionnel'
import { calculerPeriode, preparationImplicite, minutesEnHeures } from '@/lib/calcul-heures'
import { heuresParClasse, heuresParType, ecartPrevisionnelRealise } from '@/lib/utils'

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

    // Grouper par date
    const seancesParDate = new Map()
    for (const s of seances) {
      if (!seancesParDate.has(s.date)) seancesParDate.set(s.date, [])
      seancesParDate.get(s.date).push(s)
    }

    // Calcul heures avec règles contractuelles
    const calcul = calculerPeriode(seancesParDate)

    // Calcul préparation implicite (heures contractuelles sans séances)
    const datesAvecSeances = new Set(seancesParDate.keys())
    let minutesPrepImplicite = 0
    for (const [dateStr, seancesJour] of seancesParDate) {
      minutesPrepImplicite += preparationImplicite(seancesJour, dateStr, datesAvecSeances)
    }

    const saisies    = seances.filter(s => s.statut === 'saisi').length
    const aCompleter = seances.filter(s => s.statut === 'a_completer').length

    // Ventilation par classe enrichie avec préparation implicite
    const parClasse = heuresParClasse(seances)
    // Ajouter la préparation implicite à la classe Préparation si elle existe
    const prepEntry = parClasse.find(c => c.classe === 'Préparation')
    const prepImpliciteHeures = minutesEnHeures(minutesPrepImplicite)
    if (prepEntry) {
      const totalPrepMin = prepEntry.minutes + minutesPrepImplicite
      prepEntry.minutes = totalPrepMin
      prepEntry.heures = minutesEnHeures(totalPrepMin)
    } else if (minutesPrepImplicite > 0) {
      parClasse.push({ classe: 'Préparation (implicite)', minutes: minutesPrepImplicite, heures: prepImpliciteHeures })
    }
    parClasse.sort((a, b) => b.minutes - a.minutes)

    return NextResponse.json({
      success: true,
      data: {
        total_minutes:         calcul.total_minutes,
        total_heures:          calcul.total_heures,
        faf_minutes:           calcul.faf_minutes,
        faf_heures:            calcul.faf_heures,
        service_heures:        calcul.service_heures,
        recup_heures:          calcul.recup_heures,
        ratio_faf:             calcul.ratio_faf,
        jours_travailles:      calcul.jours_travailles,
        prep_implicite_heures: prepImpliciteHeures,
        par_semaine:           calcul.par_semaine,
        seances_total:         seances.length,
        seances_saisies:       saisies,
        seances_a_completer:   aCompleter,
        par_classe:            parClasse,
        par_type:              heuresParType(seances),
        ecarts:                ecartPrevisionnelRealise(previsionnel, seances),
      }
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
