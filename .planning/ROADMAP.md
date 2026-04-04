# ROADMAP — Ecossistema da Dignidade

## Milestone 1: MVP da Plataforma

## Phase 1: Fundação Técnica
- **Status:** complete
- **Goal:** Estrutura de pastas, aliases TypeScript, constantes globais, layout responsivo base, componentes UI base, padrão de erro/loading.

## Phase 2: Backend Base e Modelagem
- **Status:** complete
- **Goal:** Supabase configurado, 17+ tabelas, migrations, seeds, Zod schemas, camada de services.

## Phase 3: Autenticação e Autorização
- **Status:** complete
- **Goal:** Supabase Auth, RBAC, Middleware, Sessão persistente, Redirect smart.

## Phase 4: LMS (Trilhas, Aulas, Progresso, Certificados)
- **Status:** complete
- **Goal:** CourseComponents, Matrículas, Rastreamento de progresso, Geração de Certificados com QR Code.

## Phase 5: Observatório Social e Landing Page
- **Status:** complete
- **Goal:** ObservatoryView, Submissão de projetos, LandingSections, Blog básico.

## Phase 6: Perfis Avançados e Admin
- **Status:** complete
- **Goal:** Edição de perfil, Gestão de usuários/papéis, Carrinho básico.

## Phase 7: Fórum da Comunidade
- **Status:** complete
- **Goal:** APIs de fórum, Tela de criação e thread de respostas.
- **Notes:** Ativado com sucesso via migração SQL no Supabase.

## Phase 8: Course Preview (Venda de Curso)
- **Status:** complete
- **Goal:** Rota `/cursos/[slug]` com hero e grade curricular.

## Phase 9: Monetização e Checkout
- **Status:** complete
- **Goal:** Gateway de pagamento (Mercado Pago), Fluxo de pedido, Webhook e Liberação automática.
- **Notes:** Implementado via Checkout Pro e Webhooks Next.js.

## Phase 10: Dashboards e Analytics
- **Status:** complete
- **Goal:** Dashboard admin com KPIs (usuários, vendas, conclusões) usando Recharts.
- **Notes:** Implementado com faturamento, volume mensal e transações recentes.

## Phase 11: Segurança, LGPD e Performance
- **Status:** in_progress
- **Goal:** Rate limiting, Logs, Consentimento LGPD, Otimização Core Web Vitals.
- **Notes:** Rotas admin com validação e auditoria, sanitização de HTML, exportação/exclusão de dados LGPD, Speed Insights, skeletons e boundaries de erro já implementados.

## Phase 12: Testes de Segurança e QA
- **Status:** planned
- **Goal:** Implementar infraestrutura de testes (E2E, API), realizar testes de injeção de BD e validar o desenvolvimento seguro e controlado.

## Phase 13: Deploy Estável e Go-Live
- **Status:** planned
- **Goal:** Ambientes Staging/Prod, Checklist de homologação, Rollback plan.

## Backlog (Parking Lot)

### Phase 999.1: Correção do Cálculo de Carga Horária (BACKLOG)
- **Status:** complete
- **Goal:** Resolver bug onde o curso "Connecta Ci" mostra 3h mas a soma das aulas é 16min.
- **Requirements:** Implementar cálculo automático ou trigger para atualizar `courses.duration_minutes`.
- **Plans:** 0 plans
