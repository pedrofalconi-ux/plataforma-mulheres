# STATE — Plataforma “É no lar que tudo começa”

## Status dos Requisitos Funcionais (MVP)

| ID | Requisito | Status | Notas |
|---|---|---|---|
| RF01 | Cadastro com Email e Telefone | 🟡 Em Progresso | E-mail ok, telefone precisa de ajuste na UI/DB. |
| RF02 | Login com Email e Senha | ✅ Concluído | Supabase Auth funcional. |
| RF03 | Sessão Persistente | ✅ Concluído | Middleware e Cookies configurados. |
| RF04 | Armazenar Dados Usuárias | ✅ Concluído | Tabela `profiles` pronta. |
| RF05 | Visualizar Usuárias no Admin | 🟡 Em Progresso | Tela de listagem básica existe. |
| RF06 | Criar Trilhas (Cursos) | ✅ Concluído | CRUD Admin de cursos funcional. |
| RF07 | Trilhas com Múltiplas Aulas | ✅ Concluído | Relacionamento `courses` -> `lessons` ok. |
| RF08 | Nome, Descrição e Imagem | ✅ Concluído | Campos presentes no BD e UI. |
| RF09 | Aulas com Vídeo (Link Externo) | ✅ Concluído | Suporte a YouTube/Vimeo. |
| RF10 | Exibição do Vídeo na Plataforma | ✅ Concluído | Player customizado funcional. |
| RF11 | Descrição da Aula | ✅ Concluído | Campo `content` ou `description` ok. |
| RF12 | Anexar Arquivos PDF | ✅ Concluído | Supabase Storage integrado. |
| RF13 | Download de Arquivos PDF | ✅ Concluído | Botão de download funcional no player. |
| RF14 | Integração Mercado Pago | 🟡 Em Progresso | Checkout Pro configurado. |
| RF15 | Liberação Manual de Acesso | 🔴 Planejado | Gerenciamento via dashboard admin. |
| RF16 | Seção de Devocionais Textuais | 🔴 Planejado | Novo módulo de conteúdo a ser criado. |
| RF17 | Envio de Testemunhos (Depoimentos) | 🔴 Planejado | Formulário de submissão e admin review. |
| RF18 | Link Grupo de WhatsApp | 🔴 Planejado | Simples link de redirecionamento. |
| RF19 | CRUD de Trilhas (Admin) | ✅ Concluído | Dashboard admin para cursos. |
| RF20 | CRUD de Aulas (Admin) | ✅ Concluído | Dashboard admin para aulas. |
| RF21 | Upload de Materiais (Admin) | ✅ Concluído | Integração com Storage. |
| RF22 | KPIs Básicos no Admin | 🟡 Em Progresso | Dashboard com vendas e usuários ok. |

## Observações
O projeto encontra-se em fase de transição da marca "Dignidade" para "É no lar que tudo começa". A fundação técnica e o LMS base já estão robustos, permitindo foco rápido nos diferenciais (Devocionais e Testemunhos) e no refinamento do fluxo de pagamento.
