import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { PostCard } from '@/components/posts/PostCard';
import { CommentSection } from '@/components/posts/CommentSection';
import { CommunityCard } from '@/components/community/CommunityCard';
import { useCommunityData } from '@/hooks/useCommunityData';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Comment } from '@/types';

// Mock comments data
const mockComments: Comment[] = [
  {
    id: '1',
    content: 'This is a very important issue that affects all of us. We need to hold our leaders accountable for these promises.',
    author: {
      id: '2',
      username: 'civic_warrior',
      displayName: 'Jane Wanjiku',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b593?w=32&h=32&fit=crop&crop=face',
      isVerified: true,
      role: 'citizen'
    },
    postId: '1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    upvotes: 24,
    downvotes: 2,
    userVote: null,
    depth: 0,
    isCollapsed: false,
    moderationStatus: 'approved',
    replies: [
      {
        id: '2',
        content: 'Absolutely agree! The transparency in government spending has been lacking for too long.',
        author: {
          id: '3',
          username: 'transparency_advocate',
          displayName: 'David Kiprotich',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
          isVerified: false,
          role: 'citizen'
        },
        postId: '1',
        parentId: '1',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        upvotes: 12,
        downvotes: 0,
        userVote: 'up',
        depth: 1,
        isCollapsed: false,
        moderationStatus: 'approved'
      }
    ]
  },
  {
    id: '3',
    content: 'While I appreciate the initiative, I think we also need to focus on implementation. Promises are good, but execution is what matters.',
    author: {
      id: '4',
      username: 'policy_expert',
      displayName: 'Dr. Sarah Muthoni',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
      isVerified: true,
      role: 'expert'
    },
    postId: '1',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    upvotes: 18,
    downvotes: 1,
    userVote: null,
    depth: 0,
    isCollapsed: false,
    moderationStatus: 'approved'
  }
];

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { posts, communities, voteOnPost, toggleCommunityFollow } = useCommunityData();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const post = posts.find(p => p.id === id);

  useEffect(() => {
    // Simulate loading comments
    const timer = setTimeout(() => {
      setComments(mockComments);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [id]);

  const handleAddComment = (content: string, parentId?: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      content,
      author: {
        id: 'current-user',
        username: 'current_user',
        displayName: 'Current User',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        isVerified: false,
        role: 'citizen'
      },
      postId: id!,
      parentId,
      createdAt: new Date(),
      upvotes: 1,
      downvotes: 0,
      userVote: 'up',
      depth: parentId ? 1 : 0,
      isCollapsed: false,
      moderationStatus: 'approved'
    };

    if (parentId) {
      // Add as a reply
      setComments(prev => 
        prev.map(comment => 
          comment.id === parentId 
            ? { ...comment, replies: [...(comment.replies || []), newComment] }
            : comment
        )
      );
    } else {
      // Add as a top-level comment
      setComments(prev => [newComment, ...prev]);
    }
  };

  const handleVoteComment = (commentId: string, vote: 'up' | 'down') => {
    setComments(prev => 
      prev.map(comment => {
        if (comment.id === commentId) {
          const currentVote = comment.userVote;
          let newUpvotes = comment.upvotes;
          let newDownvotes = comment.downvotes;
          let newUserVote: 'up' | 'down' | null = vote;

          // Remove previous vote
          if (currentVote === 'up') newUpvotes--;
          if (currentVote === 'down') newDownvotes--;

          // Add new vote (or remove if same)
          if (currentVote === vote) {
            newUserVote = null;
          } else {
            if (vote === 'up') newUpvotes++;
            if (vote === 'down') newDownvotes++;
          }

          return {
            ...comment,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            userVote: newUserVote
          };
        }
        
        // Handle nested replies
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => 
              reply.id === commentId 
                ? (() => {
                    const currentVote = reply.userVote;
                    let newUpvotes = reply.upvotes;
                    let newDownvotes = reply.downvotes;
                    let newUserVote: 'up' | 'down' | null = vote;

                    if (currentVote === 'up') newUpvotes--;
                    if (currentVote === 'down') newDownvotes--;

                    if (currentVote === vote) {
                      newUserVote = null;
                    } else {
                      if (vote === 'up') newUpvotes++;
                      if (vote === 'down') newDownvotes++;
                    }

                    return {
                      ...reply,
                      upvotes: newUpvotes,
                      downvotes: newDownvotes,
                      userVote: newUserVote
                    };
                  })()
                : reply
            )
          };
        }
        
        return comment;
      })
    );
  };

  if (!post) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <Header />
            <div className="container mx-auto px-4 py-6">
              <div className="text-center py-8">
                <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
                <p className="text-muted-foreground mb-4">
                  The post you're looking for doesn't exist or has been removed.
                </p>
                <Button asChild>
                  <Link to="/">Return to Feed</Link>
                </Button>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-3">
                {/* Back Navigation */}
                <Button variant="ghost" asChild className="mb-4">
                  <Link to="/" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Feed
                  </Link>
                </Button>

                {/* Post */}
                <div className="mb-6">
                  <PostCard
                    post={post}
                    onVote={voteOnPost}
                    isDetailView={true}
                  />
                </div>

                {/* Comments */}
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-20 w-full ml-6" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <CommentSection
                    postId={post.id}
                    comments={comments}
                    onAddComment={handleAddComment}
                    onVoteComment={handleVoteComment}
                  />
                )}
              </div>
              
              {/* Right Sidebar */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Community Info</h3>
                  <CommunityCard
                    community={post.community}
                    onToggleFollow={toggleCommunityFollow}
                    showDescription={true}
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Related Communities</h3>
                  <div className="space-y-4">
                    {communities
                      .filter(c => c.id !== post.community.id)
                      .slice(0, 3)
                      .map(community => (
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default PostDetail;