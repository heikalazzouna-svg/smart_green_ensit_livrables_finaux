import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface Props {
  data: Array<{ month: string; scope1: number; scope2: number; scope3: number }>
}

const SCOPES = [
  { key: 'scope1', label: 'Scope 1 — Émissions directes', color: '#ef4444', desc: 'Gaz, carburants, fuites' },
  { key: 'scope2', label: 'Scope 2 — Énergie', color: '#f59e0b', desc: 'Électricité importée (STEG)' },
  { key: 'scope3', label: 'Scope 3 — Indirectes', color: '#3b82f6', desc: 'Transport domicile-campus' },
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0)
  return (
    <div className="rounded-2xl border border-white/15 bg-slate-950/95 px-4 py-3 shadow-xl backdrop-blur-md">
      <p className="mb-2 text-sm font-semibold text-white">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-300">{entry.name}</span>
          </div>
          <span className="font-semibold text-white">{entry.value.toFixed(3)}</span>
        </div>
      ))}
      <div className="mt-2 border-t border-white/10 pt-2 text-right text-sm font-bold text-brand-200">
        Total: {total.toFixed(3)} tCO2e
      </div>
    </div>
  )
}

export default function EmissionsChart({ data }: Props) {
  return (
    <div className="glass-panel rounded-[28px] border border-white/10 p-4 lg:p-6">
      <div className="mb-2">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Évolution temporelle</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Émissions mensuelles</h2>
      </div>

      {/* Custom legend */}
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
        {SCOPES.map((scope) => (
          <div key={scope.key} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full shadow-sm" style={{ background: scope.color }} />
            <span className="text-xs font-medium text-slate-200">{scope.label}</span>
          </div>
        ))}
      </div>

      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="gradScope1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="gradScope2" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="gradScope3" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.10)" />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(v: string) => { const [y, m] = v.split('-'); return `${m}/${y.slice(2)}` }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => v.toFixed(1)} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="scope3" name="Scope 3" stackId="emissions" stroke="#3b82f6" fill="url(#gradScope3)" strokeWidth={2} />
            <Area type="monotone" dataKey="scope2" name="Scope 2" stackId="emissions" stroke="#f59e0b" fill="url(#gradScope2)" strokeWidth={2} />
            <Area type="monotone" dataKey="scope1" name="Scope 1" stackId="emissions" stroke="#ef4444" fill="url(#gradScope1)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Scope descriptions */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {SCOPES.map((scope) => (
          <div key={scope.key} className="rounded-xl bg-white/[0.03] px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: scope.color }} />
              <span className="text-[11px] font-semibold text-slate-300">Scope {scope.key.slice(-1)}</span>
            </div>
            <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{scope.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
