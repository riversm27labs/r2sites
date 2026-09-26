import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useToast } from '../lib/useToast'
import type { SiteRecord } from '../lib/types'

function statusClass(status: string) {
  return 'status-' + status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
}

export default function SitesList() {
  const [sites, setSites] = useState<SiteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const { toast, showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('sites')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (data) setSites(data as SiteRecord[])
        if (error) showToast('Erro ao carregar sites.', 'error')
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statuses = useMemo(() => {
    const set = new Set(sites.map((s) => s.status))
    return ['todos', ...Array.from(set)]
  }, [sites])

  const filtered = filter === 'todos' ? sites : sites.filter((s) => s.status === filter)

  return (
    <div>
      <div className="top-row">
        <div>
          <h1>Sites</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            {sites.length} site{sites.length === 1 ? '' : 's'} cadastrado{sites.length === 1 ? '' : 's'}
            — o seu próprio e os dos clientes, tudo aqui.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/sites/new')}>
          + Novo site
        </button>
      </div>

      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}

      <div className="filter-pills">
        {statuses.map((s) => (
          <button
            key={s}
            className={`filter-pill ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 26 }}>Carregando...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 26, color: 'var(--slate)' }}>Nenhum site encontrado.</p>
        ) : (
          <table className="sites-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Status</th>
                <th>Cliente</th>
                <th>Domínio</th>
                <th>Slug</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} onClick={() => navigate(`/sites/${s.id}`)}>
                  <td className="name-cell">{s.name}</td>
                  <td>
                    <span className={`status-badge ${statusClass(s.status)}`}>{s.status}</span>
                  </td>
                  <td className="muted">{s.client_contact || '—'}</td>
                  <td className="muted">{s.domain || '—'}</td>
                  <td className="muted">{s.slug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
