-- =========================================================
-- R2 SITE FLASH — SCHEMA MULTI-SITE (Supabase / Postgres)
-- Um projeto Supabase só, usado para o site próprio da R2 Site Flash
-- E para todos os sites vendidos aos clientes.
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1) sites — um registro por site (o seu próprio, + cada cliente)
-- ---------------------------------------------------------
create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  -- o slug é o identificador que o HTML de cada site usa pra buscar
  -- os dados certos — ver a constante SITE_SLUG no HTML.

  status text not null default 'em produção',
  -- sugestões: em produção, ativo, entregue, em manutenção, pausado, arquivado

  domain text default '',
  client_contact text default '',
  -- nome/telefone do cliente dono do site (vazio no seu site próprio)

  whatsapp_number text default '',
  whatsapp_message text default 'Olá! Vim pelo site e quero saber mais.',
  price_amount numeric default 400,
  price_installments int default 10,
  price_note text default 'Domínio contratado separadamente.',
  hero_headline text default '',
  hero_subheadline text default '',
  final_cta_headline text default '',

  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists sites_slug_idx on sites (slug);

-- ---------------------------------------------------------
-- 2) faq_items — perguntas frequentes, por site
-- ---------------------------------------------------------
create table if not exists faq_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  question text not null,
  answer text not null,
  order_index int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists faq_items_site_idx on faq_items (site_id);

-- ---------------------------------------------------------
-- 3) portfolio_items — projetos exibidos na seção Portfólio, por site
-- ---------------------------------------------------------
create table if not exists portfolio_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  title text not null,
  category text default '',
  description text default '',
  image_url text default '',
  order_index int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists portfolio_items_site_idx on portfolio_items (site_id);

-- =========================================================
-- ROW LEVEL SECURITY
-- Leitura pública (cada site publicado precisa ler seus dados sem
-- login). Escrita só para usuários autenticados (você, no painel).
-- =========================================================

alter table sites enable row level security;
alter table faq_items enable row level security;
alter table portfolio_items enable row level security;

create policy "sites: leitura pública" on sites for select using (true);
create policy "faq_items: leitura pública" on faq_items for select using (true);
create policy "portfolio_items: leitura pública" on portfolio_items for select using (true);

create policy "sites: escrita autenticada" on sites for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "faq_items: escrita autenticada" on faq_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "portfolio_items: escrita autenticada" on portfolio_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- =========================================================
-- STORAGE — bucket compartilhado para as imagens do portfólio
-- (organize por pasta com o slug do site, ex: r2-site-flash/foto.png)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

create policy "portfolio bucket: leitura pública"
  on storage.objects for select using (bucket_id = 'portfolio');
create policy "portfolio bucket: upload autenticado"
  on storage.objects for insert with check (bucket_id = 'portfolio' and auth.role() = 'authenticated');
create policy "portfolio bucket: update autenticado"
  on storage.objects for update using (bucket_id = 'portfolio' and auth.role() = 'authenticated');
create policy "portfolio bucket: delete autenticado"
  on storage.objects for delete using (bucket_id = 'portfolio' and auth.role() = 'authenticated');

-- =========================================================
-- Trigger para manter updated_at em dia
-- =========================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sites_set_updated_at on sites;
create trigger sites_set_updated_at
  before update on sites
  for each row
  execute function set_updated_at();

-- =========================================================
-- Site próprio da R2 Site Flash, já cadastrado com o conteúdo
-- que hoje está fixo no HTML — pra você migrar sem perder nada.
-- =========================================================
insert into sites (
  name, slug, status,
  whatsapp_message, price_amount, price_installments, price_note,
  hero_headline, hero_subheadline, final_cta_headline
) values (
  'R2 Site Flash (site próprio)', 'r2-site-flash', 'ativo',
  'Olá! Vim pelo site da R2 Site Flash e quero criar meu site.',
  400, 10, 'Domínio contratado separadamente.',
  'Seu site profissional em até 24 horas.',
  'Sua empresa merece uma presença profissional na internet. Conte para nós o que você precisa e nós cuidamos do resto.',
  'Sua empresa pode estar na internet amanhã.'
)
on conflict (slug) do nothing;

insert into faq_items (site_id, question, answer, order_index)
select s.id, q.question, q.answer, q.order_index
from sites s
join (values
  ('O site realmente pode ficar pronto em até 24 horas?', 'Sim. O prazo começa após o recebimento das informações, materiais e definições necessárias para iniciar o projeto. Projetos que exijam funcionalidades adicionais podem demandar prazo diferente, informado previamente.', 1),
  ('Posso pedir alterações?', 'Sim. O processo inclui duas prévias para acompanhamento e ajustes previstos no projeto.', 2),
  ('O site funciona no celular?', 'Sim. Os projetos são desenvolvidos para funcionar adequadamente em computadores, tablets e smartphones.', 3),
  ('O domínio está incluído no valor do site?', 'Não. A contratação do domínio é realizada separadamente.', 4),
  ('Posso usar meu próprio domínio?', 'Sim.', 5),
  ('Como envio textos, fotos e informações?', 'O atendimento inicial é realizado pelo WhatsApp.', 6)
) as q(question, answer, order_index) on true
where s.slug = 'r2-site-flash'
  and not exists (select 1 from faq_items existing where existing.site_id = s.id);
