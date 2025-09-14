import { useState } from 'react';
import { FeedHeader } from '@/components/feed/FeedHeader';
import { PostCard } from '@/components/posts/PostCard';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { useCommunityData } from '@/hooks/useCommunityData';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { posts, loading, voteOnPost } = useCommunityData();
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');

  if (loading) {
    return (
      <div>
        <FeedHeader 
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <div className="flex gap-6 max-w-screen-xl mx-auto px-4">
          {/* Main Feed */}
          <div className="flex-1 max-w-2xl">
            <div className="space-y-4 py-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-sidebar-background border border-sidebar-border rounded-lg p-4">
                  <div className="flex space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-16 w-full" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="hidden lg:block w-80">
            <div className="sticky top-32 py-4">
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sort posts based on selected sort option
  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'hot':
        // Simple hot algorithm: score + recency bonus
        const scoreA = (a.upvotes - a.downvotes) + (Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const scoreB = (b.upvotes - b.downvotes) + (Date.now() - b.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return scoreB - scoreA;
      case 'new':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'top':
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case 'rising':
        // Simple rising: recent posts with good ratio
        const ratioA = a.upvotes / Math.max(a.downvotes, 1);
        const ratioB = b.upvotes / Math.max(b.downvotes, 1);
        return ratioB - ratioA;
      default:
        return 0;
    }
  });

  return (
    <div>
      <FeedHeader 
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <div className="flex gap-6 max-w-screen-xl mx-auto px-4">
        {/* Main Feed */}
        <div className="flex-1 max-w-2xl">
          <div className={viewMode === 'card' ? 'space-y-2 py-4' : 'py-4'}>
            {sortedPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onVote={voteOnPost}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div className="hidden lg:block w-80">
          <div className="sticky top-32 py-4">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
