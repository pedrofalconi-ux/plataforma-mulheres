# Phase 09: Monetização e Checkout — Validation

## Goal
Garantir que o fluxo de checkout (criação de preferência, redirecionamento e ativação via webhook) seja seguro, funcional e robusto a falhas.

## Validation Dimensions

### 1. Checkout Lifecycle
- **Test:** Criar uma preferência de pagamento para um curso e verificar se a URL de checkout (`init_point`) é retornada corretamente.
- **Criteria:** `init_point` deve ser uma URL válida do Mercado Pago contendo o `preference_id`.

### 2. Webhook Integrity
- **Test:** Simular um payload de `approved` do Mercado Pago para o endpoint de webhook.
- **Criteria:** O endpoint deve validar a assinatura, buscar os detalhes do pagamento na API do MP e então atualizar a ordem no Supabase.

### 3. Business Logic (Enrollment)
- **Test:** Verificar se, após o pagamento aprovado, o curso é liberado para o aluno na tabela `enrollments`.
- **Criteria:** Deve existir uma entrada em `enrollments` vinculando o `profile_id` ao `course_id` com `status = 'active'`.

### 4. Failure Modes
- **Test:** Simular resposta de `rejected` ou `pending` do gateway.
- **Criteria:** A ordem (`checkout_orders`) deve permanecer com status pendente ou ser marcada como cancelada, e o curso NÃO deve ser liberado.

### 5. UI/Feedback
- **Test:** Clicar no botão "Matricular Agora" em `/cursos/[slug]`.
- **Criteria:** O usuário deve ser redirecionado para o Checkout Pro ou ver um feedback de carregamento antes do redirecionamento.

## Automated Verification Steps
- `grep -r "MP_ACCESS_TOKEN" .env.local`
- `npm run dev` e testar a API route de criação de preferência via Postman/cURL.
- Verificação da assinatura do Webhook com mock de payload.
