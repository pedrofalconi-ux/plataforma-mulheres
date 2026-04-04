CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO DE PLATAFORMA DIGITAL
CONTRATANTE: Dr. Cláudio Emmanuel Gonçalves da Silva Filho, CPF: 07611077465, residente e domiciliado na BR 230 KM 10, Intermares, Cabedelo - PB. CEP 58102202.
CONTRATADO: Connecta CI, representada por: PEDRO HENRIQUE FALCONI PESSOA DE MELO, estudante, devidamente inscrito no CPF sob o n°  portador do RG n°  residente e domiciliado à endereço eletrônico pedro.falconi@academico.ufpb.br, telefone n° (83)98208-2640;
As partes acima identificadas resolvem celebrar o presente CONTRATO DE PRESTAÇÃO DE SERVIÇOS, que se regerá pelas cláusulas e condições a seguir.

CLÁUSULA PRIMEIRA – DO OBJETO
1.1. O presente contrato tem por objeto o desenvolvimento, implementação e entrega de uma plataforma digital comunitária com foco em educação, iniciativas sociais, cursos, eventos e integração da comunidade, conforme requisitos definidos nas reuniões realizadas em 28 de janeiro de 2026 e 04 de fevereiro de 2026.
1.2. A plataforma contará, em sua versão inicial, com as seguintes áreas e funcionalidades:
a) Home institucional;
b) Observatório de iniciativas solidárias, com cadastro de ações por empresas, paróquias e comunidades;
c) Cursos e Trilhas educacionais, com controle de acesso;
d) Área de Eventos comunitários, com divulgação, inscrições e organização;
e) Página Sobre / Quem Somos.
1.2.1 A plataforma deverá ter uma seção/ícone para Teleatendimento, a ser implementado somente após avaliação em fase futura, mediante novo orçamento e eventual aditivo contratual.
1.3 O contrato possui como anexo obrigatório o Documento de Requisitos Técnicos, que detalha funcionalidades, permissões, fluxos e critérios de segurança da plataforma.
1.4 O CONTRATADO responsabiliza-se a fornecer 6 meses de manutenção do sistema, abrangendo a correção de falhas que venham a surgir neste intervalo. 


CLÁUSULA SEGUNDA - DAS OBRIGAÇÕES DO CONTRATANTE

O CONTRATANTE obriga-se a:
Cooperação e informações
Disponibilizar ao CONTRATADO, de forma tempestiva e adequada, todos os dados, materiais, acessos, senhas, contas, conteúdos, imagens, arquivos e informações indispensáveis à execução dos serviços contratados;
Especificar, quando necessário, as diretrizes e objetivos da demanda, inclusive temas de artigos, preferências de linguagem, identidade visual e outras orientações estratégicas.
Dever de boa-fé e comunicação
Manter comunicação ativa, clara e contínua com o CONTRATADO, respondendo às solicitações de alinhamento e aprovações de materiais no prazo do dia vigente;
Abster-se de qualquer conduta que possa embaraçar ou inviabilizar a execução dos serviços, sob pena de responsabilidade contratual.


📑 DOCUMENTO DE REQUISITOS DE SOFTWARE (DRS)
PROJETO: ECOSSISTEMA DA DIGNIDADE
CLIENTE: Comunidade Nova Berith
DATA: 13/02/2026 | VERSÃO: 1.2
STATUS: Revisado para Aprovação


1. INTRODUÇÃO
1.1 Propósito
Este documento detalha as especificações técnicas e estratégicas do Ecossistema da Dignidade. A plataforma funcionará como o hub central da Comunidade Nova Berith, integrando presença institucional, educação à distância (LMS), gestão de talentos e monetização através de e-commerce e eventos.
1.2 Visão Estratégica
Diferente de sistemas genéricos, esta solução foca na soberania digital da comunidade, garantindo que os dados dos membros e a propriedade intelectual (vídeos e cursos) estejam protegidos contra pirataria e dependência de grandes redes sociais.











2. ARQUITETURA DO SISTEMA E USUÁRIOS
Abaixo, a definição dos níveis de acesso para garantir a governança dos dados.
Perfil
Descrição do Papel
Permissões Chave
Visitante
Público geral interessado.
Visualizar Landing Page, Blog e catálogo público.
Membro
Integrante cadastrado.
Participar do Banco de Talentos e gerir compras.
Aluno
Usuário em aprendizado.
Acesso ao LMS, progresso em aulas e certificados.
Administrador
Gestor da Comunidade.
Dashboards, exportação de dados e gestão de vendas.












3. REQUISITOS FUNCIONAIS (RF)
3.1 Presença Digital e Conteúdo
RF-01 – Painel Institucional: Gestão de Missão, Visão e Valores com interface amigável (CMS).
RF-02 – Blog Engine: Publicação de artigos com suporte a SEO (otimização para buscas) e agendamento.
3.2 Inteligência de Dados e Banco de Talentos
RF-03 – Perfil Enriquecido: Coleta de habilidades específicas (ex: instrumentos musicais, funções técnicas).
RF-05 – Busca e Filtros de Talentos: Ferramenta administrativa para localização de voluntários por competência ou região.
3.3 Educação à Distância (LMS)
RF-07 – Estrutura de Trilhas: Organização modular (Módulos > Aulas > Materiais).
RF-08 – Monitoramento de Progresso: Registro de tempo de tela e porcentagem concluída.
RF-09 – Certificação Automática: Emissão de PDF com QR Code de autenticidade após 100% de conclusão.
3.4 Segurança e Monetização
RF-10 – Proteção de Streaming (Anti-Pirataria): Criptografia de vídeo e bloqueio de download (DRM).
RF-12 – Gestão de Ingressos: Venda de acessos com controle de lotes e check-in via QR Code.
RF-13 – Checkout Unificado: Carrinho integrado que aceita múltiplos produtos e cursos em uma só transação.


4. REQUISITOS NÃO FUNCIONAIS (RNF)
RNF-01 – Segurança e LGPD: Uso de HTTPS, criptografia de ponta a ponta e painel de "Direito ao Esquecimento" para conformidade legal.
RNF-02 – Performance Crítica: Carregamento de páginas em menos de 3 segundos para garantir a retenção do usuário.
RNF-03 – Disponibilidade (SLA): Sistema operando 99% do tempo (High Availability).
RNF-04 – Design Responsivo (Mobile First): Experiência otimizada prioritariamente para smartphones.

5. INFRAESTRUTURA E RESTRIÇÕES
Infraestrutura: Hospedagem em nuvem escalável (AWS/Azure/Google).
Gateway de Pagamento: Integração via API robusta (ex: Stripe, Mercado Pago ou Pagar.me).
Vídeo: Uso de infraestrutura de alta performance (ex: Cloudflare Stream ou Vimeo OTT).

6. CRITÉRIOS DE ACEITAÇÃO
Segurança: Aprovação em auditoria básica de vulnerabilidades.
Checkout: Fluxo de pagamento -> liberação deve ser instantâneo em pagamentos confirmados.
Relatórios: Exportação do Banco de Talentos em CSV/XLSX deve estar formatada sem erros.

