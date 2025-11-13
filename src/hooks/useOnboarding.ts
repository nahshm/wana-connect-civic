import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useOnboarding = () => {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      setNeedsOnboarding(!profile?.onboarding_completed);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  return { needsOnboarding, loading };
};
