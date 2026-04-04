# ROADMAP — Plataforma “É no lar que tudo começa”

Este roadmap detalha as etapas de desenvolvimento do MVP para a cliente Nathi Faria, focando em uma experiência mobile-first simplificada e eficiente.

## Milestone 1: MVP - Fundação e LMS Central (60% concluído)

### Phase 1: Autenticação e Perfil Enriquecido
- **Goal:** Cadastro e login com Email e Telefone (RF01, RF02, RF03).
- **Status:** in_progress
- **Details:** O sistema já possui Auth por e-mail no Supabase. Precisamos garantir a captura do campo `telefone` no onboarding.

### Phase 2: Trilhas e Gestão de Aulas
- **Goal:** Implementar estrutura de Trilhas, Módulos e Aulas com vídeos (RF06, RF07, RF08, RF09, RF10, RF11).
- **Status:** complete
- **Details:** Estrutura básica de CRUD de trilhas e aulas já funcional no painel administrativo e na área do aluno.

### Phase 3: Materiais Complementares (PDF)
- **Goal:** Upload e download de arquivos PDF associados às aulas (RF12, RF13, RF21).
- **Status:** complete
- **Details:** Funcionalidade de materiais de apoio já integrada no player de aula.

## Milestone 2: Engajamento e Comunidade (0% concluído)

### Phase 4: Seção de Devocionais
- **Goal:** Criar área para conteúdos textuais diários/periódicos (RF16).
- **Status:** planned

### Phase 5: Testemunhos e Social
- **Goal:** Canal para envio de depoimentos e redirecionamento para WhatsApp (RF17, RF18).
- **Status:** planned

## Milestone 3: Comercial e Pagamento (40% concluído)

### Phase 6: Fluxo de Pagamento Integrado
- **Goal:** Integração formal com Mercado Pago para assinaturas/cursos (RF14).
- **Status:** in_progress
- **Details:** Checkout Pro configurado, pendente ajustes de webhook de aprovação para este novo contexto de assinatura.

### Phase 7: Liberação Manual e Painel Admin Final
- **Goal:** Controle administrativo completo para gestão de usuárias e acessos manuais (RF15, RF19, RF20, RF22).
- **Status:** in_progress
- **Details:** Painel admin básico funcional para trilhas, pendente listagem de usuários com gestão de acesso manual.

---

## Recursos Legados (Descontinuados ou Fora do Escopo Inicial)
Os recursos abaixo faziam parte do projeto anterior ("Ecossistema da Dignidade") e estão desativados ou ocultos no contexto atual da Nathi Faria:
- **Observatório Social**: Oculto.
- **Fórum de Comunidade**: Oculto.
- **Teleatendimento**: Descontinuado.
- **Eventos e Ingressos**: Movido para funcionalidades futuras.
