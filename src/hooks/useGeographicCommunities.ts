import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CommunityProfile } from '@/types';

// Utility function to convert snake_case keys to camelCase recursively
function toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result: any, key: string) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {});
    }
    return obj;
}

interface GeographicCommunities {
    county?: CommunityProfile;
    constituency?: CommunityProfile;
    ward?: CommunityProfile;
}

async function fetchGeographicCommunities(
    userId: string,
    signal?: AbortSignal
): Promise<GeographicCommunities> {
    // Step 1: Get user's location names directly from profile text columns
    const { data: profile } = await supabase
        .from('profiles')
        .select('county, constituency, ward')
        .eq('id', userId)
        .abortSignal(signal)
        .single();

    if (!profile) return {};

    // Build a list of location values to search
    const locationFilters: Array<{ type: string; value: string }> = [];

    // Trim and skip empty strings — empty location values would match phantom communities
    const county = profile.county?.trim() || null;
    const constituency = profile.constituency?.trim() || null;
    const ward = profile.ward?.trim() || null;

    if (county) {
        locationFilters.push({ type: 'county', value: county });
    }
    if (constituency) {
        locationFilters.push({ type: 'constituency', value: constituency });
    }
    if (ward) {
        locationFilters.push({ type: 'ward', value: ward });
    }

    if (locationFilters.length === 0) return {};

    // Step 2: Single query for all geographic communities using OR conditions
    const locationValues = locationFilters.map(f => f.value);
    const { data: communities } = await supabase
        .from('communities')
        .select('*')
        .eq('type', 'location')
        .in('location_value', locationValues)
        .abortSignal(signal);

    if (!communities) return {};

    // Step 3: Map results by location_type
    const result: GeographicCommunities = {};

    for (const comm of communities) {
        const camelComm = toCamelCase(comm);
        if (comm.location_type === 'county') {
            result.county = camelComm;
        } else if (comm.location_type === 'constituency') {
            result.constituency = camelComm;
        } else if (comm.location_type === 'ward') {
            result.ward = camelComm;
        }
    }

    return result;
}

export const useGeographicCommunities = () => {
    const { user } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: ['geographicCommunities', user?.id],
        queryFn: ({ signal }) => fetchGeographicCommunities(user!.id, signal),
        enabled: !!user,
        staleTime: 10 * 60 * 1000, // 10 minutes - location rarely changes
        gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    });

    return {
        geoCommunities: data ?? {},
        isLoading,
        error,
    };
};
