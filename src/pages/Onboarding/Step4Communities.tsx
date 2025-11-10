import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

interface Step4CommunitiesProps {
  onBack: () => void;
  onboardingData: {
    countyId: string;
    constituencyId: string;
    wardId: string;
    interests: string[];
    persona: string;
  };
}

interface Community {
  id: string;
  name: string;
  display_name: string;
  description: string;
  member_count: number;
  isGeo: boolean;
}

const Step4Communities = ({ onBack, onboardingData }: Step4CommunitiesProps) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadRecommendedCommunities();
  }, []);

  const loadRecommendedCommunities = async () => {
    // Load geographic communities
    const geoNames = await getGeographicCommunityNames();
    
    // Load interest-based communities
    const { data: interestCommunities } = await supabase
      .from('communities')
      .select('*')
      .in('category', ['Education', 'Healthcare', 'Infrastructure', 'Security', 'Environment'])
      .limit(5);

    const allCommunities: Community[] = [
      ...geoNames.map(c => ({ ...c, isGeo: true })),
      ...(interestCommunities || []).map(c => ({ ...c, isGeo: false })),
    ];

    setCommunities(allCommunities);
    
    // Auto-select geographic communities
    setSelectedCommunities(geoNames.map(c => c.id));
  };

  const getGeographicCommunityNames = async () => {
    const names: Community[] = [];
    
    // Get county name
    const { data: county } = await supabase
      .from('counties')
      .select('name')
      .eq('id', onboardingData.countyId)
      .single();
    
    if (county) {
      names.push({
        id: `geo-county-${onboardingData.countyId}`,
        name: `c/${county.name.replace(/\s+/g, '')}`,
        display_name: `${county.name} County`,
        description: 'Your county community',
        member_count: 0,
        isGeo: true,
      });
    }

    // Get constituency name
    const { data: constituency } = await supabase
      .from('constituencies')
      .select('name')
      .eq('id', onboardingData.constituencyId)
      .single();
    
    if (constituency) {
      names.push({
        id: `geo-constituency-${onboardingData.constituencyId}`,
        name: `c/${constituency.name.replace(/\s+/g, '')}`,
        display_name: `${constituency.name} Constituency`,
        description: 'Your constituency community',
        member_count: 0,
        isGeo: true,
      });
    }

    // Get ward name
    const { data: ward } = await supabase
      .from('wards')
      .select('name')
      .eq('id', onboardingData.wardId)
      .single();
    
    if (ward) {
      names.push({
        id: `geo-ward-${onboardingData.wardId}`,
        name: `c/${ward.name.replace(/\s+/g, '')}`,
        display_name: `${ward.name} Ward`,
        description: 'Your ward community',
        member_count: 0,
        isGeo: true,
      });
    }

    return names;
  };

  const toggleCommunity = (communityId: string) => {
    setSelectedCommunities((prev) =>
      prev.includes(communityId)
        ? prev.filter((id) => id !== communityId)
        : [...prev, communityId]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Update profile with location and persona
      await supabase
        .from('profiles')
        .update({
          county_id: onboardingData.countyId,
          constituency_id: onboardingData.constituencyId,
          ward_id: onboardingData.wardId,
          persona: onboardingData.persona as 'active_citizen' | 'community_organizer' | 'civic_learner' | 'government_watcher' | 'professional',
          onboarding_completed: true,
        })
        .eq('id', user.id);

      // Save user interests
      if (onboardingData.interests.length > 0) {
        const interestInserts = onboardingData.interests.map(interestId => ({
          user_id: user.id,
          interest_id: interestId,
        }));
        
        await supabase
          .from('user_interests')
          .insert(interestInserts);
      }

      // Update onboarding progress
      await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: user.id,
          step_completed: 4,
          location_set: true,
          interests_set: true,
          persona_set: true,
          communities_joined: selectedCommunities.length,
          completed_at: new Date().toISOString(),
        });

      toast.success('Welcome to WanaIQ! 🎉');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Join Your Communities</h2>
          <p className="text-sm text-muted-foreground">
            We've selected communities based on your location and interests
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {communities.map((community) => (
          <div
            key={community.id}
            className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedCommunities.includes(community.id)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            } ${community.isGeo ? 'bg-accent/20' : ''}`}
            onClick={() => !community.isGeo && toggleCommunity(community.id)}
          >
            <Checkbox
              checked={selectedCommunities.includes(community.id)}
              onCheckedChange={() => !community.isGeo && toggleCommunity(community.id)}
              disabled={community.isGeo}
            />
            <Label className="cursor-pointer flex-1">
              <div className="font-semibold text-foreground">
                {community.display_name}
                {community.isGeo && (
                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                    Auto-joined
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {community.description}
              </div>
              {community.member_count > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {community.member_count.toLocaleString()} members
                </div>
              )}
            </Label>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleComplete} disabled={loading}>
          {loading ? 'Setting up...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );
};

export default Step4Communities;
