# Plan: Phase 11 — Segurança, LGPD e Performance

## Proposed Changes

### Banco de Dados (Segurança & Auditoria)

#### [NEW] [011_audit_logs_and_policies.sql](file:///Users/pedrohenriquefalconi/Desktop/Ecossistema-Dignidade/app/supabase/migrations/011_audit_logs_and_policies.sql)
- Criar tabela `audit_logs` para rastreamento de ações administrativas.
- Adicionar políticas de RLS para garantir que apenas admins vejam os logs.

### Backend (Next.js Middleware)

#### [MODIFY] [middleware.ts](file:///Users/pedrohenriquefalconi/Desktop/Ecossistema-Dignidade/app/src/middleware.ts)
- Adicionar lógica básica de rate limiting ou proteção por headers para rotas sensíveis.
- (Opcional) Integrar Upstash se houver credenciais.

### Frontend (LGPD & UX)

#### [NEW] [CookieBanner.tsx](file:///Users/pedrohenriquefalconi/Desktop/Ecossistema-Dignidade/app/src/components/layout/CookieBanner.tsx)
- Implementar banner de consentimento para cookies e termos de uso.

#### [MODIFY] [layout.tsx](file:///Users/pedrohenriquefalconi/Desktop/Ecossistema-Dignidade/app/src/app/layout.tsx)
- Integrar o `CookieBanner` globalmente.

## Prova de Trabalho (UAT)
1. Verificar se novos logs aparecem na tabela `audit_logs` após uma alteração administrativa.
2. Validar o surgimento do banner de LGPD em navegação anônima.
3. Testar a pontuação de performance via Lighthouse.
