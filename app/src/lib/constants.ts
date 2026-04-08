import { Course, NewsItem, ForumPost } from './types';

export const BRAND_NAME = 'É no lar onde tudo começa';
export const BRAND_TAGLINE = 'Lar onde o coração se forma';
export const BRAND_EMAIL = 'contato@nathifaria.com.br';

export const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Nathi Faria abre nova jornada formativa: O Cultivo das Virtudes',
    summary: 'Uma trilha pensada para fortalecer o repertório interior e a presença intencional no cotidiano do lar.',
    date: '24 Out 2023',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800',
    source: 'Blog',
  },
  {
    id: '2',
    title: 'Comunidade Nathi Faria: Relatos de transformação no ambiente doméstico',
    summary: 'Veja como alunas estão aplicando os conceitos de ordem e paz em suas rotinas familiares.',
    date: '22 Out 2023',
    imageUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=800',
    source: 'Instagram',
  },
  {
    id: '3',
    title: 'Novo artigo: A importância da clareza na educação dos filhos',
    summary: 'Publicação de um conteúdo especial sobre como unir autoridade e doçura no processo educativo.',
    date: '20 Out 2023',
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea2962254de?q=80&w=800',
    source: 'Portal',
  },
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'O Ritual da Manhã',
    description: 'Presença e propósito: como as primeiras horas do dia moldam sua energia criativa e liderança.',
    level: 'Essencial',
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800',
    progress: 0,
    totalModules: 8,
  },
  {
    id: 'c2',
    title: 'Liderança Afetiva',
    description: 'Construindo autoridade por meio da empatia, da escuta ativa e da presença intencional.',
    level: 'Intermediário',
    thumbnail: 'https://images.unsplash.com/photo-1502086223501-7ea2962254de?q=80&w=800',
    progress: 45,
    totalModules: 10,
  },
  {
    id: 'c3',
    title: 'O Poder do Artesanal',
    description: 'Estratégias para negócios digitais com alma, exclusividade e o valor do feito à mão.',
    level: 'Avançado',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800',
    progress: 10,
    totalModules: 12,
  },
];

export const MOCK_FORUM_POSTS: ForumPost[] = [
  {
    id: 'f1',
    title: 'Como manter a ordem em casas com crianças pequenas?',
    author: 'Maria Silva',
    category: 'Vida Prática',
    replies: 12,
    views: 340,
    lastActivity: '2 horas atrás',
  },
  {
    id: 'f2',
    title: 'Sugestões de leitura para o cultivo das virtudes diárias',
    author: 'Ana Paula',
    category: 'Formação',
    replies: 8,
    views: 156,
    lastActivity: '1 dia atrás',
  },
];
