import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/api/client'
import KpiCard from '@/components/dashboard/KpiCard'
import EmissionsChart from '@/components/dashboard/EmissionsChart'
import SourceBreakdown from '@/components/dashboard/SourceBreakdown'

interface DashboardSummary {
  kpi_cards: Array<{ title: string; value: number; unit: string; change_percentage?: number | null; trend: 'up' | 'down' | 'stable' }>
  emissions_timeline: Array<{ month: string; scope1: number; scope2: number; scope3: number }>
  emissions_by_source: Array<{ name: string; value: number; color: string }>
  top_entities: Array<{ rank: number; entity_id: number; entity_name: string; entity_type: string; total_tco2e: number; tco2e_per_m2?: number | null; percentage: number }>
}

interface EntityOption {
  id: number
  name: string
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [entities, setEntities] = useState<EntityOption[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [entityId, setEntityId] = useState<string>('')

  useEffect(() => {
    void loadEntities()
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [year, entityId])

  const loadEntities = async () => {
    try {
      const { data } = await apiClient.get<EntityOption[]>('/data/entities')
      setEntities(data)
    } catch {
      setEntities([])
    }
  }

  const loadSummary = async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.get<DashboardSummary>('/dashboard/summary', {
        params: {
          year,
          entity_id: entityId ? Number(entityId) : undefined,
        },
      })
      setSummary(data)
    } catch {
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const empty = !loading && (!summary || summary.emissions_timeline.length === 0)

  const topEntities = useMemo(() => summary?.top_entities ?? [], [summary])

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-white/5 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-200">Jury dashboard</p>
          <h2 className="mt-2 text-3xl font-black text-white lg:text-4xl">Tableau de bord carbone</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Vue synthétique des émissions, des répartitions par source et des plus gros contributeurs pour guider l'action environnementale du campus.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">
            {Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select value={entityId} onChange={(event) => setEntityId(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">
            <option value="">Toutes les entités</option>
            {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="glass-panel h-36 animate-pulse rounded-[28px] bg-white/5" />
          ))}
        </div>
      ) : null}

      {!loading && summary ? (
        <>
          <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {summary.kpi_cards.map((card) => <KpiCard key={card.title} {...card} />)}
          </section>

          {empty ? (
            <div className="glass-panel rounded-[28px] border border-white/10 p-8 text-center text-slate-300">
              Aucune donnée disponible. Commencez par saisir des données.
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
              <EmissionsChart data={summary.emissions_timeline} />
              <SourceBreakdown data={summary.emissions_by_source} />
            </div>
          )}

          <section className="glass-panel rounded-[28px] border border-white/10 p-4 lg:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Top émetteurs</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Entités les plus émettrices</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Rang</th>
                    <th className="px-4 py-3">Entité</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">tCO2e</th>
                    <th className="px-4 py-3">tCO2e/m²</th>
                    <th className="px-4 py-3">% du total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8 text-slate-200">
                  {topEntities.map((row) => (
                    <tr key={row.entity_id}>
                      <td className="px-4 py-4 font-semibold text-brand-200">#{row.rank}</td>
                      <td className="px-4 py-4">{row.entity_name}</td>
                      <td className="px-4 py-4 text-slate-400">{row.entity_type}</td>
                      <td className="px-4 py-4 font-semibold">{row.total_tco2e.toFixed(2)}</td>
                      <td className="px-4 py-4 text-slate-300">{row.tco2e_per_m2 ? row.tco2e_per_m2.toFixed(4) : '—'}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-teal-400" style={{ width: `${Math.min(row.percentage, 100)}%` }} />
                          </div>
                          <span className="w-14 text-right text-slate-300">{row.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
