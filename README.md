# Painel R2 Site Flash — Central de Sites

Painel administrativo **multi-site**: um projeto Supabase e um painel só,
usados tanto para o site próprio da R2 Site Flash quanto para **todos os
sites vendidos aos clientes**. Cada site é um registro independente —
mesmo WhatsApp, preço, textos e portfólio, mas dados isolados por site.

O que dá pra editar, sem mexer em código, por site:

- WhatsApp (número e mensagem automática)
- Preço e forma de pagamento
- Textos principais (headline, subheadline, chamada final)
- Portfólio (adicionar/remover/reordenar projetos, com imagem)
- Perguntas frequentes (adicionar/remover/reordenar)

Cada site publicado busca os próprios dados no Supabase, filtrando pelo
`SITE_SLUG` configurado no HTML dele. Se a busca falhar (sem internet,
chave errada etc.), o HTML mantém o conteúdo que já está escrito nele —
não quebra.

---

## 1. Criar o projeto no Supabase

1. Crie a organização/projeto Supabase (Pro, recomendado dentro da
   mesma organização paga que você já estiver usando para consolidar
   seus projetos).
2. Em **SQL Editor**, cole o conteúdo de `schema.sql` (nesta pasta) e
   rode. Isso cria `sites`, `faq_items`, `portfolio_items`, o espaço de
   imagens do portfólio, e **já cadastra o site próprio da R2 Site
   Flash** (slug `r2-site-flash`) com o conteúdo que hoje está fixo no
   HTML.
3. Em **Project Settings > API**, copie a **Project URL** e a
   **anon public key**.

## 2. Criar seu usuário de login

Sem cadastro público — só você entra.

1. **Authentication > Users > Add user**
2. Preencha e-mail e senha.

## 3. Rodar o painel localmente

```bash
cd r2-admin
npm install
cp .env.example .env
```

Preencha o `.env` com a URL e a chave do passo 1, depois:

```bash
npm run dev
```

Acesse `http://localhost:5173`, entre com o e-mail/senha, e o site
"R2 Site Flash (site próprio)" já vai estar lá, pronto pra editar.

## 4. Publicar o painel (Vercel)

1. Suba a pasta `r2-admin` para um repositório no GitHub.
2. Importe na Vercel.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`.
4. Deploy.

## 5. Ligar o site público (HTML) ao Supabase

Abra `r2-site-flash.html`, procure perto do fim por:

```js
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const SITE_SLUG = "r2-site-flash";
```

Preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os dados do passo 1.
`SITE_SLUG` já vem certo para o site próprio — não mexe.

## 6. Vendendo um site novo pra um cliente

1. No painel, clique em **+ Novo site**. Preenche nome, slug (ex:
   `clinica-fulano`), status e o resto.
2. Na tela do site, preenche WhatsApp, preço, textos e portfólio dele.
3. Pegue o arquivo `r2-site-flash.html` como modelo, troque o
   `SITE_SLUG` no final do arquivo pelo slug que você cadastrou (ex:
   `clinica-fulano`), ajusta a logo/cores se for o caso, e publica.

Pronto — o mesmo projeto Supabase e o mesmo painel atendem a quantos
sites você quiser, cada um puxando só os dados dele.

## Observação sobre a chave "anon"

Ela é pública por natureza — fica visível em cada site publicado, isso
é normal e seguro no Supabase. Quem protege os dados são as regras de
acesso (RLS) que o `schema.sql` configura: qualquer pessoa consegue
*ler* os dados (pra os sites funcionarem), mas só quem estiver logado
no painel consegue *alterar* qualquer coisa.
