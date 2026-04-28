import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { apiClient } from '@/api/client'

type SourceOption = { id: number; name: string; unit: string; scope: number; category: string }
type EntityOption = { id: number; name: string }
type ActivityRow = { id: number; source_id: number; entity_id: number; period_start: string; period_end: string; quantity: number; unit: string; data_quality: string; notes?: string | null; created_at: string }
type SurveyRow = { id: number; user_id: number | null; transport_mode: string; distance_km: number; trips_per_week: number; period_start: string; period_end: string; created_at: string }

interface ActivityForm {
  source_id: string
  entity_id: string
  period_start: string
  period_end: string
  quantity: number
  unit: string
  data_quality: 'MEASURED' | 'EXTRAPOLATED' | 'SURVEY' | 'ESTIMATED'
  notes?: string
}

interface SurveyForm {
  user_id: number
  transport_mode: string
  distance_km: number
  trips_per_week: number
  period_start: string
  period_end: string
}

export default function DataEntryPage() {
  const [tab, setTab] = useState<'energy' | 'mobility'>('energy')
  const [sources, setSources] = useState<SourceOption[]>([])
  const [entities, setEntities] = useState<EntityOption[]>([])
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([])
  const [surveyRows, setSurveyRows] = useState<SurveyRow[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const activityForm = useForm<ActivityForm>({
    defaultValues: { data_quality: 'MEASURED', unit: '' },
  })
  const surveyForm = useForm<SurveyForm>({
    defaultValues: { user_id: 1, transport_mode: 'car', distance_km: 10, trips_per_week: 5, period_start: new Date().toISOString().slice(0, 10), period_end: new Date().toISOString().slice(0, 10) },
  })

  const selectedSourceId = activityForm.watch('source_id')
  const selectedSource = useMemo(() => sources.find((source) => String(source.id) === selectedSourceId), [sources, selectedSourceId])

  useEffect(() => {
    void loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedSource) {
      activityForm.setValue('unit', selectedSource.unit)
    }
  }, [selectedSource])

  const loadInitialData = async () => {
    try {
      const [sourcesRes, entitiesRes, activityRes, surveyRes] = await Promise.all([
        apiClient.get<SourceOption[]>('/data/emission-sources'),
        apiClient.get<EntityOption[]>('/data/entities'),
        apiClient.get<ActivityRow[]>('/data/activity'),
        apiClient.get<SurveyRow[]>('/data/mobility-survey'),
      ])
      setSources(sourcesRes.data)
      setEntities(entitiesRes.data)
      setActivityRows(activityRes.data)
      setSurveyRows(surveyRes.data)
    } catch {
      setSources([])
      setEntities([])
    }
  }

  const submitActivity = async (values: ActivityForm) => {
    setMessage(null)
    await apiClient.post('/data/activity', {
      ...values,
      source_id: Number(values.source_id),
      entity_id: Number(values.entity_id),
      quantity: Number(values.quantity),
    })
    activityForm.reset({ ...values, quantity: 0, notes: '' })
    await loadInitialData()
    setMessage('Donnée énergétique enregistrée avec succès.')
  }

  const submitSurvey = async (values: SurveyForm) => {
    setMessage(null)
    await apiClient.post('/data/mobility-survey', {
      ...values,
      user_id: Number(values.user_id),
      distance_km: Number(values.distance_km),
      trips_per_week: Number(values.trips_per_week),
    })
    await loadInitialData()
    setMessage('Enquête de mobilité enregistrée avec succès.')
  }

  const deleteActivity = async (id: number) => {
    await apiClient.delete(`/data/activity/${id}`)
    await loadInitialData()
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-5">
        <h2 className="text-3xl font-black text-white">Saisie de données</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">Enregistrez les consommations énergétiques et les enquêtes mobilité pour alimenter le calcul carbone automatique.</p>
      </section>

      {message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-emerald-200">{message}</div> : null}

      <div className="flex gap-3">
        <button onClick={() => setTab('energy')} className={`rounded-2xl px-5 py-3 text-sm font-semibold ${tab === 'energy' ? 'bg-brand-500 text-slate-950' : 'border border-white/10 bg-white/5 text-white'}`}>Données énergétiques</button>
        <button onClick={() => setTab('mobility')} className={`rounded-2xl px-5 py-3 text-sm font-semibold ${tab === 'mobility' ? 'bg-brand-500 text-slate-950' : 'border border-white/10 bg-white/5 text-white'}`}>Enquête de mobilité</button>
      </div>

      {tab === 'energy' ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={activityForm.handleSubmit(submitActivity)} className="glass-panel space-y-4 rounded-[28px] border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white">Nouvelle donnée énergétique</h3>
            <select {...activityForm.register('source_id')} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none">
              <option value="">Source d'émission</option>
              {sources.map((source) => <option key={source.id} value={source.id}>{source.name} ({source.unit})</option>)}
            </select>
            <select {...activityForm.register('entity_id')} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none">
              <option value="">Entité</option>
              {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="date" {...activityForm.register('period_start')} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />
              <input type="date" {...activityForm.register('period_end')} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1.1fr_0.6fr]">
              <input type="number" step="0.01" {...activityForm.register('quantity', { valueAsNumber: true })} placeholder="Quantité" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />
              <input {...activityForm.register('unit')} placeholder="Unité" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['MEASURED', 'EXTRAPOLATED', 'SURVEY', 'ESTIMATED'] as const).map((quality) => (
                <label key={quality} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                  <input type="radio" value={quality} {...activityForm.register('data_quality')} />
                  {quality}
                </label>
              ))}
            </div>
            <textarea {...activityForm.register('notes')} placeholder="Notes" rows={4} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />
            <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-brand-500 to-teal-400 px-4 py-3 font-semibold text-slate-950">Enregistrer</button>
          </form>

          <div className="glass-panel rounded-[28px] border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white">Dernières entrées</h3>
            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-3 pr-4">Période</th>
                    <th className="py-3 pr-4">Entité</th>
                    <th className="py-3 pr-4">Qté</th>
                    <th className="py-3 pr-4">Qualité</th>
                    <th className="py-3 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activityRows.map((row) => (
                    <tr key={row.id} className="border-t border-white/8">
                      <td className="py-3 pr-4">{row.period_start} → {row.period_end}</td>
                      <td className="py-3 pr-4">#{row.entity_id}</td>
                      <td className="py-3 pr-4">{row.quantity} {row.unit}</td>
                      <td className="py-3 pr-4">{row.data_quality}</td>
                      <td className="py-3 pr-4">
                        <button type="button" onClick={() => deleteActivity(row.id)} className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={surveyForm.handleSubmit(submitSurvey)} className="glass-panel space-y-4 rounded-[28px] border border-white/10 p-6">
            <h3 className="text-xl font-semibold text-white">Enquête mobilité</h3>
            <select {...surveyForm.register('user_id', { valueAsNumber: true })} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none">
              <option value={1}>Compte utilisateur #1</option>
              <option value={2}>Compte utilisateur #2</option>
            </select>
            <select {...surveyForm.register('transport_mode')} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none">
              <option value="car">Voiture</option>
              <option value="bus">Bus</option>
              <option value="train_metro">Train / Métro</option>
              <option value="carpool">Covoiturage</option>
              <option value="bicycle">Vélo</option>
              <option value="walking">Marche</option>
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="number" step="0.1" {...surveyForm.register('distance_km', { valueAsNumber: true })} placeholder="Distance aller simple" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />
              <input type="number" {...surveyForm.register('trips_per_week', { valueAsNumber: true })} placeholder="Trajets / semaine" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="date" {...surveyForm.register('period_start')} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />
              <input type="date" {...surveyForm.register('period_end')} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none" />
            </div>
            <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-brand-500 to-teal-400 px-4 py-3 font-semibold text-slate-950">Soumettre ma réponse</button>
          </form>

          <div className="space-y-6">
            <div className="glass-panel rounded-[28px] border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white">Résumé des enquêtes</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Total</div>
                  <div className="mt-3 text-2xl font-bold text-white">{surveyRows.length}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">KM</div>
                  <div className="mt-3 text-2xl font-bold text-white">{surveyRows.reduce((sum, row) => sum + row.distance_km, 0).toFixed(1)}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Trajets</div>
                  <div className="mt-3 text-2xl font-bold text-white">{surveyRows.reduce((sum, row) => sum + row.trips_per_week, 0)}</div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[28px] border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white">Réponses récentes</h3>
              <div className="mt-4 space-y-3">
                {surveyRows.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    <div className="font-semibold text-white">{row.transport_mode}</div>
                    <div className="text-slate-400">{row.distance_km} km, {row.trips_per_week} trajets/semaine</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
