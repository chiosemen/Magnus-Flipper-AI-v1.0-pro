import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types';

export function useUser() {
  const { user, setUser, setLoading } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          const userData: User = {
            id: authUser.id,
            email: authUser.email!,
            full_name: profile?.full_name || authUser.user_metadata?.full_name,
            avatar_url: profile?.avatar_url,
            created_at: authUser.created_at!,
            updated_at: profile?.updated_at || authUser.created_at!,
          };

          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const userData: User = {
          id: session.user.id,
          email: session.user.email!,
          full_name:
            profile?.full_name || session.user.user_metadata?.full_name,
          avatar_url: profile?.avatar_url,
          created_at: session.user.created_at!,
          updated_at: profile?.updated_at || session.user.created_at!,
        };

        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, supabase]);

  return {
    user,
    isLoading,
  };
}
