import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { SearchBar } from '@/components/layout/SearchBar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { User, Plus, LogOut, Users, MessageCircle, Search, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { buildProfileLink } from '@/lib/profile-links';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { CreateCommunityWizard } from '@/components/community/CreateCommunityWizard';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

/**
 * Determines the appropriate URL prefix for a user's profile
 * @param profile - User profile object
 * @returns The prefix string ('/u/', '/g/', or '/w/')
 */
const getProfilePrefix = (profile: { officialPosition?: string; officialPositionId?: string; isVerified?: boolean } | null): string => {
  if (profile?.officialPosition || profile?.officialPositionId) return '/g/';
  if (profile?.isVerified) return '/w/';
  return '/u/';
};

export const Header = () => {
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const authModal = useAuthModal();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const {
    toggleSidebar
  } = useSidebar();
  const handleSignOut = async () => {
    await signOut();
  };

  // Generate the correct profile URL with prefix
  const profileUrl = profile?.username ?
  `${getProfilePrefix(profile)}${profile.username}` :
  buildProfileLink({ username: profile?.username ?? '' });

  return <header className="sticky top-0 z-10 w-full border-b bg-sidebar-background/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar-background/60">
    <div className="w-full h-14 sm:h-16 flex items-center justify-between gap-2 sm:px-[16px] px-[12px] font-thin">
      {/* Mobile Hamburger Menu */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden hover:bg-sidebar-accent text-sidebar-foreground -ml-2 h-9 w-9">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo + Wordmark - compact on mobile */}
      <Link to="/" className="flex-shrink-0 flex items-center gap-2">
        <img
          alt="ama Logo"
          className="h-7 w-auto sm:h-8"
          width={150}
          height={49}
          fetchPriority="high"
          src="/lovable-uploads/543b08bd-f3bc-4ee3-878d-13419d22452f.png" />
      </Link>

      {/* Centered Search - Now visible on mobile too */}
      <div className="flex-1 max-w-2xl px-1 sm:px-4">
        <SearchBar 
          placeholder="Find anything" 
          className="w-full"
          onSearch={(query) => {
            navigate(`/search?q=${encodeURIComponent(query)}`);
          }} 
        />
      </div>

      {/* Right side actions - Restored to show on mobile as requested */}
      <div className="flex items-center space-x-0.5 sm:space-x-1">
        {user ? <>
          {/* Create Button - Visible on both mobile and desktop like before */}
          <Button variant="ghost" size="sm" asChild className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors font-medium h-9 px-2 sm:px-3">
            <Link to="/create" className="flex items-center">
              <Plus className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Create</span>
            </Link>
          </Button>

          {/* Chat - Visible on both */}
          <Button variant="ghost" size="icon" asChild className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors h-9 w-9">
            <Link to="/chat">
              <MessageCircle className="w-4 h-4" />
            </Link>
          </Button>

          <NotificationDropdown />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors h-9 w-9">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setWizardOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Create Community
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={profileUrl}>Profile</Link>
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
        </> : <>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => authModal.open('login')}
            className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors font-medium">
            Sign In
          </Button>
        </>}
      </div>
    </div>

    {/* Mobile Search Dialog - REMOVED as search is now in header */}

    {/* Create Community Wizard */}
    <CreateCommunityWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
  </header>;
};