# Phase 9: Monetização e Checkout - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary
Esta fase entrega a integração completa de pagamentos via Mercado Pago, permitindo que alunos comprem trilhas de ensino e tenham acesso liberado automaticamente após a confirmação.

</domain>

<decisions>
## Implementation Decisions

### Gateway e Integração
- **D-01:** Utilizar **Mercado Pago** como gateway principal.
- **D-02:** Utilizar **Checkout Pro (Redirecionamento)** para o MVP — simplifica a segurança e suporta Pix/Cartão nativamente.

### Fluxo de Compra e Ativação
- **D-03:** Foco em **Compra Direta (1-Click)** a partir da página do curso (`/cursos/[slug]`), mas mantendo o backend compatível com múltiplos itens.
- **D-04:** Ativação automática realizada via **Webhook** do Mercado Pago que comunica com uma API Route no Next.js para atualizar `enrollments` e `checkout_orders`.

### Escopo e Itens
- **D-05:** Produto prioritário: **Trilhas (Courses)**. Ingressos de eventos ficam mapeados no banco mas sem UI de checkout dedicada nesta primeira entrega.

### a agent's Discretion
- Definição do design dos botões de "Comprar" e estados de feedback visual.
- Nomenclatura das tabelas internas de logs de webhook.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `app/supabase/migrations/003_platform_completion.sql` — Tabelas `checkout_orders` e `checkout_order_items`.
- `app/supabase/migrations/007_course_price.sql` — Coluna de preço em cursos.

### Checkout & Landing
- `app/src/components/courses/CoursePreview.tsx` — Botão de compra onde o fluxo inicia.

</canonical_refs>
