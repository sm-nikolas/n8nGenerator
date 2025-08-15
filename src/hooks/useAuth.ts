import { useState, useEffect, useCallback } from 'react';
import { User, Session, Provider } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AUTH_CONFIG, AUTH_STATES, type AuthState } from '../config/auth';
import { toast } from 'react-toastify';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>(AUTH_STATES.LOADING);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        toast.error('Erro ao verificar sessão. Tente novamente.');
        setAuthState(AUTH_STATES.ERROR);
      } else if (session) {
        setSession(session);
        setUser(session.user);
        setAuthState(AUTH_STATES.AUTHENTICATED);
      } else {
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setSession(session);
        setUser(session.user);
        setAuthState(AUTH_STATES.AUTHENTICATED);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setAuthState(AUTH_STATES.UNAUTHENTICATED);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
        setUser(session.user);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        toast.error('Erro no login com Google. Tente novamente.');
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      toast.error('Falha no login com Google. Tente novamente.');
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Sign in failed') 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('Erro ao fazer logout. Tente novamente.');
        throw error;
      }

      return { error: null };
    } catch (error) {
      toast.error('Falha ao fazer logout. Tente novamente.');
      return { 
        error: error instanceof Error ? error : new Error('Sign out failed') 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserProfile = useCallback(async () => {
    if (!user) return { data: null, error: new Error('No user logged in') };
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        toast.error('Erro ao buscar perfil do usuário. Tente novamente.');
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      toast.error('Falha ao buscar perfil do usuário. Tente novamente.');
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to fetch profile') 
      };
    }
  }, [user]);

  const updateUserProfile = useCallback(async (updates: any) => {
    if (!user) return { data: null, error: new Error('No user logged in') };
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      
      if (error) {
        toast.error('Erro ao atualizar perfil do usuário. Tente novamente.');
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      toast.error('Falha ao atualizar perfil do usuário. Tente novamente.');
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to update profile') 
      };
    }
  }, [user]);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        toast.error('Erro ao renovar sessão. Tente novamente.');
        throw error;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      return { data, error: null };
    } catch (error) {
      toast.error('Falha ao renovar sessão. Tente novamente.');
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Session refresh failed') 
      };
    }
  }, []);

  return {
    user,
    session,
    loading,
    authState,
    signInWithGoogle,
    signOut,
    getUserProfile,
    updateUserProfile,
    refreshSession,
  };
}
