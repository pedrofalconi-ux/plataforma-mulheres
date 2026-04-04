export type UserRole = 'admin' | 'student' | 'guest' | 'partner' | 'talent';

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
