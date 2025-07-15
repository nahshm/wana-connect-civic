import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, Bell, User, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center">
        <SidebarTrigger className="mr-4" />
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-primary">WanaIQ</h1>
          
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search communities, posts..."
              className="w-80 pl-10"
            />
          </div>
        </div>
        
        <div className="ml-auto flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/create">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Create</span>
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon">
            <Bell className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="icon">
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};