import { Outlet, NavLink } from 'react-router-dom'
import { BarChart3, Database, LayoutDashboard, LogOut, Shield, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { to: '/data-entry', label: 'Saisie de Données', icon: Database },
  { to: '/simulation', label: 'Simulation', icon: Sparkles },
]

export default function MainLayout() {
  const { user, isAdmin, logout } = useAuth()

  return (
    <div className="min-h-screen text-slate-100 lg:flex">
      <aside className="glass-panel fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 px-4 py-3 lg:static lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-t-0 lg:px-5 lg:py-6">
        <div className="mb-6 flex items-center gap-3 px-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-slate-950 shadow-glow">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-200">Smart Green</div>
            <div className="text-lg font-bold text-white">ENSIT</div>
          </div>
        </div>

        <nav className="grid grid-cols-3 gap-2 lg:flex lg:flex-col">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all lg:justify-start',
                    isActive
                      ? 'bg-white/10 text-white ring-1 ring-brand-400/40'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </NavLink>
            )
          })}

          {isAdmin ? (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all lg:justify-start',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <Shield className="h-4 w-4" />
              <span className="hidden lg:inline">Administration</span>
            </NavLink>
          ) : null}
        </nav>

        <div className="mt-auto hidden rounded-3xl border border-white/10 bg-white/5 p-4 lg:block">
          <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Session active</div>
          <div className="mt-2 text-sm font-semibold text-white">{user?.full_name}</div>
          <div className="text-xs text-brand-200">{user?.role}</div>
          <button
            type="button"
            onClick={logout}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/15"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pb-24 lg:pb-0">
        <header className="glass-panel sticky top-0 z-30 border-b border-white/10 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-brand-200">Plateforme de Pilotage Carbone</p>
              <h1 className="mt-2 text-xl font-semibold text-white lg:text-2xl">SMART GREEN ENSIT</h1>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
              <div>
                <div className="text-sm font-semibold text-white">{user?.full_name}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
              </div>
              <button type="button" onClick={logout} className="rounded-xl bg-brand-500/15 p-2 text-brand-100 transition hover:bg-brand-500/25 lg:hidden">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="relative flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="grid-noise pointer-events-none absolute inset-0 opacity-[0.18]" />
          <div className="relative mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
