import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  title: string
  value: number
  unit: string
  change_percentage?: number | null
  changePercentage?: number | null
  trend?: 'up' | 'down' | 'stable'
}

function formatValue(value: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)
}

export default function KpiCard({ title, value, unit, change_percentage, changePercentage, trend = 'stable' }: Props) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const pct = change_percentage ?? changePercentage ?? null

  useEffect(() => {
    const duration = 900
    const start = performance.now()
    let raf = 0

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setAnimatedValue(value * progress)
      if (progress < 1) {
        raf = window.requestAnimationFrame(animate)
      }
    }

    raf = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(raf)
  }, [value])

  const trendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus
  const TrendIcon = trendIcon

  return (
    <div className="group glass-panel rounded-[28px] border border-white/10 p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-brand-400/40 hover:shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{title}</p>
          <div className="mt-4 flex items-end gap-2">
            <div className="text-3xl font-black tracking-tight text-white lg:text-4xl">
              {formatValue(animatedValue)}
            </div>
            <span className="pb-1 text-sm text-slate-400">{unit}</span>
          </div>
        </div>
        <div
          className={clsx(
            'flex h-11 w-11 items-center justify-center rounded-2xl border',
            trend === 'down' && 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
            trend === 'up' && 'border-rose-400/30 bg-rose-500/10 text-rose-300',
            trend === 'stable' && 'border-slate-500/30 bg-slate-500/10 text-slate-300',
          )}
        >
          <TrendIcon className="h-5 w-5" />
        </div>
      </div>

      {pct !== undefined && pct !== null ? (
        <div className="mt-4 text-sm text-slate-300">
          <span
            className={clsx(
              'font-semibold',
              pct < 0 ? 'text-emerald-300' : pct > 0 ? 'text-rose-300' : 'text-slate-300',
            )}
          >
            {pct > 0 ? '+' : ''}{pct}%
          </span>
          <span className="ml-2 text-slate-400">depuis la période précédente</span>
        </div>
      ) : null}
    </div>
  )
}
