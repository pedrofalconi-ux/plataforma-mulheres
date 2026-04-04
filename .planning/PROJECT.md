# Plataforma “É no lar que tudo começa” — PROJECT.md

## Project Overview
**Name:** Plataforma “É no lar que tudo começa”  
**Client:** Nathi Faria  
**Technical Lead:** Pedro Falconi  
**Type:** Plataforma Web (Mobile-First)  
**Stack:** Next.js, TypeScript, Supabase (PostgreSQL + Auth + RLS), Tailwind CSS v4  

## Product Vision
Desenvolver uma plataforma web para disponibilização de conteúdos educacionais e espirituais em formato de assinatura, permitindo a entrega contínua de aulas, exercícios práticos e materiais complementares para usuárias.

## Target Users
- **Usuárias:** Mulheres que buscam formação educacional e espiritual através de assinaturas.
- **Administradores:** Gestores da plataforma (Nathi Faria e equipe) responsáveis pela gestão de conteúdo e usuários.

## MVP Scope (DOCUMENTO 1)
O escopo contempla o desenvolvimento de um sistema mínimo viável (MVP) com as seguintes funcionalidades:
- Cadastro e autenticação de usuárias (Email e Telefone).
- Disponibilização de cursos estruturados em trilhas.
- Exibição de aulas em vídeo (YouTube/Player Externo).
- Materiais complementares em PDF.
- Integração com meio de pagamento (Mercado Pago / Liberação Manual).
- Área administrativa para gestão de conteúdos e usuários.
- Seção de Devocionais textuais.
- Envio de Testemunhos.
- Redirecionamento para grupo de WhatsApp.

## Key Constraints
- **Responsividade**: Prioridade absoluta para dispositivos móveis (RNF01).
- **Simplicidade**: Interface intuitiva e limpa (RNF02).
- **Velocidade**: Tempo de carregamento adequado e otimizado (RNF03).
- **Segurança**: Boas práticas de autenticação e proteção de dados (RNF04).

## Architecture Decisions
- **Monorepo/App Router**: Uso do Next.js App Router para rotas e componentes.
- **Supabase Backend**: Auth, Database e Storage via Supabase.
- **SSR/Client Components**: Equilíbrio para performance SEO e interatividade.
