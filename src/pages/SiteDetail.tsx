import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useToast } from '../lib/useToast'
import { slugify, STATUS_OPTIONS, type SiteRecord, type FaqItem, type PortfolioItem } from '../lib/types'

type Tab = 'config' | 'portfolio' | 'faq'

export default function SiteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast, showToast } = useToast()
  const [tab, setTab] = useState<Tab>('config')
  const [site, setSite] = useState<SiteRecord | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadSite() {
    setLoading(true)
    const { data, error } = await supabase.from('sites').select('*').eq('id', id).single()
    if (data) setSite(data as SiteRecord)
    if (error) showToast('Erro ao carregar site.', 'error')
    setLoading(false)
  }

  useEffect(() => {
    loadSite()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function removeSite() {
    if (!site) return
    if (
      !confirm(
        `Excluir "${site.name}"? Isso apaga o site do catálogo e todo o portfólio/FAQ associados a ele.`
      )
    )
      return
    await supabase.from('sites').delete().eq('id', site.id)
    showToast('Site removido.')
    navigate('/')
  }

  if (loading) return <p>Carregando...</p>
  if (!site) return <p>Site não encontrado.</p>

  return (
    <div>
      <Link to="/" className="back-link">
        ← Voltar para a lista
      </Link>

      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}

      <div className="top-row">
        <div>
          <h1 style={{ marginBottom: 4 }}>{site.name}</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            slug: <code>{site.slug}</code>
          </p>
        </div>
        <button className="btn btn-danger" onClick={removeSite}>
          Excluir site
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'config' ? 'active' : ''}`}
          onClick={() => setTab('config')}
        >
          Configurações
        </button>
        <button
          className={`tab-btn ${tab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setTab('portfolio')}
        >
          Portfólio
        </button>
        <button
          className={`tab-btn ${tab === 'faq' ? 'active' : ''}`}
          onClick={() => setTab('faq')}
        >
          Perguntas frequentes
        </button>
      </div>

      {tab === 'config' && <ConfigTab site={site} onSaved={loadSite} />}
      {tab === 'portfolio' && <PortfolioTab siteId={site.id} siteSlug={site.slug} />}
      {tab === 'faq' && <FaqTab siteId={site.id} />}
    </div>
  )
}

// =====================================================================
// Aba: Configurações
// =====================================================================
function ConfigTab({ site, onSaved }: { site: SiteRecord; onSaved: () => void }) {
  const [form, setForm] = useState<SiteRecord>(site)
  const [saving, setSaving] = useState(false)
  const { toast, showToast } = useToast()

  useEffect(() => setForm(site), [site])

  function update<K extends keyof SiteRecord>(key: K, value: SiteRecord[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) {
      showToast('Nome e slug são obrigatórios.', 'error')
      return
    }
    setSaving(true)
    const { id, created_at, updated_at, ...payload } = form
    const { error } = await supabase.from('sites').update(payload).eq('id', site.id)
    setSaving(false)
    if (error) {
      showToast('Erro ao salvar: ' + error.message, 'error')
      return
    }
    showToast('Configurações salvas.')
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit}>
      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Identificação</h3>
        <div className="field-row">
          <div className="field">
            <label>Nome</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="field">
            <label>Slug</label>
            <input
              value={form.slug}
              onChange={(e) => update('slug', slugify(e.target.value))}
              required
            />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => update('status', e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Domínio</label>
            <input value={form.domain} onChange={(e) => update('domain', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Cliente / contato</label>
          <input
            value={form.client_contact}
            onChange={(e) => update('client_contact', e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>WhatsApp</h3>
        <div className="field">
          <label>Número (só dígitos, com código do país e DDD)</label>
          <input
            value={form.whatsapp_number}
            onChange={(e) => update('whatsapp_number', e.target.value)}
            placeholder="5563999999999"
          />
        </div>
        <div className="field">
          <label>Mensagem automática</label>
          <textarea
            value={form.whatsapp_message}
            onChange={(e) => update('whatsapp_message', e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Preço</h3>
        <div className="field-row">
          <div className="field">
            <label>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.price_amount}
              onChange={(e) => update('price_amount', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Parcelas</label>
            <input
              type="number"
              value={form.price_installments}
              onChange={(e) => update('price_installments', Number(e.target.value))}
            />
          </div>
        </div>
        <div className="field">
          <label>Observação</label>
          <input value={form.price_note} onChange={(e) => update('price_note', e.target.value)} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Textos principais</h3>
        <div className="field">
          <label>Headline do topo (hero)</label>
          <textarea
            value={form.hero_headline}
            onChange={(e) => update('hero_headline', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Subheadline do topo</label>
          <textarea
            value={form.hero_subheadline}
            onChange={(e) => update('hero_subheadline', e.target.value)}
          />
        </div>
        <div className="field">
          <label>Headline da chamada final</label>
          <textarea
            value={form.final_cta_headline}
            onChange={(e) => update('final_cta_headline', e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Observações internas</h3>
        <div className="field">
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </form>
  )
}

// =====================================================================
// Aba: Portfólio
// =====================================================================
function PortfolioTab({ siteId, siteSlug }: { siteId: string; siteSlug: string }) {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const { toast, showToast } = useToast()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('site_id', siteId)
      .order('order_index', { ascending: true })
    if (data) setItems(data as PortfolioItem[])
    if (error) showToast('Erro ao carregar portfólio.', 'error')
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setUploading(true)

    let image_url = ''
    if (file) {
      const path = `${siteSlug}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('portfolio').upload(path, file)
      if (uploadError) {
        showToast('Erro ao enviar imagem: ' + uploadError.message, 'error')
        setUploading(false)
        return
      }
      const { data: publicUrl } = supabase.storage.from('portfolio').getPublicUrl(path)
      image_url = publicUrl.publicUrl
    }

    const nextOrder = items.length ? Math.max(...items.map((i) => i.order_index)) + 1 : 1

    const { error } = await supabase.from('portfolio_items').insert({
      site_id: siteId,
      title,
      category,
      description,
      image_url,
      order_index: nextOrder,
      is_visible: true,
    })

    setUploading(false)
    if (error) {
      showToast('Erro ao salvar: ' + error.message, 'error')
      return
    }

    setTitle('')
    setCategory('')
    setDescription('')
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
    showToast('Projeto adicionado.')
    load()
  }

  async function toggleVisible(item: PortfolioItem) {
    await supabase.from('portfolio_items').update({ is_visible: !item.is_visible }).eq('id', item.id)
    load()
  }

  async function remove(item: PortfolioItem) {
    if (!confirm(`Remover "${item.title}" do portfólio?`)) return
    await supabase.from('portfolio_items').delete().eq('id', item.id)
    showToast('Projeto removido.')
    load()
  }

  async function move(item: PortfolioItem, direction: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.order_index - b.order_index)
    const idx = sorted.findIndex((i) => i.id === item.id)
    const swapWith = sorted[idx + direction]
    if (!swapWith) return
    await Promise.all([
      supabase.from('portfolio_items').update({ order_index: swapWith.order_index }).eq('id', item.id),
      supabase.from('portfolio_items').update({ order_index: item.order_index }).eq('id', swapWith.id),
    ])
    load()
  }

  return (
    <div className="card">
      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}

      {loading ? (
        <p>Carregando...</p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--slate)' }}>Nenhum projeto cadastrado ainda.</p>
      ) : (
        [...items]
          .sort((a, b) => a.order_index - b.order_index)
          .map((item, idx) => (
            <div className="item-row" key={item.id}>
              {item.image_url ? (
                <img className="item-thumb" src={item.image_url} alt={item.title} />
              ) : (
                <div className="item-thumb" />
              )}
              <div className="item-body">
                <div className="title">
                  {item.title} {!item.is_visible && <span className="badge hidden-badge">oculto</span>}
                </div>
                <div className="meta">{item.category}</div>
              </div>
              <div className="item-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => move(item, -1)} disabled={idx === 0}>
                  ↑
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => move(item, 1)}
                  disabled={idx === items.length - 1}
                >
                  ↓
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleVisible(item)}>
                  {item.is_visible ? 'Ocultar' : 'Mostrar'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(item)}>
                  Excluir
                </button>
              </div>
            </div>
          ))
      )}

      <form className="new-item-form" onSubmit={handleAdd}>
        <h3 style={{ marginTop: 0 }}>Adicionar projeto</h3>
        <div className="field-row">
          <div className="field">
            <label>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label>Categoria</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Descrição curta</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label>Imagem (opcional)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={uploading}>
          {uploading ? 'Enviando...' : 'Adicionar ao portfólio'}
        </button>
      </form>
    </div>
  )
}

// =====================================================================
// Aba: FAQ
// =====================================================================
function FaqTab({ siteId }: { siteId: string }) {
  const [items, setItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast, showToast } = useToast()

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .eq('site_id', siteId)
      .order('order_index', { ascending: true })
    if (data) setItems(data as FaqItem[])
    if (error) showToast('Erro ao carregar perguntas.', 'error')
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) return
    setSaving(true)
    const nextOrder = items.length ? Math.max(...items.map((i) => i.order_index)) + 1 : 1
    const { error } = await supabase
      .from('faq_items')
      .insert({ site_id: siteId, question, answer, order_index: nextOrder, is_visible: true })
    setSaving(false)
    if (error) {
      showToast('Erro ao salvar: ' + error.message, 'error')
      return
    }
    setQuestion('')
    setAnswer('')
    showToast('Pergunta adicionada.')
    load()
  }

  async function toggleVisible(item: FaqItem) {
    await supabase.from('faq_items').update({ is_visible: !item.is_visible }).eq('id', item.id)
    load()
  }

  async function remove(item: FaqItem) {
    if (!confirm('Remover esta pergunta?')) return
    await supabase.from('faq_items').delete().eq('id', item.id)
    showToast('Pergunta removida.')
    load()
  }

  async function move(item: FaqItem, direction: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.order_index - b.order_index)
    const idx = sorted.findIndex((i) => i.id === item.id)
    const swapWith = sorted[idx + direction]
    if (!swapWith) return
    await Promise.all([
      supabase.from('faq_items').update({ order_index: swapWith.order_index }).eq('id', item.id),
      supabase.from('faq_items').update({ order_index: item.order_index }).eq('id', swapWith.id),
    ])
    load()
  }

  return (
    <div className="card">
      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}

      {loading ? (
        <p>Carregando...</p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--slate)' }}>Nenhuma pergunta cadastrada ainda.</p>
      ) : (
        [...items]
          .sort((a, b) => a.order_index - b.order_index)
          .map((item, idx) => (
            <div className="item-row" key={item.id}>
              <div className="item-body">
                <div className="title">
                  {item.question} {!item.is_visible && <span className="badge hidden-badge">oculto</span>}
                </div>
                <div className="meta">{item.answer}</div>
              </div>
              <div className="item-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => move(item, -1)} disabled={idx === 0}>
                  ↑
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => move(item, 1)}
                  disabled={idx === items.length - 1}
                >
                  ↓
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleVisible(item)}>
                  {item.is_visible ? 'Ocultar' : 'Mostrar'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(item)}>
                  Excluir
                </button>
              </div>
            </div>
          ))
      )}

      <form className="new-item-form" onSubmit={handleAdd}>
        <h3 style={{ marginTop: 0 }}>Adicionar pergunta</h3>
        <div className="field">
          <label>Pergunta</label>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} required />
        </div>
        <div className="field">
          <label>Resposta</label>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Adicionar pergunta'}
        </button>
      </form>
    </div>
  )
}
