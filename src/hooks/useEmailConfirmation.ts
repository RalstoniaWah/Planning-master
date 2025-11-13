import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useEmailConfirmation = () => {
  const { user } = useAuth();

  useEffect(() => {
    const createProfileAfterConfirmation = async (user: any) => {
      if (!user || !user.email_confirmed_at) return;

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) return;

      // Create profile from user metadata
      const metadata = user.user_metadata || {};
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          first_name: metadata.first_name || '',
          last_name: metadata.last_name || '',
          email: user.email,
          company_name: metadata.company_name || ''
        });

      if (profileError) {
        console.error('Profile creation error after confirmation:', profileError);
      }
    };

    if (user && user.email_confirmed_at) {
      createProfileAfterConfirmation(user);
    }
  }, [user]);
};