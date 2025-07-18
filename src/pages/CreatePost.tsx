import { Header } from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          
          <div className="flex gap-6 max-w-screen-xl mx-auto px-4 py-6">
            {/* Main Content */}
            <div className="flex-1 max-w-4xl">
              {/* Back Navigation */}
              <div className="mb-6">
                <Button variant="ghost" asChild className="mb-4 text-sidebar-muted-foreground hover:text-sidebar-foreground">
                  <Link to="/" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Feed
                  </Link>
                </Button>
                
                <div className="mb-2">
                  <h1 className="text-3xl font-bold text-sidebar-foreground">Create a Post</h1>
                  <p className="text-sidebar-muted-foreground">
                    Share your thoughts, civic concerns, or start a discussion in your community
                  </p>
                </div>
              </div>

              {/* Create Post Form */}
              <div className="bg-sidebar-background border border-sidebar-border rounded-lg">
                <CreatePostForm
                  communities={communities}
                  onSubmit={handleCreatePost}
                />
              </div>
            </div>
            
            {/* Right Sidebar */}
            <div className="hidden lg:block w-80">
              <div className="sticky top-24">
                <RightSidebar />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default CreatePost;