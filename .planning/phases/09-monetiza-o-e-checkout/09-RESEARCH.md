# Phase 09: Monetização e Checkout — Research

## Overview
Integração do ecossistema com o Mercado Pago Checkout Pro para venda de trilhas. O fluxo utiliza a criação de uma `Preference` no backend e o redirecionamento ou componente de Wallet no frontend.

## Technical Approach

### 1. SDKs & Dependencies
- **Backend:** `mercadopago` (oficial Node.js SDK).
- **Frontend:** `@mercadopago/sdk-react` (para o botão de pagamento e inicialização do tijolo/brick).

### 2. Fluxo de Checkout Pro (Redirect)
1. **Frontend:** Usuário clica em "Matricular Agora" em `/cursos/[slug]`.
2. **Backend (API Route):** 
   - Cria uma ordem pendente no Supabase (`checkout_orders`).
   - Chama `mercadopago.preferences.create()` passando os detalhes do curso, o `internal_order_id` e as URLs de retorno (success, failure, pending).
   - Retorna o `init_point` (URL de checkout) para o frontend.
3. **Frontend:** Redireciona o usuário para o `init_point`.

### 3. Conciliação via Webhooks (IPN)
1. **Mercado Pago:** Envia um POST para `/api/webhooks/mercadopago` quando o status do pagamento muda.
2. **Backend (Webhook Route):**
   - Valida a assinatura do webhook (X-Signature).
   - Busca os detalhes do pagamento via SDK (`mercadopago.payment.get(id)`).
   - Localiza a ordem interna via `external_reference`.
   - Se status for `approved`:
     - Atualiza `checkout_orders` para `status = 'completed'`.
     - Cria entrada em `enrollments` liberando o curso para o `profile_id`.

## Database Integration
As tabelas já existem em `app/supabase/migrations/003_platform_completion.sql`:
- `checkout_orders`: `id`, `profile_id`, `total_amount`, `status` (pending, completed, cancelled).
- `checkout_order_items`: `id`, `order_id`, `item_type` (course), `item_id` (course_id).

## Validation Architecture
- **Teste de Fluxo:** Simular a criação de preferência e redirecionamento.
- **Teste de Webhook:** Usar ferramentas como `ngrok` ou `localtunnel` para receber notificações em ambiente local.
- **Segurança:** Validar `X-Signature` e garantir que a liberação do curso só ocorra para pagamentos confirmados no servidor do MP.

## Dependencies & Constraints
- Requere `MP_ACCESS_TOKEN` e `MP_PUBLIC_KEY` nas variáveis de ambiente.
- O projeto Next.js deve estar acessível externamente (Vercel) para receber webhooks reais.
