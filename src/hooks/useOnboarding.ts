import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useOnboarding = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    // Use profile from AuthContext which is the single source of truth
    if (profile) {
      setNeedsOnboarding(!profile.onboardingCompleted);
      setLoading(false);
    } else {
      // If profile is null but user exists, we might still be loading profile
      // or profile doesn't exist (which means needs onboarding or error)
      // We'll let AuthContext handle the profile fetching and just wait
      setLoading(true);
    }
  }, [user, profile, authLoading]);

  return { needsOnboarding, loading };
};
