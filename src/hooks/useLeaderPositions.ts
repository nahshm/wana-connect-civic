import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GovernmentPosition } from '@/types/governance';

export interface PositionWithHolder extends GovernmentPosition {
    current_holder?: {
        id: string;
        user_id: string;
        term_start: string;
        term_end: string;
        verification_status: string;
        user?: {
            id: string;
            display_name: string;
            avatar_url?: string;
        };
    } | null;
}

interface UseLeaderPositionsParams {
    levelType: 'COUNTY' | 'CONSTITUENCY' | 'WARD' | 'COMMUNITY';
    locationValue: string;
    enabled?: boolean;
}

/**
 * Custom hook to fetch government positions with their current holders
 * Uses React Query for caching, deduplication, and automatic retries
 */
export function useLeaderPositions({ levelType, locationValue, enabled = true }: UseLeaderPositionsParams) {
    return useQuery({
        queryKey: ['leader-positions', levelType, locationValue],
        queryFn: async (): Promise<PositionWithHolder[]> => {
            // Map levelType to governance_level
            const governanceLevel = levelType.toLowerCase();

            // Clean locationValue: remove level suffixes
            const cleanedLocation = locationValue
                .replace(/\s*(county|constituency|ward)\s*$/i, '')
                .trim();

            const jurisdictionCode = cleanedLocation.toLowerCase().replace(/\s+/g, '-');

            // Step 1: Fetch all positions for this governance level and location
            const { data: positionsData, error: posError } = await supabase
                .from('government_positions')
                .select('*')
                .eq('governance_level', governanceLevel)
                .or(`jurisdiction_code.ilike.%${jurisdictionCode}%,jurisdiction_name.ilike.%${cleanedLocation}%`)
                .order('authority_level', { ascending: false });

            if (posError) {
                throw new Error(`Failed to fetch positions: ${posError.message}`);
            }

            if (!positionsData || positionsData.length === 0) {
                return [];
            }

            // Step 2: Batch fetch all verified holders for these positions (single query instead of N queries)
            const positionIds = positionsData.map(p => p.id);

            const { data: holdersData, error: holdersError } = await supabase
                .from('office_holders')
                .select(`
                    id,
                    position_id,
                    user_id,
                    term_start,
                    term_end,
                    verification_status
                `)
                .in('position_id', positionIds)
                .eq('is_active', true)
                .eq('verification_status', 'verified');

            if (holdersError) {
                console.warn('Error fetching holders:', holdersError);
                // Continue without holders rather than failing entirely
            }

            // Step 3: Batch fetch all user profiles for holders (single query)
            const userIds = holdersData?.map(h => h.user_id).filter(Boolean) || [];
            let profilesMap: Record<string, { id: string; display_name: string; avatar_url?: string }> = {};

            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, display_name, avatar_url')
                    .in('id', userIds);

                if (profilesData) {
                    profilesMap = profilesData.reduce((acc, profile) => {
                        acc[profile.id] = profile;
                        return acc;
                    }, {} as Record<string, typeof profilesData[0]>);
                }
            }

            // Step 4: Join the data together
            const holdersMap = (holdersData || []).reduce((acc, holder) => {
                acc[holder.position_id] = {
                    ...holder,
                    user: profilesMap[holder.user_id] || null
                };
                return acc;
            }, {} as Record<string, any>);

            // Combine positions with their holders
            return positionsData.map(position => ({
                ...position,
                current_holder: holdersMap[position.id] || null
            }));
        },
        enabled: enabled && !!locationValue,
        staleTime: 5 * 60 * 1000, // 5 minutes - positions don't change often
        gcTime: 30 * 60 * 1000, // 30 minutes cache
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    });
}
