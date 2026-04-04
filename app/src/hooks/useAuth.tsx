'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function getUserProfile(userId: string, email?: string) {
      // Tenta buscar o profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error && mounted) {
        console.error('Error fetching profile:', error);
        // Mesmo sem perfil, permite acesso básico para evitar loop em alguns casos, ou trate conforme regras
      }
      
      if (data && mounted) {
        setUser({
          id: data.id,
          name: data.full_name || data.name || '',
          email: email || '',
          role: data.role || 'STUDENT',
          avatar: data.avatar_url,
        });
      } else if (mounted) {
        // Fallback básico caso o trigger de perfil ainda não tenha rodado
        setUser({
          id: userId,
          name: '',
          email: email || '',
          role: 'STUDENT',
        });
      }
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && mounted) {
        getUserProfile(session.user.id, session.user.email);
      } else if (mounted) {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && mounted) {
        getUserProfile(session.user.id, session.user.email);
      } else if (mounted) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin' || user?.role === 'ADMIN',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
