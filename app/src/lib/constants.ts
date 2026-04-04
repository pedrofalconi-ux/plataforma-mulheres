import { Course, NewsItem, ObservatoryProject, ForumPost } from './types';

export const BRAND_NAME = 'Dignare';
export const BRAND_TAGLINE = 'aprendizagem viva para transformar gente e território';
export const BRAND_EMAIL = 'contato@dignare.org';

export const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Dignare abre nova jornada formativa para líderes comunitárias',
    summary: 'Uma trilha pensada para fortalecer repertório, presença e impacto social com acompanhamento prático.',
    date: '24 Out 2023',
    imageUrl: 'https://picsum.photos/400/250?random=1',
    source: 'Blog'
  },
  {
    id: '2',
    title: 'Rede local mobiliza voluntários para ações de cuidado e escuta',
    summary: 'Veja como a comunidade está usando a plataforma para organizar iniciativas com mais clareza e continuidade.',
    date: '22 Out 2023',
    imageUrl: 'https://picsum.photos/400/250?random=2',
    source: 'Instagram'
  },
  {
    id: '3',
    title: 'Novo artigo discute formação ética com linguagem acessível',
    summary: 'Publicamos um conteúdo especial sobre como unir profundidade intelectual e comunicação cotidiana.',
    date: '20 Out 2023',
    imageUrl: 'https://picsum.photos/400/250?random=3',
    source: 'Portal'
  }
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'Fundamentos de cuidado e dignidade',
    description: 'Uma introdução clara para quem quer formar presença, consciência e capacidade de servir.',
    level: 'Iniciante',
    thumbnail: 'https://picsum.photos/300/180?random=10',
    progress: 0,
    totalModules: 12
  },
  {
    id: 'c2',
    title: 'Comunidade, cultura e transformação',
    description: 'Leituras e ferramentas práticas para liderar ações coletivas com mais intenção.',
    level: 'Intermediário',
    thumbnail: 'https://picsum.photos/300/180?random=11',
    progress: 45,
    totalModules: 8
  },
  {
    id: 'c3',
    title: 'Estratégia humana para projetos sociais',
    description: 'Um percurso avançado sobre articulação, sustentabilidade e mobilização de redes.',
    level: 'Avançado',
    thumbnail: 'https://picsum.photos/300/180?random=12',
    progress: 10,
    totalModules: 15
  }
];

export const MOCK_PROJECTS: ObservatoryProject[] = [
  {
    id: 'p1',
    name: 'Casa do Bom Samaritano',
    category: 'Moradia',
    lat: -23.55052,
    lng: -46.633308,
    description: 'Acolhimento temporário para pessoas em situação de rua.',
    contact: '(11) 99999-9999',
    address: 'Rua da Fraternidade, 123 - Centro, SP'
  },
  {
    id: 'p2',
    name: 'Nutrindo Esperança',
    category: 'Alimentação',
    lat: -23.5615,
    lng: -46.6560,
    description: 'Distribuição de marmitas e cestas básicas.',
    contact: 'contato@nutrindo.org',
    address: 'Av. Paulista, 1000 - SP'
  },
  {
    id: 'p3',
    name: 'Consultório na Rua',
    category: 'Saúde',
    lat: -23.5400,
    lng: -46.6400,
    description: 'Atendimento médico básico itinerante.',
    contact: 'saude@dignare.org',
    address: 'Itinerante - Zona Norte'
  }
];

export const MOCK_FORUM_POSTS: ForumPost[] = [
  {
    id: 'f1',
    title: 'Como traduzir temas profundos para grupos iniciantes?',
    author: 'Maria Silva',
    category: 'Formação',
    replies: 12,
    views: 340,
    lastActivity: '2 horas atrás'
  },
  {
    id: 'f2',
    title: 'Estratégias para manter voluntários engajados por mais tempo',
    author: 'Pe. João',
    category: 'Gestão Social',
    replies: 8,
    views: 156,
    lastActivity: '1 dia atrás'
  }
];
