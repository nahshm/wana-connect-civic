import { Header } from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { CreatePostForm } from '@/components/posts/CreatePostForm';
import { useCommunityData } from '@/hooks/useCommunityData';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CreatePost = () => {
  const { communities, addPost } = useCommunityData();

  const handleCreatePost = (postData: any) => {
    // Generate a new post with mock data
    const newPost = {
      id: Date.now().toString(),
      title: postData.title,
      content: postData.content,
      author: {
        id: 'current-user',
        username: 'current_user',
        displayName: 'Current User',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        isVerified: false,
        role: 'citizen' as const
      },
      community: communities.find(c => c.id === postData.communityId) || communities[0],
      createdAt: new Date(),
      upvotes: 1,
      downvotes: 0,
      commentCount: 0,
      userVote: 'up' as const,
      tags: postData.tags || [],
      flair: postData.flair
    };

    addPost?.(newPost);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          
          <div className="container mx-auto px-4 py-6">
            <div className="max-w-4xl mx-auto">
              {/* Back Navigation */}
              <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4">
                  <Link to="/" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Feed
                  </Link>
                </Button>
                
                <div className="mb-2">
                  <h1 className="text-3xl font-bold">Create a Post</h1>
                  <p className="text-muted-foreground">
                    Share your thoughts, civic concerns, or start a discussion in your community
                  </p>
                </div>
              </div>

              {/* Create Post Form */}
              <CreatePostForm
                communities={communities}
                onSubmit={handleCreatePost}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CreatePost;