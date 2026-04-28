import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Area, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiClient } from '@/api/client'

type SourceOption = { id: number; name: string }
type EntityOption = { id: number; name: string }

interface ScenarioForm {
  name: string
  description?: string
  modifications: Array<{ source_id: number; entity_id: number; percentage_change: number }>
}

export default function SimulationPage() {
  const [sources, setSources] = useState<SourceOption[]>([])
  const [entities, setEntities] = useState<EntityOption[]>([])
  const [scenarioResult, setScenarioResult] = useState<any>(null)
  const [predictionData, setPredictionData] = useState<any[]>([])
  const [predictionMessage, setPredictionMessage] = useState<string | null>(null)
  const [loadingPrediction, setLoadingPrediction] = useState(false)

  const form = useForm<ScenarioForm>({
    defaultValues: {
      name: 'Transition solaire et sobriété',
      description: 'Réduction progressive des consommations de campus',
      modifications: [{ source_id: 0, entity_id: 0, percentage_change: -20 }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'modifications' })

  useEffect(() => {
    void loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const [sourcesRes, entitiesRes] = await Promise.all([
        apiClient.get<SourceOption[]>('/data/emission-sources'),
        apiClient.get<EntityOption[]>('/data/entities'),
      ])
      setSources(sourcesRes.data)
      setEntities(entitiesRes.data)
      if (sourcesRes.data.length > 0 && entitiesRes.data.length > 0) {
        form.setValue('modifications.0.source_id', sourcesRes.data[0].id)
        form.setValue('modifications.0.entity_id', entitiesRes.data[0].id)
      }
    } catch {
      setSources([])
      setEntities([])
    }
  }

  const submitScenario = async (values: ScenarioForm) => {
    const { data } = await apiClient.post('/simulations/scenario', values)
    setScenarioResult(data)
  }

  const runPrediction = async () => {
    setLoadingPrediction(true)
    setPredictionMessage(null)
    try {
      const { data } = await apiClient.get('/simulations/predictions/energy', { params: { months_ahead: 12 } })
      setPredictionData(
        (data as any[]).map((item) => ({
          month: item.month,
          historical: item.is_historical ? item.predicted_tco2e : null,
          forecast: !item.is_historical ? item.predicted_tco2e : null,
          kwh: item.predicted_kwh,
          lower: item.confidence_interval_lower,
          upper: item.confidence_interval_upper,
        })),
      )
    } catch (error: any) {
      setPredictionMessage(error?.response?.data?.detail ?? 'La prédiction nécessite plus de données.')
      setPredictionData([])
    } finally {
      setLoadingPrediction(false)
    }
  }

  const scopeComparison = useMemo(() => {
    if (!scenarioResult) return []
    return [
      { scope: 'Scope 1', baseline: scenarioResult.baseline_scope1, scenario: scenarioResult.scenario_scope1 },
      { scope: 'Scope 2', baseline: scenarioResult.baseline_scope2, scenario: scenarioResult.scenario_scope2 },
      { scope: 'Scope 3', baseline: scenarioResult.baseline_scope3, scenario: scenarioResult.scenario_scope3 },
    ]
  }, [scenarioResult])

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-5">
        <h2 className="text-3xl font-black text-white">Simulation & IA</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">Testez des scénarios de réduction et projetez la consommation électrique pour guider les décisions de transition.</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={form.handleSubmit(submitScenario)} className="glass-panel space-y-4 rounded-[28px] border border-white/10 p-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Créateur de scénario</h3>
            <p className="mt-1 text-sm text-slate-400">Définissez une ou plusieurs modifications par source et entité.</p>
          </div>

          <input {...form.register('name')} placeholder="Nom du scénario" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />
          <textarea {...form.register('description')} rows={3} placeholder="Description" className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <select {...form.register(`modifications.${index}.source_id`, { valueAsNumber: true })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none">
                    {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
                  </select>
                  <select {...form.register(`modifications.${index}.entity_id`, { valueAsNumber: true })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none">
                    {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
                  </select>
                  <input type="number" {...form.register(`modifications.${index}.percentage_change`, { valueAsNumber: true })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[-50, -25, -10, 10, 25].map((value) => (
                    <button key={value} type="button" onClick={() => form.setValue(`modifications.${index}.percentage_change`, value)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">{value > 0 ? '+' : ''}{value}%</button>
                  ))}
                  <button type="button" onClick={() => remove(index)} className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-200">Supprimer</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => append({ source_id: sources[0]?.id ?? 0, entity_id: entities[0]?.id ?? 0, percentage_change: -10 })} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">Ajouter une modification</button>
            <button type="submit" className="flex-1 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-400 px-4 py-3 font-semibold text-slate-950">Lancer la Simulation</button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="glass-panel rounded-[28px] border border-white/10 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Comparaison baseline vs scénario</h3>
                <p className="text-sm text-slate-400">Impact sur les scopes après modifications.</p>
              </div>
            </div>
            {scenarioResult ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Metric title="Baseline" value={scenarioResult.baseline_total_tco2e} unit="tCO2e" />
                  <Metric title="Scénario" value={scenarioResult.scenario_total_tco2e} unit="tCO2e" />
                  <Metric title="Delta" value={scenarioResult.delta_tco2e} unit="tCO2e" accent={scenarioResult.delta_tco2e <= 0 ? 'emerald' : 'rose'} />
                </div>
                <div className="mt-6 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scopeComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                      <XAxis dataKey="scope" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ background: '#08111c', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 18, color: '#fff' }} />
                      <Legend />
                      <Bar dataKey="baseline" name="Baseline" fill="#94a3b8" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="scenario" name="Scénario" fill="#10b981" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">Lancez une simulation pour comparer baseline et scénario.</div>
            )}
          </div>

          <div className="glass-panel rounded-[28px] border border-white/10 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Prédiction de consommation</h3>
                <p className="text-sm text-slate-400">Modèle GradientBoosting avec fallback EMA.</p>
              </div>
              <button type="button" onClick={runPrediction} disabled={loadingPrediction} className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">Prédire la consommation</button>
            </div>

            {predictionMessage ? <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{predictionMessage}</div> : null}

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={predictionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#08111c', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 18, color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="historical" name="Historique tCO2e" stroke="#3b82f6" dot={false} strokeWidth={2.5} />
                  <Line type="monotone" dataKey="forecast" name="Prévision tCO2e" stroke="#10b981" dot={false} strokeWidth={2.5} />
                  <Area type="monotone" dataKey="upper" name="Borne haute" stroke="transparent" fill="rgba(16,185,129,0.08)" />
                  <Area type="monotone" dataKey="lower" name="Borne basse" stroke="transparent" fill="rgba(16,185,129,0.02)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ title, value, unit, accent = 'default' }: { title: string; value: number; unit: string; accent?: 'default' | 'emerald' | 'rose' }) {
  return (
    <div className={`rounded-2xl border border-white/10 p-4 ${accent === 'emerald' ? 'bg-emerald-500/10' : accent === 'rose' ? 'bg-rose-500/10' : 'bg-white/5'}`}>
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</div>
      <div className="mt-3 text-2xl font-black text-white">{value.toFixed(2)}</div>
      <div className="text-xs text-slate-400">{unit}</div>
    </div>
  )
}
