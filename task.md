# Roadmap de Execução do Projeto

## Fase 1

### Módulo 0. Fundação técnica do projeto
**Objetivo:** Garantir que a base do projeto esteja limpa, padronizada e pronta para crescer.
- [x] Definir a estrutura oficial de pastas do projeto
- [x] Padronizar naming de componentes, hooks, serviços e tipos
- [x] Criar convenção para: Components, features, services, lib, schemas, types, contexts
- [x] Separar claramente: UI pura, lógica de negócio, integração com API, validação de formulário
- [x] Criar arquivo de constantes globais: roles, rotas protegidas, status, tipos de produto
- [x] Configurar aliases no TypeScript
- [x] Definir padrão de: tratamento de erro, loading, empty state, toast/feedback
- [x] Criar layout base responsivo para app pública e área autenticada
- [x] Criar componentes reutilizáveis: Button, Input, Select, Modal, Card, Table, Pagination, Tabs, Badge

### Módulo 1. Modelagem do domínio e backend base
**Objetivo:** Definir as entidades centrais e preparar a base de dados/API.
- [x] Definir o banco e ORM (ex: PostgreSQL + Prisma/Supabase)
- [x] Modelar entidades principais: User, Role, MemberProfile, TalentProfile, Skill, Region, Course, Module, Lesson, Material, Enrollment, LessonProgress, Certificate, Product, Order, OrderItem, Payment, Event, TicketLot, Ticket, Checkin, BlogPost, Category
- [x] Definir relacionamentos entre tabelas
- [x] Criar migrations iniciais
- [x] Criar seeds básicos: admin, categorias, trilhas de exemplo, habilidades iniciais
- [x] Definir padrão de API (REST ou route handlers do Next)
- [x] Criar contratos de payload com Zod
- [x] Criar camada de serviços para acesso aos dados
- [x] Criar política de versionamento da API

### Módulo 2. Autenticação, perfis e autorização
**Objetivo:** Transformar autenticação em algo confiável e escalável.
- [x] Escolher solução de auth (NextAuth/Auth.js ou Supabase Auth)
- [x] Implementar: cadastro, login, logout, recuperação de senha, confirmação de email
- [x] Criar middleware de proteção de rotas
- [x] Implementar RBAC: visitante, membro, aluno, admin
- [x] Criar fluxo de onboarding do usuário
- [x] Criar perfil do membro
- [x] Criar perfil do aluno
- [x] Definir quando um usuário vira “aluno” (compra/matrícula)
- [x] Criar guards de interface e também guards no backend
- [x] Implementar sessão persistente
- [x] Criar páginas: acesso negado, conta pendente, completar cadastro

---

## Fase 2

### Módulo 3. Presença institucional e CMS
**Objetivo:** Entregar a parte pública institucional com gerenciamento administrativo.
- [x] Definir conteúdo institucional editável: missão, visão, valores, hero, seções da landing, contatos
- [x] Criar modelo de CMS simples
- [x] Criar painel admin para editar conteúdo
- [x] Criar sistema de blog: criar, editar, publicar/despublicar, agendar, categorias/tags
- [x] Implementar SEO por página: title, description, og tags, slug amigável
- [x] Criar listagem de posts
- [x] Criar página individual de post
- [x] Criar busca e filtro por categoria
- [x] Implementar preview de post
- [x] Otimizar imagens e metadados

### Módulo 4. Banco de talentos
**Objetivo:** Permitir cadastro detalhado de talentos e busca estratégica pela comunidade.
- [x] Criar formulário de perfil enriquecido do membro (dados, região, disponibilidade, habilidades, etc)
- [x] Criar cadastro e edição de habilidades
- [x] Criar taxonomia de competências
- [x] Criar busca por: habilidade, região, disponibilidade, palavra-chave
- [x] Criar filtros combinados
- [x] Criar listagem administrativa de talentos
- [x] Criar visualização detalhada do perfil
- [x] Criar exportação CSV/XLSX
- [x] Criar status de perfil: incompleto, ativo, arquivado
- [x] Criar paginação e ordenação
**Critério de Aceite:** Perfil cadastrável, busca funcional por admin, e exportação de dados sem erros.

---

## Fase 3

### Módulo 5. LMS: trilhas, aulas, materiais e progresso
**Objetivo:** Criar a espinha dorsal da área educacional.
- [x] Modelar estrutura: Curso/Trilha, Módulo, Aula, Material complementar
- [x] Criar admin CRUD de trilhas
- [x] Criar ordenação de módulos e aulas
- [x] Criar upload ou cadastro de materiais
- [x] Criar página pública da trilha
- [x] Criar área interna da trilha para aluno
- [x] Criar matrícula/inscrição
- [x] Criar controle de aula concluída
- [x] Registrar progresso por aula
- [x] Calcular progresso do curso em %
- [x] Registrar tempo de tela
- [x] Criar regras de desbloqueio: linear, livre
- [x] Criar dashboard do aluno: cursos em andamento, progresso, certificados emitidos
- [x] Criar dashboard admin: número de alunos por trilha, conclusão média, evasão básica

### Módulo 8. Certificados e emissão automática
**Objetivo:** Emitir certificado apenas quando o progresso estiver completo.
- [x] Definir layout de certificado
- [x] Criar regra de elegibilidade (100% concluído)
- [x] Gerar PDF
- [x] Gerar QR Code de autenticidade
- [x] Criar página pública de validação do certificado
- [x] Criar código único do certificado
- [x] Registrar data de emissão
- [x] Permitir download pelo aluno
- [x] Permitir reemissão pelo admin

---

## Fase 4

### Módulo 6. Vídeo e proteção de conteúdo
**Objetivo:** Subir o módulo de vídeo com streaming protegido, criptografia e bloqueio de download.
- [ ] Escolher fornecedor de vídeo (ex: Cloudflare Stream)
- [ ] Integrar upload e gestão de vídeos
- [ ] Criar player autenticado
- [ ] Associar vídeo a aula
- [ ] Restringir acesso por usuário matriculado
- [ ] Bloquear link direto e esconder URL pública do asset
- [ ] Criar marca d’água visual, se aplicável
- [ ] Criar regras de expiração/token de reprodução
- [ ] Definir estratégia anti-download realista
- [ ] Garantir rastreamento de tempo de visualização
- [ ] Testar performance em mobile

### Módulo 7. Monetização: produtos, cursos, eventos, checkout
**Objetivo:** Criar a camada comercial do ecossistema.
- [ ] Definir tipos de item vendável: curso, produto, ingresso/evento
- [ ] Criar catálogo público
- [ ] Criar carrinho unificado e cálculo de subtotal/total
- [ ] Integrar gateway de pagamento (Mercado Pago, Stripe, Pagar.me)
- [ ] Criar fluxo de pedido e webhook de confirmação
- [ ] Liberar acesso automaticamente após pagamento confirmado
- [ ] Criar módulo de eventos, lotes de ingressos e controle de estoque
- [ ] Gerar ingresso com QR Code
- [ ] Criar telas de check-in e admin de validação do QR
- [ ] Criar histórico de compras do usuário
- [ ] Criar política de status: pendente, pago, cancelado, reembolsado
- [ ] Tratar falha de pagamento

---

## Fase 5

### Módulo 9. Painel admin, dashboards e relatórios
**Objetivo:** Dar visão operacional e gerencial do sistema.
- [ ] Criar dashboard geral com KPIs: usuários, membros, alunos, cursos, vendas, tickets
- [ ] Criar dashboard de talentos, LMS, financeiro
- [ ] Criar filtros por período
- [ ] Criar exportação CSV/XLSX
- [ ] Criar gestão de pedidos, eventos, usuários e papéis
- [ ] Criar logs administrativos básicos
- [ ] Criar ações rápidas: aprovar, arquivar, reenviar acesso, exportar

### Módulo 10. LGPD, segurança e conformidade
**Objetivo:** Fechar o sistema com requisitos de segurança e conformidade.
- [ ] Garantir uso de HTTPS em produção
- [ ] Revisar armazenamento de senhas e política de sessão segura
- [x] Validar inputs com Zod no backend
- [ ] Proteger rotas sensíveis e criar rate limiting
- [x] Implementar logs de ação sensível
- [x] Criar tela/painel de consentimento e privacidade
- [x] Criar fluxo de direito ao esquecimento e exportação de dados
- [x] Revisar permissões administrativas e sanitizar conteúdo rico
- [ ] Testar vulnerabilidades básicas: auth bypass, IDOR, upload indevido, XSS

### Módulo 11. Performance, responsividade e observabilidade
**Objetivo:** Garantir que o produto funcione impecavelmente.
- [ ] Revisar estratégia de renderização (SSR, SSG, ISR, client components)
- [x] Otimizar imagens e lazy load
- [x] Dividir bundles e medir Core Web Vitals
- [x] Revisar queries lentas e implementar skeletons
- [ ] Garantir experiência mobile first
- [x] Criar telas de erro e fallback
- [ ] Configurar monitoramento: logs, error tracking, uptime
- [ ] Configurar backups e estratégia de recuperação

### Módulo 12. Deploy, staging e go-live
**Objetivo:** Subir o projeto com estabilidade e previsibilidade.
- [ ] Definir ambientes: local, staging, produção
- [ ] Configurar variáveis por ambiente, banco, storage, vídeo, gateway, domínio
- [ ] Rodar checklist de homologação
- [ ] Criar seed de produção inicial
- [ ] Criar plano de rollback e documentação de operação
