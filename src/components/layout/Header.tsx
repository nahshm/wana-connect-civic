import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SearchBar } from '@/components/layout/SearchBar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Bell, User, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center">
        <SidebarTrigger className="mr-4" />
        <div className="flex items-center space-x-6 flex-1">
          <h1 className="text-xl font-bold text-primary">WanaIQ</h1>
          
          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchBar 
              placeholder="Search discussions, communities, users..."
              className="w-full"
              onSearch={(query, filters) => {
                console.log('Search:', query, filters);
                // TODO: Implement search functionality
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/create">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Create</span>
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon">
            <Bell className="w-4 h-4" />
          </Button>
          
          <ThemeToggle />
          
          <Button variant="ghost" size="icon">
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};