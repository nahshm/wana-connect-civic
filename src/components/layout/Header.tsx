import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SearchBar } from '@/components/layout/SearchBar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Bell, User, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <SidebarTrigger className="mr-4 hover:bg-accent" />
        <div className="flex items-center space-x-6 flex-1">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-civic-green bg-clip-text text-transparent">
            WanaIQ
          </h1>
          
          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchBar 
              placeholder="Search discussions, communities, users..."
              className="w-full border-border/50 focus-within:border-primary/50"
              onSearch={(query, filters) => {
                console.log('Search:', query, filters);
                // TODO: Implement search functionality
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Link to="/create">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline font-medium">Create</span>
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Bell className="w-4 h-4" />
          </Button>
          
          <ThemeToggle />
          
          <Button 
            variant="ghost" 
            size="icon"
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};