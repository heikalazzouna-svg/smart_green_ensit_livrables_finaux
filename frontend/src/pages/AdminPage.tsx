import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useLocation, NavLink } from 'react-router-dom'
import { apiClient } from '@/api/client'

type UserRow = { id: number; email: string; full_name: string; role: string; entity_id: number | null; is_active: boolean }
type EntityRow = { id: number; name: string; type: string; surface_area_m2?: number | null; description?: string | null; is_active: boolean }
type SourceRow = { id: number; name: string; scope: number; category: string; unit: string; factor_kgco2e: number; description?: string | null; is_active: boolean }

export default function AdminPage() {
  const location = useLocation()
  const active = location.pathname.includes('/entities') ? 'entities' : location.pathname.includes('/emission-sources') ? 'sources' : 'users'

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-5">
        <h2 className="text-3xl font-black text-white">Administration</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">Gérez les utilisateurs, les entités et les facteurs d'émission sans quitter la plateforme.</p>
      </section>

      <div className="flex flex-wrap gap-3">
        <TabLink to="/admin/users" active={active === 'users'}>Utilisateurs</TabLink>
        <TabLink to="/admin/entities" active={active === 'entities'}>Entités</TabLink>
        <TabLink to="/admin/emission-sources" active={active === 'sources'}>Sources d'émission</TabLink>
      </div>

      {active === 'users' ? <UsersPanel /> : active === 'entities' ? <EntitiesPanel /> : <SourcesPanel />}
    </div>
  )
}

function TabLink({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return <NavLink to={to} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${active ? 'bg-brand-500 text-slate-950' : 'border border-white/10 bg-white/5 text-white'}`}>{children}</NavLink>
}

function UsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([])

  useEffect(() => { void load() }, [])
  const load = async () => { const { data } = await apiClient.get<UserRow[]>('/admin/users'); setUsers(data) }
  const update = async (id: number, role: string) => { await apiClient.put(`/admin/users/${id}/role`, { role }); await load() }

  return (
    <Panel title="Utilisateurs" subtitle="Mise à jour des rôles">
      <Table>
        {users.map((user) => (
          <tr key={user.id} className="border-t border-white/8">
            <Td>{user.full_name}</Td>
            <Td>{user.email}</Td>
            <Td>{user.entity_id ?? '—'}</Td>
            <Td>
              <select value={user.role} onChange={(event) => update(user.id, event.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white">
                {['admin', 'user', 'teacher', 'student'].map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </Td>
          </tr>
        ))}
      </Table>
    </Panel>
  )
}

function EntitiesPanel() {
  const [items, setItems] = useState<EntityRow[]>([])
  const [form, setForm] = useState({ name: '', type: 'BUILDING', surface_area_m2: '', description: '' })

  useEffect(() => { void load() }, [])
  const load = async () => { const { data } = await apiClient.get<EntityRow[]>('/admin/entities'); setItems(data) }
  const create = async () => {
    await apiClient.post('/admin/entities', { ...form, surface_area_m2: form.surface_area_m2 ? Number(form.surface_area_m2) : null })
    setForm({ name: '', type: 'BUILDING', surface_area_m2: '', description: '' })
    await load()
  }
  const update = async (id: number, patch: Partial<EntityRow>) => { await apiClient.put(`/admin/entities/${id}`, patch); await load() }
  const remove = async (id: number) => { await apiClient.delete(`/admin/entities/${id}`); await load() }

  return (
    <Panel title="Entités" subtitle="Bâtiments, laboratoires, campus">
      <div className="mb-5 grid gap-3 lg:grid-cols-4">
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nom" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" />
        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white">
          {['BUILDING', 'LAB', 'ADMIN', 'CAMPUS'].map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <input value={form.surface_area_m2} onChange={(event) => setForm({ ...form, surface_area_m2: event.target.value })} placeholder="Surface m²" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white" />
        <button onClick={create} className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-slate-950">Créer</button>
      </div>
      <Table>
        {items.map((item) => (
          <tr key={item.id} className="border-t border-white/8">
            <Td><input defaultValue={item.name} onBlur={(event) => update(item.id, { name: event.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white" /></Td>
            <Td>{item.type}</Td>
            <Td><input defaultValue={item.surface_area_m2 ?? ''} onBlur={(event) => update(item.id, { surface_area_m2: event.target.value ? Number(event.target.value) : null })} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white" /></Td>
            <Td><button onClick={() => remove(item.id)} className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">Désactiver</button></Td>
          </tr>
        ))}
      </Table>
    </Panel>
  )
}

function SourcesPanel() {
  const [items, setItems] = useState<SourceRow[]>([])

  useEffect(() => { void load() }, [])
  const load = async () => { const { data } = await apiClient.get<SourceRow[]>('/admin/emission-sources'); setItems(data) }
  const update = async (id: number, patch: Partial<SourceRow>) => { await apiClient.put(`/admin/emission-sources/${id}`, patch); await load() }

  return (
    <Panel title="Sources d'émission" subtitle="Facteurs ADEME / Base Carbone">
      <Table>
        {items.map((item) => (
          <tr key={item.id} className="border-t border-white/8">
            <Td>{item.name}</Td>
            <Td>{item.scope}</Td>
            <Td>{item.category}</Td>
            <Td><input defaultValue={item.factor_kgco2e} onBlur={(event) => update(item.id, { factor_kgco2e: Number(event.target.value) })} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-white" /></Td>
            <Td>{item.unit}</Td>
          </tr>
        ))}
      </Table>
    </Panel>
  )
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="glass-panel rounded-[28px] border border-white/10 p-6">
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="text-slate-400">
          <tr>
            <Th>Colonne 1</Th>
            <Th>Colonne 2</Th>
            <Th>Colonne 3</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: ReactNode }) { return <th className="px-4 py-3 font-medium">{children}</th> }
function Td({ children }: { children: ReactNode }) { return <td className="px-4 py-3 align-top">{children}</td> }
