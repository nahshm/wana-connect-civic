import { useCommunityData } from '@/hooks/useCommunityData';
import { useAuth } from '@/contexts/AuthContext';
import { ManageCommunities } from '@/components/community/ManageCommunities';
import { ExploreCommunities } from '@/components/community/ExploreCommunities';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';

const Communities = () => {
  const { communities, toggleCommunityFollow } = useCommunityData();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mock favorite toggle functionality since it's not in the hook yet
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (communityId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(communityId)) {
        newFavorites.delete(communityId);
      } else {
        newFavorites.add(communityId);
      }
      return newFavorites;
    });
  };

  // Enhance communities with favorite status
  const communitiesWithFavorites = communities.map(c => ({
    ...c,
    isFavorite: favorites.has(c.id)
  }));

  // Handle tab state from URL or default
  const defaultTab = searchParams.get('view') === 'explore' ? 'explore' : 'manage';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams(prev => {
      if (value === 'explore') {
        prev.set('view', 'explore');
      } else {
        prev.delete('view');
      }
      return prev;
    });
  };

  // Sync with URL if it changes externally
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'explore' && activeTab !== 'explore') {
      setActiveTab('explore');
    } else if (!view && activeTab !== 'manage') {
      setActiveTab('manage');
    }
  }, [searchParams]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ExploreCommunities
          communities={communitiesWithFavorites}
          onToggleFollow={toggleCommunityFollow}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="manage">My Communities</TabsTrigger>
            <TabsTrigger value="explore">Explore</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="manage" className="space-y-4">
          <ManageCommunities
            communities={communitiesWithFavorites}
            onToggleFollow={toggleCommunityFollow}
            onToggleFavorite={toggleFavorite}
          />
        </TabsContent>

        <TabsContent value="explore" className="space-y-4">
          <ExploreCommunities
            communities={communitiesWithFavorites}
            onToggleFollow={toggleCommunityFollow}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Communities;