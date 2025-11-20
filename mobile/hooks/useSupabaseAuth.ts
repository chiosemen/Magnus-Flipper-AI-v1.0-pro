// mobile/hooks/useSupabaseAuth.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/useAuth';

export function useSupabaseAuth() {
  const setUser = useAuth((s) => s.setUser);
  const setLoading = useAuth((s) => s.setLoading);

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (isMounted) {
          setUser(session?.user ?? null);
        }
      } catch (e) {
        console.error('[Auth] getSession error', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setUser, setLoading]);
}
