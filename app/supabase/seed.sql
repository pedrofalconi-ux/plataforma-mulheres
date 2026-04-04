-- =============================================
-- Seeds — Dados iniciais
-- =============================================

-- Regiões
INSERT INTO regions (id, name, state) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'São Paulo - Capital', 'SP'),
  ('a1000000-0000-0000-0000-000000000002', 'Campinas e Região', 'SP'),
  ('a1000000-0000-0000-0000-000000000003', 'Rio de Janeiro - Capital', 'RJ');

-- Categorias
INSERT INTO categories (id, name, slug, description) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Bioética', 'bioetica', 'Estudos de bioética personalista e clínica'),
  ('c1000000-0000-0000-0000-000000000002', 'Doutrina Social', 'doutrina-social', 'Doutrina Social da Igreja e aplicações'),
  ('c1000000-0000-0000-0000-000000000003', 'Liderança Social', 'lideranca-social', 'Gestão e liderança para projetos sociais'),
  ('c1000000-0000-0000-0000-000000000004', 'Espiritualidade', 'espiritualidade', 'Formação espiritual e vida interior'),
  ('c1000000-0000-0000-0000-000000000005', 'Saúde Integral', 'saude-integral', 'Saúde física, mental e espiritual');

-- Skills
INSERT INTO skills (id, name, description) VALUES
  ('51000000-0000-0000-0000-000000000001', 'Bioética Clínica', 'Análise ética de casos clínicos'),
  ('51000000-0000-0000-0000-000000000002', 'Gestão de Projetos Sociais', 'Planejamento e execução de projetos de impacto social'),
  ('51000000-0000-0000-0000-000000000003', 'Captação de Recursos', 'Fundraising e sustentabilidade financeira'),
  ('51000000-0000-0000-0000-000000000004', 'Voluntariado', 'Coordenação e engajamento de voluntários'),
  ('51000000-0000-0000-0000-000000000005', 'Acolhimento Pastoral', 'Acolhimento e acompanhamento de pessoas em vulnerabilidade'),
  ('51000000-0000-0000-0000-000000000006', 'Comunicação Social', 'Produção de conteúdo e mídias sociais'),
  ('51000000-0000-0000-0000-000000000007', 'Direito e Advocacy', 'Defesa de direitos e políticas públicas'),
  ('51000000-0000-0000-0000-000000000008', 'Educação Popular', 'Metodologias de educação comunitária');

-- Cursos
INSERT INTO courses (id, title, description, slug, level, category_id, total_modules, is_published) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Introdução à Bioética Personalista',
   'Fundamentos da dignidade humana e o valor da vida desde a concepção.',
   'intro-bioetica', 'Iniciante',
   'c1000000-0000-0000-0000-000000000001', 3, true),

  ('d1000000-0000-0000-0000-000000000002', 'Doutrina Social da Igreja',
   'Compreendendo a encíclica Caritas in Veritate e aplicações práticas.',
   'doutrina-social', 'Intermediário',
   'c1000000-0000-0000-0000-000000000002', 2, true),

  ('d1000000-0000-0000-0000-000000000003', 'Liderança para Projetos Sociais',
   'Gestão, captação de recursos e voluntariado para ONGs e Pastorais.',
   'lideranca-projetos', 'Avançado',
   'c1000000-0000-0000-0000-000000000003', 3, true);

-- Módulos do Curso 1
INSERT INTO modules (id, course_id, title, order_index) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Fundamentos da Pessoa Humana', 1),
  ('b1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Princípios da Bioética', 2),
  ('b1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'Aplicações Práticas', 3);

-- Aulas do Módulo 1
INSERT INTO lessons (id, module_id, title, description, type, duration_minutes, order_index) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   'A dignidade da pessoa humana',
   'Conceitos fundamentais que definem a pessoa humana não como algo, mas como alguém.',
   'video', 15, 1),
  ('e1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001',
   'Antropologia personalista',
   'Visão integral do ser humano na tradição personalista.',
   'video', 20, 2),
  ('e1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002',
   'Princípio da totalidade',
   'O corpo humano como unidade e suas implicações éticas.',
   'video', 18, 1),
  ('e1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002',
   'Princípio da duplo efeito',
   'Análise ética de ações com consequências boas e más.',
   'video', 22, 2);

-- Materiais
INSERT INTO materials (lesson_id, title, type, url) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Resumo da Aula (PDF)', 'pdf', '/materials/aula01-resumo.pdf'),
  ('e1000000-0000-0000-0000-000000000001', 'Leitura Recomendada', 'link', 'https://example.com/leitura-dignidade');

-- Projetos do Observatório
INSERT INTO observatory_projects (id, name, description, category, status, address, lat, lng, contact) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'Casa do Bom Samaritano',
   'Acolhimento temporário para pessoas em situação de rua.',
   'moradia', 'approved', 'Rua da Fraternidade, 123 - Centro, SP',
   -23.55052, -46.633308, '(11) 99999-9999'),
  ('f1000000-0000-0000-0000-000000000002', 'Nutrindo Esperança',
   'Distribuição de marmitas e cestas básicas.',
   'alimentacao', 'approved', 'Av. Paulista, 1000 - SP',
   -23.5615, -46.6560, 'contato@nutrindo.org'),
  ('f1000000-0000-0000-0000-000000000003', 'Consultório na Rua',
   'Atendimento médico básico itinerante.',
   'saude', 'approved', 'Itinerante - Zona Norte',
   -23.5400, -46.6400, 'saude@ecossistema.org');
