# Ecossistema da Dignidade — PROJECT.md

## Project Overview
**Name:** Ecossistema da Dignidade  
**Type:** Plataforma Educacional + Observatório Social  
**Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (PostgreSQL + Auth + RLS), Tailwind CSS v4, Zod, React Hook Form, Recharts, Lucide React  
**Deploy:** Vercel (produção em https://app-connectacipb-9739s-projects.vercel.app/)  
**Repo:** https://github.com/connectacipb/Ecossistema-Dignidade  
**Code Root:** `app/` dentro do repositório raiz  

## Product Vision
Um ecossistema digital completo para formação humana, social e espiritual, com um LMS de trilhas de ensino, um Observatório Social de projetos comunitários, Fórum de comunidade, área de eventos ao vivo, blog e, futuramente, monetização via checkout de cursos e ingressos.

## Target Users
- **Alunos:** Membros que se cadastram para cursas trilhas formativas e participam da comunidade
- **Admins:** Gestores da plataforma com painel para gerenciar usuários, conteúdos, projetos e eventos
- **Visitantes:** Navegação pública na landing, blog e preview de cursos

## Key Constraints
- Não usar biblioteca de componentes externa (UI é Tailwind CSS puro + Radix primitivos mínimos)
- Supabase como único backend (sem ORM externo — queries diretas via supabase-js)
- Todas as rotas de API são Next.js Route Handlers
- Validação via Zod em todos os endpoints

## Architecture Decisions
- Server Components para páginas públicas (SEO + performance)
- Client Components apenas onde há interatividade real
- RLS (Row Level Security) no Supabase para todas as tabelas
- Middleware Next.js para proteção de rotas autenticadas
