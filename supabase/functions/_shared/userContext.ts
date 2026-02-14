
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface UserContext {
  // Identity
  userId: string;
  name: string;
  role: string;
  verifiedRole: boolean;
  
  // Location
  location: {
    county: string;
    constituency?: string;
    ward?: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Interests & Preferences
  interests: string[];
  expertiseAreas: string[];
  preferredLanguage: string;
  
  // Activity Patterns
  activity: {
    issuesReportedRecently: number;
    issueTypesReported: string[];
    promisesTracked: number;
    postsCreated: number;
    commentsCreated: number;
    followingPoliticians: string[];
    mostActiveCategory?: string;
  };
  
  // Engagement
  engagementScore: number;
  totalContributions: number;
  lastActive: Date;
}

/**
 * Gather complete user context for AI personalization
 * Uses caching for performance
 */
export async function getUserContext(
  supabase: SupabaseClient,
  userId: string
): Promise<UserContext> {
  
  // 1. Try cache first (90% of requests)
  const { data: cached } = await supabase
    .from('user_context_cache')
    .select('context_json, last_updated')
    .eq('user_id', userId)
    .single();
  
  // Cache is valid for 1 hour
  if (cached && Date.now() - new Date(cached.last_updated).getTime() < 3600000) {
    return cached.context_json as UserContext;
  }
  
  // 2. Fetch fresh data (parallel queries for speed)
  const [profileResult, activityResult] = await Promise.all([
    // Profile data
    supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        county,
        constituency,
        ward,
        coordinates,
        role,
        verified_role,
        interests,
        expertise_areas,
        preferred_language,
        engagement_score,
        total_contributions,
        last_active_at
      `)
      .eq('id', userId)
      .single(),
    
    // Activity summary
    supabase
      .from('user_activity_context')
      .select('*')
      .eq('user_id', userId)
      .single()
  ]);
  
  const profile = profileResult.data;
  const activity = activityResult.data;
  
  if (!profile) {
    // If no profile, throw or return default
    // For now, let's return a default context if profile is missing (e.g. new user)
    // Or throw if strictly required. The guide says "throw new Error", but new users might not have profiles?
    // Actually AUTH user should have profile.
    if (!profile) throw new Error('User profile not found');
  }
  
  // 3. Compile context
  const context: UserContext = {
    userId,
    name: profile.full_name || 'Citizen',
    role: profile.role || 'citizen',
    verifiedRole: profile.verified_role || false,
    
    location: {
      county: profile.county || 'Kenya',
      constituency: profile.constituency,
      ward: profile.ward,
      coordinates: profile.coordinates
    },
    
    interests: profile.interests || [],
    expertiseAreas: profile.expertise_areas || [],
    preferredLanguage: profile.preferred_language || 'en',
    
    activity: {
      issuesReportedRecently: activity?.issues_reported_30d || 0,
      issueTypesReported: activity?.issue_types_reported || [],
      promisesTracked: activity?.promises_tracked_30d || 0,
      postsCreated: activity?.posts_made_30d || 0,
      commentsCreated: activity?.comments_made_30d || 0,
      followingPoliticians: activity?.politicians_following || [],
      mostActiveCategory: activity?.most_active_category
    },
    
    engagementScore: profile.engagement_score || 0,
    totalContributions: profile.total_contributions || 0,
    lastActive: new Date(profile.last_active_at || Date.now())
  };
  
  // 4. Cache for next time
  await supabase
    .from('user_context_cache')
    .upsert({
      user_id: userId,
      context_json: context,
      last_updated: new Date().toISOString()
    });
  
  return context;
}
