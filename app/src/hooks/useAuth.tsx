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
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error && mounted) {
          console.error('Error fetching profile:', error);
        }
        
        if (data && mounted) {
          setUser({
            id: data.id,
            name: data.full_name || data.name || '',
            email: email || '',
            role: data.role || 'student',
            avatar: data.avatar_url,
          });
        } else if (mounted) {
          // Fallback básico caso o trigger de perfil ainda não tenha rodado
          setUser({
            id: userId,
            name: '',
            email: email || '',
            role: 'student',
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    async function initialize() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && mounted) {
          await getUserProfile(authUser.id, authUser.email);
        } else if (mounted) {
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    void initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (session?.user && mounted) {
        void getUserProfile(session.user.id, session.user.email);
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
      isAdmin: user?.role?.toLowerCase() === 'admin',
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
