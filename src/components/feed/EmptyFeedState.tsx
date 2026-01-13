import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, TrendingUp, Users, MessageCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyFeedProps {
  onCreatePost?: () => void;
}

export const EmptyFeedState = ({ onCreatePost }: EmptyFeedProps) => {
  const examplePosts = [
    {
      title: 'How can we improve public transport in Nairobi?',
      category: 'Infrastructure',
      votes: 247,
      comments: 63,
      gradient: 'from-civic-blue to-civic-green',
    },
    {
      title: 'Success: Community fundraiser reached KES 500K!',
      category: 'Community',
      votes: 189,
      comments: 45,
      gradient: 'from-civic-green to-emerald-400',
    },
    {
      title: 'County budget allocation transparency concerns',
      category: 'Accountability',
      votes: 312,
      comments: 91,
      gradient: 'from-civic-orange to-amber-400',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-civic-green/20 to-civic-blue/20 blur-3xl rounded-full animate-pulse"></div>
          <Sparkles className="relative w-20 h-20 text-civic-green mx-auto" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-civic-green to-civic-blue bg-clip-text text-transparent">
          Welcome to Your Civic Feed
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Join thousands of Kenyans making their voices heard. Share ideas, hold leaders accountable, and drive change in your community.
        </p>
      </div>

      {/* Example Posts Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
        {examplePosts.map((example, index) => (
          <Card 
            key={index} 
            className="hover:scale-105 transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary/30 hover:shadow-lg"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-4">
              <div className={`h-1 w-12 bg-gradient-to-r ${example.gradient} rounded-full mb-3`}></div>
              <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {example.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {example.votes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {example.comments}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Button 
          size="lg" 
          className="bg-gradient-to-r from-civic-green to-civic-green/80 hover:from-civic-green/90 hover:to-civic-green/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
          onClick={onCreatePost}
          asChild={!onCreatePost}
        >
          {onCreatePost ? (
            <>
              <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Create Your First Post
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </>
          ) : (
            <Link to="/submit">
              <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Create Your First Post
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Link>
          )}
        </Button>
        <Button 
          size="lg" 
          variant="outline"
          className="group hover:bg-sidebar-accent"
          asChild
        >
          <Link to="/communities">
            <Users className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Explore Communities
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-12 grid grid-cols-3 gap-8 text-center">
        <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="text-2xl font-bold text-civic-green">12K+</div>
          <div className="text-xs text-muted-foreground">Active Citizens</div>
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="text-2xl font-bold text-civic-blue">8K+</div>
          <div className="text-xs text-muted-foreground">Discussions</div>
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <div className="text-2xl font-bold text-civic-orange">45+</div>
          <div className="text-xs text-muted-foreground">Communities</div>
        </div>
      </div>
    </div>
  );
};
