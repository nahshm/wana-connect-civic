import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { CommunityCard } from '@/components/community/CommunityCard';
import { useCommunityData } from '@/hooks/useCommunityData';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, Users, Star } from 'lucide-react';
import type { Community } from '@/types';

const Communities = () => {
  const { communities, toggleCommunityFollow } = useCommunityData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Community['category'] | 'all'>('all');

  const categories = [
    { id: 'all', label: 'All Communities', icon: Users },
    { id: 'governance', label: 'Governance', icon: TrendingUp },
    { id: 'accountability', label: 'Accountability', icon: Star },
    { id: 'civic-education', label: 'Civic Education', icon: Users },
    { id: 'discussion', label: 'Discussion', icon: Users }
  ] as const;

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || community.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularCommunities = [...communities]
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 6);

  const followedCommunities = communities.filter(c => c.isFollowing);

  const trendingCommunities = [...communities]
    .sort((a, b) => {
      // Simple trending score based on member count and whether user follows
      const aScore = a.memberCount + (a.isFollowing ? 1000 : 0);
      const bScore = b.memberCount + (b.isFollowing ? 1000 : 0);
      return bScore - aScore;
    })
    .slice(0, 6);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          
          <div className="container mx-auto px-4 py-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Communities</h1>
              <p className="text-muted-foreground">
                Join discussions about governance, accountability, and civic participation in Kenya
              </p>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search communities..."
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id as any)}
                    className="text-xs"
                  >
                    <category.icon className="w-3 h-3 mr-1" />
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Communities</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    All Communities
                    {searchQuery && ` matching "${searchQuery}"`}
                    {selectedCategory !== 'all' && ` in ${selectedCategory.replace('-', ' ')}`}
                  </h2>
                  <Badge variant="outline">
                    {filteredCommunities.length} communities
                  </Badge>
                </div>
                
                {filteredCommunities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No communities found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCommunities.map(community => (
                      <CommunityCard
                        key={community.id}
                        community={community}
                        onToggleFollow={toggleCommunityFollow}
                        showDescription={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="popular" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Popular Communities</h2>
                  <Badge variant="outline">Top by members</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularCommunities.map(community => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      onToggleFollow={toggleCommunityFollow}
                      showDescription={true}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="following" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Following</h2>
                  <Badge variant="outline">{followedCommunities.length} communities</Badge>
                </div>
                
                {followedCommunities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      You're not following any communities yet.
                    </p>
                    <Button onClick={() => setSelectedCategory('all')}>
                      Browse Communities
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {followedCommunities.map(community => (
                      <CommunityCard
                        key={community.id}
                        community={community}
                        onToggleFollow={toggleCommunityFollow}
                        showDescription={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trending" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Trending Communities</h2>
                  <Badge variant="outline">Hot discussions</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingCommunities.map(community => (
                    <CommunityCard
                      key={community.id}
                      community={community}
                      onToggleFollow={toggleCommunityFollow}
                      showDescription={true}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Communities;