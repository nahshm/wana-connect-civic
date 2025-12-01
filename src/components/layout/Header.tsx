import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/layout/SearchBar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Bell, User, Plus, LogOut, Users, MessageCircle, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CreateCommunityWizard } from '@/components/community/CreateCommunityWizard';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="w-full border-b bg-sidebar-background/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar-background/60 z-10 relative">
      <div className="w-full px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img
            src="/logo.png"
            alt="ama Logo"
            className="h-8 sm:h-10 w-auto"
          />
        </Link>

        {/* Centered Search */}
        <div className="hidden md:flex flex-1 max-w-2xl">
          <SearchBar
            placeholder="Search discussions, communities, users..."
            className="w-full bg-sidebar-background border-sidebar-border focus-within:border-sidebar-ring"
            onSearch={(query, filters) => {
              console.log('Search:', query, filters);
              navigate(`/search?q=${encodeURIComponent(query)}`);
            }}
          />
        </div>

        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-sidebar-accent text-sidebar-foreground"
          onClick={() => setMobileSearchOpen(true)}
        >
          <Search className="w-4 h-4" />
        </Button>

        {/* Right side actions */}
        <div className="flex items-center space-x-0.5 sm:space-x-1">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors font-medium h-8 sm:h-9"
              >
                <Link to="/create" className="flex items-center">
                  <Plus className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Create</span>
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                asChild
                className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors h-8 w-8 sm:h-9 sm:w-9"
              >
                <Link to="/chat">
                  <MessageCircle className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors h-8 w-8 sm:h-9 sm:w-9"
              >
                <Bell className="w-4 h-4" />
              </Button>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setWizardOpen(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Create Community
                  </DropdownMenuItem>                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${profile?.username || user.id}`}>Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors font-medium"
              >
                <Link to="/auth">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Search Dialog */}
      <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <SearchBar
              placeholder="Search discussions, communities, users..."
              className="w-full"
              onSearch={(query, filters) => {
                console.log('Search:', query, filters);
                navigate(`/search?q=${encodeURIComponent(query)}`);
                setMobileSearchOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Community Wizard */}
      <CreateCommunityWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </header>
  );
};
