# Research: Phase 11 — Segurança, LGPD e Performance

## 1. Rate Limiting (Segurança)
**Objetivo:** Proteger rotas de `/api/auth` e `/api/checkout` contra ataques de força bruta ou abuso.
- **Opção A:** Middleware do Next.js + `upstash-ratelimit`. Vantagem: Escalável e pronto para o edge.
- **Opção B:** Supabase Auth já possui rate limits nativos (configuráveis no painel).
- **Decisão:** Implementar um middleware básico para as rotas da API interna que não passam pelo Auth do Supabase.

## 2. Logs de Auditoria (Admin)
**Objetivo:** Rastrear quem alterou o quê (ex: mudança de preço de curso, aprovação de projeto).
- **Abordagem:** Criar uma tabela `audit_logs` no Supabase.
- **Campos:** `id`, `profile_id`, `action`, `entity_name`, `entity_id`, `old_value`, `new_value`, `ip_address`, `created_at`.
- **Implementação:** Inserir via Server Action ou API Route sempre que uma ação administrativa for concluída.

## 3. LGPD (Consentimento)
**Objetivo:** Cumprir requisitos legais mínimos.
- **Componente:** Um banner de cookies/termos que persiste no LocalStorage ou via tabela de perfis (indicando `accepted_terms_at`).
- **Middleware:** Bloquear acesso a certas áreas se os termos não forem aceitos (opcional).

## 4. Performance (Core Web Vitals)
- **Checklist:**
  - Usar `next/image` em todos os lugares.
  - Verificar `priority` em imagens do hero.
  - Minimizar bundles de terceiros.
