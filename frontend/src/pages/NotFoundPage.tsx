import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-white">
      <div className="glass-panel max-w-lg rounded-[32px] border border-white/10 p-8 text-center">
        <div className="text-xs uppercase tracking-[0.35em] text-slate-400">404</div>
        <h1 className="mt-4 text-4xl font-black">Page introuvable</h1>
        <p className="mt-3 text-slate-300">La route demandée n'existe pas dans SMART GREEN ENSIT.</p>
        <Link to="/dashboard" className="mt-6 inline-flex rounded-2xl bg-brand-500 px-5 py-3 font-semibold text-slate-950">Retour au tableau de bord</Link>
      </div>
    </div>
  )
}
