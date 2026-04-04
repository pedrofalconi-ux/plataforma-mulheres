
# Ecossistema da Dignidade — Plataforma

Portal Educacional e Observatório Social do Ecossistema da Dignidade. Construído com **Next.js 16 (App Router)**, **Supabase (PostgreSQL)** e **Tailwind CSS v4**.

🔗 **Produção:** https://plataforma-mulheres.vercel.app/

---

## 🗺️ Roadmap de Módulos

| # | Módulo | Status |
|---|--------|--------|
| 1 | Backend Base e Modelagem (17 tabelas, RLS, Seeds, Zod) | ✅ Concluído |
| 2 | Autenticação e Integração Front-End (Login, Cadastro, Middleware, RBAC) | ✅ Concluído |
| 3 | LMS — Aulas, Progresso, Certificados, Comentários | ✅ Concluído |
| 4 | Perfis Avançados, Admin, Eventos Ao-Vivo | ✅ Concluído |
| 5 | Observatório Social, Blog, Landing Page Institucional | ✅ Concluído |
| 6 | Course Preview — Tela de pré-venda pública `/cursos/[slug]` | ✅ Concluído |
| 7 | Fórum da Comunidade — Tópicos, Respostas, API (Supabase RLS) | ✅ Concluído |
| 8 | Monetização e Checkout (Mercado Pago, Carrinho, Webhooks) | ✅ Concluído |
| 9 | Dashboards e Analytics (KPIs Financeiros, Recharts) | ✅ Concluído |
| 10 | Refinamentos (Carga Horária Automática, UX) | ✅ Concluído |
| 11 | Segurança, LGPD e Performance | 🚧 Em andamento |

---

## 🛠️ Stack Tecnológica

- **Framework:** Next.js 16 (React 19, App Router, Server Components)
- **Estilos:** Tailwind CSS v4 + Lucide React (ícones)
- **Backend & Auth:** Supabase (Auth, RLS, PostgreSQL) + @supabase/ssr
- **Validação:** Zod + React Hook Form
- **Gráficos:** Recharts
- **Deploy:** Vercel (CI/CD automático via GitHub)

---

## 🧠 Fluxo de Desenvolvimento (GSD Framework)

Este projeto usa o framework [**Get Shit Done v1.30.0**](https://github.com/gsd-build/get-shit-done) para organizar o desenvolvimento em fases planejadas e rastreadas.

Os arquivos de contexto ficam em `.planning/`:
- `PROJECT.md` — visão do projeto, stack e decisões arquiteturais
- `ROADMAP.md` — fases com status detalhado
- `STATE.md` — fase atual, pendências e notas de sessão

### Comandos rápidos disponíveis no Antigravity:

| Comando | O que faz |
|---------|-----------|
| `/gsd-progress` | Mostra a fase atual e o que fazer a seguir |
| `/gsd-plan-phase <N>` | Pesquisa e planeja detalhadamente uma fase |
| `/gsd-execute-phase <N>` | Executa todos os planos da fase (suporte a paralelo) |
| `/gsd-fast <tarefa>` | Executa micro-tarefas inline sem overhead de planejamento |
| `/gsd-verify-work` | Valida UAT da fase entregue |
| `/gsd-discuss-phase <N>` | Coleta decisões de implementação antes de planejar |
| `/gsd-audit-milestone` | Verifica se o milestone cumpriu o objetivo original |
| `/gsd-session-report` | Gera relatório da sessão com resumo de entregas |

---

## 🚀 Como rodar localmente

**Pré-requisitos:** Node.js v20+

```bash
# 1. Instale as dependências
cd app
npm install

# 2. Configure as variáveis de ambiente
# Crie o arquivo app/.env.local com:
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Banco de Dados (Supabase)

Os migrations ficam em `app/supabase/migrations/`. Para aplicar em um novo ambiente:

1. Acesse o painel do Supabase → **SQL Editor**
2. Execute os arquivos na ordem numérica (001, 002, 003...)
3. Execute o seed: `app/supabase/seed.sql`
