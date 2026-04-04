# Phase 09: Monetização e Checkout — Plan

**Phase:** 09
**Goal:** Implementar o checkout completo via Mercado Pago para venda de trilhas.
**Waves:** 3
**Autonomous:** true

---

## Wave 1: Setup & API Core
Foco na infraestrutura e nos endpoints de criação de preferência.

### Plan 09-01: Dependencies & Env Setup
- **Objective:** Instalar SDKs e preparar ambiente.
- **Tasks:**
  - [ ] Instalar `mercadopago` e `@mercadopago/sdk-react`.
  - [ ] Adicionar placeholders em `.env.example`: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`.
- **Acceptance Criteria:**
  - `package.json` contém `mercadopago`.
  - `.env.example` contém as chaves do Mercado Pago.

### Plan 09-02: Preference API Route
- **Objective:** Criar o endpoint que gera o link de pagamento.
- **Read First:**
  - `app/src/lib/supabase.ts`
  - `.planning/phases/09-monetiza-o-e-checkout/09-RESEARCH.md`
- **Tasks:**
  - [ ] Criar `app/src/app/api/checkout/preference/route.ts`.
  - [ ] Implementar POST: recebe `courseId`, cria `checkout_orders` no Supabase, chama MP SDK e retorna `init_point`.
- **Acceptance Criteria:**
  - Requisição POST retorna JSON com `init_point` (URL do Mercado Pago).
  - Uma nova entrada é criada em `checkout_orders` com `status = 'pending'`.

---

## Wave 2: Webhooks & Activation
Foco no recebimento de notificações de pagamento e liberação de conteúdo.

### Plan 09-03: Webhook Handler
- **Objective:** Receber notificações do Mercado Pago e ativar matrículas.
- **Read First:**
  - `app/supabase/migrations/003_platform_completion.sql`
- **Tasks:**
  - [ ] Criar `app/src/app/api/webhooks/mercadopago/route.ts`.
  - [ ] Implementar lógica de recebimento: validar assinatura, buscar pagamento no MP via SDK, atualizar status da ordem.
  - [ ] Se aprovado: Inserir entrada em `enrollments` para o usuário e curso correspondentes.
- **Acceptance Criteria:**
  - Endpoint de webhook responde 200/201 (obrigatório para o MP).
  - Pagamentos aprovados resultam em `enrollments` ativos no banco.

---

## Wave 3: Frontend - Catalog & Returns
Foco na experiência do usuário e diferenciação das visões.

### Plan 09-04: Catalog Card Refactor
- **Objective:** Diferenciar visualmente o "Explorar Catálogo" de "Minhas Trilhas".
- **Read First:**
  - `app/src/components/courses/CourseComponents.tsx`
- **Tasks:**
  - [ ] Atualizar o `select` do Supabase para buscar `price` e `duration_minutes`.
  - [ ] Implementar visual de card para o Catálogo: exibir preço (R$), duração e nome.
  - [ ] Trocar botões do catálogo para "Ver Detalhes" e "Matricular-se".
  - [ ] Ocultar barra de progresso em itens do catálogo (ou mostrar status "Novo").
- **Acceptance Criteria:**
  - A aba "Explorar Catálogo" exibe o preço dos cursos.
  - O visual do card no catálogo é distinto do card em "Minhas Trilhas".

### Plan 09-05: Buy Flow & Return Pages
- **Objective:** Conectar o botão "Matricular-se" ao checkout e criar telas de retorno.
- **Tasks:**
  - [ ] Atualizar `CoursePreview.tsx` e `CourseComponents.tsx` para chamar a API de preferência.
  - [ ] Criar `/checkout/success` e `/checkout/failure`.
- **Acceptance Criteria:**
  - Clicar em "Matricular-se" inicia o redirecionamento.
  - `/checkout/success` exibe parabéns e redireciona para a trilha.
