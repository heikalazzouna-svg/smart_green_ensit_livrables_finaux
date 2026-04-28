import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Leaf, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (values: LoginForm) => {
    setLoading(true)
    setError(null)
    try {
      await login(values.email, values.password)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Impossible de se connecter.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-hero-radial text-white">
      <div className="grid-noise absolute inset-0 opacity-40" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="flex flex-col justify-center">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-brand-400/20 bg-white/5 px-4 py-2 text-sm text-brand-100">
              <Leaf className="h-4 w-4" />
              ENSIT Climate Intelligence Platform
            </div>
            <h1 className="max-w-2xl text-5xl font-black tracking-tight text-white lg:text-7xl">
              Pilotez le carbone du campus avec clarté, vitesse et précision.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 lg:text-xl">
              La plateforme SMART GREEN ENSIT centralise les données énergétiques, calcule les émissions Scopes 1, 2 et 3, et prépare les décisions de transition bas-carbone.
            </p>
            <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
              {[
                'Collecte structurée des données',
                'Calcul automatique des émissions',
                'Simulation et prédiction IA',
              ].map((item) => (
                <div key={item} className="glass-panel rounded-3xl border border-white/10 p-4 text-sm text-slate-200">
                  <Sparkles className="mb-3 h-5 w-5 text-brand-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <form onSubmit={handleSubmit(submit)} className="glass-panel w-full max-w-xl rounded-[32px] border border-white/10 p-8 shadow-glow">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-200 ring-1 ring-brand-400/30">
                  <Leaf className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-bold text-white">SMART GREEN ENSIT</h2>
                <p className="mt-2 text-sm text-slate-400">Connexion sécurisée</p>
              </div>

              <label className="block text-sm text-slate-300">
                Adresse email
                <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-brand-400/40">
                  <Mail className="mr-3 h-4 w-4 text-slate-400" />
                  <input
                    {...register('email', { required: "L'email est requis" })}
                    type="email"
                    placeholder="admin@ensit.tn"
                    className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                  />
                </div>
                {errors.email ? <p className="mt-2 text-xs text-rose-300">{errors.email.message}</p> : null}
              </label>

              <label className="mt-5 block text-sm text-slate-300">
                Mot de passe
                <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-brand-400/40">
                  <Lock className="mr-3 h-4 w-4 text-slate-400" />
                  <input
                    {...register('password', { required: 'Le mot de passe est requis' })}
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                  />
                </div>
                {errors.password ? <p className="mt-2 text-xs text-rose-300">{errors.password.message}</p> : null}
              </label>

              {error ? <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-teal-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue('email', 'user@ensit.tn')
                  setValue('password', 'User@2026')
                }}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Utiliser le compte de démonstration
              </button>

              <p className="mt-6 text-center text-xs text-slate-500">
                Comptes de test: admin@ensit.tn / Admin@2026 et user@ensit.tn / User@2026
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
