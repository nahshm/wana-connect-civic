import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Mirrors the server-side aiFeatureGate: missing flag = on, lookup error = off. */
export function useAiFeatureEnabled(key: string) {
  const q = useQuery({
    queryKey: ['ai-feature-flag', key],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('feature_flags').select('is_enabled').eq('feature_key', key).maybeSingle();
      if (error) return false;
      return data ? data.is_enabled === true : true;
    },
  });
  return { enabled: q.data, isLoading: q.isLoading };
}
