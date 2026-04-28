import { useMemo } from 'react'

interface Props {
  data: Array<{ name: string; value: number; color: string }>
}

const SCOPE_TAG: Record<string, string> = {
  'Combustion sur site': 'Scope 1',
  'Carburants - Déplacements pro': 'Scope 1',
  'Émissions fugitives': 'Scope 1',
  'Électricité importée': 'Scope 2',
  'Transport domicile-campus': 'Scope 3',
}

export default function SourceBreakdown({ data }: Props) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data])
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])

  return (
    <div className="glass-panel rounded-[28px] border border-white/10 p-4 lg:p-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Répartition par source</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Sources d'émission</h2>
        <p className="mt-1 text-xs text-slate-500">Total : {total.toFixed(2)} tCO2e</p>
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div key={item.name}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="inline-block h-3 w-3 flex-shrink-0 rounded-sm" style={{ background: item.color }} />
                  <span className="truncate text-sm font-medium text-slate-200">{item.name}</span>
                  {SCOPE_TAG[item.name] ? (
                    <span className="flex-shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      {SCOPE_TAG[item.name]}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-white">{item.value.toFixed(2)}</span>
                  <span className="w-12 text-right text-xs text-slate-400">{pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                    boxShadow: `0 0 12px ${item.color}40`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {data.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">Aucune donnée de source disponible.</div>
      ) : null}
    </div>
  )
}
