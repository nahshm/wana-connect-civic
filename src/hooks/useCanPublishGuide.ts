import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** True for admins and verified experts — the only people the server lets publish Guide posts. */
export function useCanPublishGuide(): boolean {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['can-publish-guide', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [admin, expert] = await Promise.all([
        (supabase.rpc as any)('is_admin'),
        supabase.from('user_expertise').select('id').eq('user_id', user!.id).eq('is_verified', true).limit(1),
      ]);
      return admin.data === true || (expert.data?.length ?? 0) > 0;
    },
  });
  return data === true;
}
