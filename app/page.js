import AppLayout from '@/components/layout/AppLayout'
import { MetricCard, SeancesJour, HeuresChart } from '@/components/dashboard/index'

async function getDashboardData() {
  const today = new Date().toISOString().split('T')[0]
  const debutAnnee = '2025-09-01'

  try {
    const [statsRes, seancesRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_URL}/api/stats?du=${debutAnnee}&au=${today}`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_URL}/api/seances?date=${today}`, { cache: 'no-store' }),
    ])
    const stats   = statsRes.ok   ? (await statsRes.json()).data   : null
    const seances = seancesRes.ok ? (await seancesRes.json()).data : []
    return { stats, seances, today }
  } catch {
    return { stats: null, seances: [], today }
  }
}

export default async function Dashboard() {
  const { stats, seances, today } = await getDashboardData()
  const ratioWarn  = stats?.ratio_faf > 40
  const ratioAlert = stats?.ratio_faf > 42

  return (
    <AppLayout>
      {ratioWarn && (
        <div className="alert-banner">
          ⚠️ Ratio face-à-face : {stats.ratio_faf} % — plafond 42 % (en vigueur sept. 2027)
        </div>
      )}
      <div className="metric-grid">
        <MetricCard label="Heures totales (année)"  value={stats?.total_heures ?? '—'} sub="depuis sept. 2025" />
        <MetricCard label="Face-à-face / total"     value={stats ? `${stats.ratio_faf} %` : '—'} sub="plafond 42 %" variant={ratioAlert ? 'alert' : ratioWarn ? 'warn' : 'ok'} />
        <MetricCard label="Séances saisies"          value={stats?.seances_saisies ?? '—'} sub={`sur ${stats?.seances_total ?? '?'} au total`} variant="ok" />
        <MetricCard label="À compléter"              value={stats?.seances_a_completer ?? '—'} sub="séances sans contenu" variant={stats?.seances_a_completer > 0 ? 'warn' : 'ok'} />
      </div>
      <div className="two-col">
        <SeancesJour seances={seances} date={today} />
        <HeuresChart data={stats?.par_classe ?? []} />
      </div>
    </AppLayout>
  )
}
