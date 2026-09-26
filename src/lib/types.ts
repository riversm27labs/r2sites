export interface SiteRecord {
  id: string
  name: string
  slug: string
  status: string
  domain: string
  client_contact: string
  whatsapp_number: string
  whatsapp_message: string
  price_amount: number
  price_installments: number
  price_note: string
  hero_headline: string
  hero_subheadline: string
  final_cta_headline: string
  notes: string
  created_at: string
  updated_at: string
}

export interface FaqItem {
  id: string
  site_id: string
  question: string
  answer: string
  order_index: number
  is_visible: boolean
}

export interface PortfolioItem {
  id: string
  site_id: string
  title: string
  category: string
  description: string
  image_url: string
  order_index: number
  is_visible: boolean
}

export const STATUS_OPTIONS = [
  'em produção',
  'ativo',
  'entregue',
  'em manutenção',
  'pausado',
  'arquivado',
]

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
