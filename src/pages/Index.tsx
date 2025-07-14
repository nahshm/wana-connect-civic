import { Header } from '@/components/layout/Header';
import { CommunityCard } from '@/components/community/CommunityCard';
import { PostCard } from '@/components/posts/PostCard';
import { useCommunityData } from '@/hooks/useCommunityData';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { communities, posts, loading, toggleCommunityFollow, voteOnPost } = useCommunityData();

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Popular Discussions</h2>
              <p className="text-muted-foreground">
                Stay informed about governance, accountability, and civic participation in Kenya
              </p>
            </div>
            
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onVote={voteOnPost}
                />
              ))}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Featured Communities</h3>
              <div className="space-y-4">
                {communities.slice(0, 4).map(community => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    onToggleFollow={toggleCommunityFollow}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
