import { lazy, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const OfficePage = lazy(() => import('./OfficePage'));

/** Old /g/:holderId links now open the unified Office Hub for that holder's position. */
export default function OfficeHolderRedirect() {
  const id = useLocation().pathname.split('/')[2];
  const { data, isLoading } = useQuery({
    queryKey: ['office-holder-redirect', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('office_holders')
        .select('government_positions(country_code, governance_level, position_code)')
        .eq('id', id)
        .maybeSingle();
      const pos = (data as any)?.government_positions;
      if (!pos?.position_code) return null;
      const [, j = '', r = ''] = String(pos.position_code).split(':');
      return `/office/${pos.country_code.toLowerCase()}/${pos.governance_level.toLowerCase()}/${j.toLowerCase()}/${r.toLowerCase()}`;
    },
  });
  const spinner = <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (isLoading) return spinner;
  if (data) return <Navigate to={data} replace />;
  return <Suspense fallback={spinner}><OfficePage /></Suspense>;
}
