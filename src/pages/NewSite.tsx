import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useToast } from '../lib/useToast'
import { slugify, STATUS_OPTIONS } from '../lib/types'

export default function NewSite() {
  const navigate = useNavigate()
  const { toast, showToast } = useToast()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [status, setStatus] = useState('em produção')
  const [domain, setDomain] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      showToast('Nome e slug são obrigatórios.', 'error')
      return
    }
    setSaving(true)
    const { data, error } = await supabase
      .from('sites')
      .insert({
        name,
        slug,
        status,
        domain,
        client_contact: clientContact,
        whatsapp_message: 'Olá! Vim pelo site e quero saber mais.',
        price_amount: 400,
        price_installments: 10,
        price_note: 'Domínio contratado separadamente.',
      })
      .select()
      .single()
    setSaving(false)
    if (error) {
      showToast('Erro ao criar: ' + error.message, 'error')
      return
    }
    showToast('Site cadastrado.')
    navigate(`/sites/${data.id}`)
  }

  return (
    <div>
      <h1>Novo site</h1>
      <p className="subtitle">
        Cadastre o essencial agora — WhatsApp, preço, textos e portfólio você completa na tela do
        site, logo em seguida.
      </p>

      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="field-row">
            <div className="field">
              <label>Nome do site / cliente</label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!slugTouched) setSlug(slugify(e.target.value))
                }}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label>Slug (usado pelo HTML do site para buscar os dados certos)</label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(slugify(e.target.value))
                }}
                required
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Domínio (se já tiver)</label>
              <input value={domain} onChange={(e) => setDomain(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Cliente / contato (deixe em branco se for o seu site próprio)</label>
            <input value={clientContact} onChange={(e) => setClientContact(e.target.value)} />
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Criando...' : 'Cadastrar site'}
        </button>
      </form>
    </div>
  )
}
