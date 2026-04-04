export type UserRole = 'GUEST' | 'STUDENT' | 'ADMIN' | 'PARTNER' | 'admin' | 'student' | 'guest' | 'partner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  thumbnail: string;
  progress: number;
  totalModules: number;
}

export interface ObservatoryProject {
  id: string;
  name: string;
  category: 'Alimentação' | 'Saúde' | 'Educação' | 'Espiritualidade' | 'Moradia';
  lat: number;
  lng: number;
  description: string;
  contact: string;
  address: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  imageUrl: string;
  source: 'Instagram' | 'Blog' | 'Portal';
}

export interface ForumPost {
  id: string;
  author: string;
  title: string;
  category: string;
  replies: number;
  views: number;
  lastActivity: string;
}
