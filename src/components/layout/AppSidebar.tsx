import { useState } from 'react';
import { Home, Video, TrendingUp, Globe, Plus, Settings, Star, Building2, User, Building, Users, Scale, ShieldCheck } from 'lucide-react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { CreateCommunityWizard } from '@/components/community/CreateCommunityWizard';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from '@/components/ui/sidebar';
import { useOfficeHolderId } from '@/hooks/useOfficeHolderId';
import { usePrimaryCommunity } from '@/hooks/usePrimaryCommunity';
import { SetLocationModal } from '@/components/community/SetLocationModal';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { CivicClipsCategoryTabs, CivicCategory } from '@/components/video/CivicClipsCategoryTabs';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
const mainItems = [{
  title: 'For You',
  url: '/',
  icon: Home
}, {
  title: 'Clips',
  url: '/civic-clips',
  icon: Video
}, {
  title: 'Popular',
  url: '/popular',
  icon: TrendingUp
}, {
  title: 'Discover',
  url: '/discover',
  icon: Building2
}, {
  title: 'Explore',
  url: '/explore',
  icon: Globe
}];
export function AppSidebar() {
  const {
    state,
    isMobile,
    setOpenMobile
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed' && !isMobile;
  const { user, profile } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const {
    officeHolderId,
    isLoading
  } = useOfficeHolderId();
  const {
    hasLocation,
    isLoading: communityLoading,
    path: primaryCommunityPath
  } = usePrimaryCommunity();
  const [searchParams, setSearchParams] = useSearchParams();
  const isClipsPage = currentPath === '/civic-clips';

  const handleCategoryChange = (category: CivicCategory | null) => {
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  const activeCategory = searchParams.get('category') as CivicCategory | null;

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };
  const getNavCls = ({
    isActive


  }: {isActive: boolean;}) => isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground transition-colors';

  // Handler for My Communities click
  const handleMyCommunitiesClick = (e: React.MouseEvent) => {
    if (!hasLocation && !communityLoading) {
      e.preventDefault();
      setLocationModalOpen(true);
    }
  };
  return <Sidebar collapsible="icon" variant="sidebar">
    <SidebarContent className="gap-0 py-2 bg-popover px-0">
      {/* Platform Identity - Only on /civic-clips */}
      {isClipsPage && (
        <SidebarGroup className="px-5 py-4 mb-2 animate-in slide-in-from-top duration-500 overflow-hidden">
          <Link to="/civic-clips" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
              <Video className="h-6 w-6 stroke-[2.5]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight leading-none text-foreground">CivicClips</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mt-1">Beta</span>
              </div>
            )}
          </Link>
        </SidebarGroup>
      )}

      <SidebarGroup className="px-2">
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {mainItems.map((item) => <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-md" onClick={handleNavClick}>
                <NavLink to={item.url} end className={getNavCls}>
                  <item.icon className="h-5 w-5" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      
      {/* Civic Clips Navigation - Only on /civic-clips */}
      {isClipsPage && (
        <SidebarGroup className="px-2 pt-4 border-t border-sidebar-border/40 animate-in slide-in-from-left duration-300">
          <SidebarGroupLabel className={collapsed ? 'sr-only' : 'px-3 pb-2 text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-2'}>
            <TrendingUp className="h-3 w-3" />
            Clips Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col gap-4">
              {/* Post Button inside Sidebar */}
              <Link to="/create?type=civic-clip" className={cn("px-2", collapsed && "sr-only")}>
                <Button className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm gap-2 shadow-md">
                   <Plus className="h-4 w-4 stroke-[3]" />
                   Post Clip
                </Button>
              </Link>
              
              <CivicClipsCategoryTabs
                orientation="vertical"
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                className="px-0"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      <SidebarGroup className="px-2 pt-4 border-t border-sidebar-border/40">
        <SidebarGroupLabel className={collapsed ? 'sr-only' : 'px-3 pb-2 text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wide'}>
          Communities
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {/* My Office - Only show for verified officials */}
            {user && officeHolderId && <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-10 px-3 rounded-md" onClick={handleNavClick}>
                  <NavLink to={`/g/${officeHolderId}`} className={getNavCls}>
                    <Building className="h-5 w-5" />
                    {!collapsed && <span className="text-sm">My Office</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>}

            {/* My Communities - Navigate to primary community or show modal */}
            {user && <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-md" onClick={handleNavClick}>
                {primaryCommunityPath && hasLocation ? <NavLink to={primaryCommunityPath} className={getNavCls}>
                    <Users className="h-5 w-5" />
                    {!collapsed && <span className="text-sm">My Communities</span>}
                  </NavLink> : <button onClick={handleMyCommunitiesClick} className="flex items-center gap-3 w-full text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground transition-colors">
                    <Users className="h-5 w-5" />
                    {!collapsed && <span className="text-sm">My Communities</span>}
                  </button>}
              </SidebarMenuButton>
            </SidebarMenuItem>}

            {user && <SidebarMenuItem>
              <SidebarMenuButton onClick={() => { setWizardOpen(true); handleNavClick(); }} className="h-10 px-3 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground transition-colors">
                <Plus className="h-5 w-5" />
                {!collapsed && <span className="text-sm">Create Community</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>}

            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-md" onClick={handleNavClick}>
                <NavLink to="/communities" className={getNavCls}>
                  <Star className="h-5 w-5" />
                  {!collapsed && <span className="text-sm">Browse All</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="px-2 pt-4 border-t border-sidebar-border/40">
        <SidebarGroupLabel className={collapsed ? 'sr-only' : 'px-3 pb-2 text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wide'}>
          Profile
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {user ? (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-10 px-3 rounded-md" onClick={handleNavClick}>
                    <Link to={profile?.username ? `/resume/${profile.username}` : '/dashboard'} className="flex items-center gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground transition-colors">
                      <User className="h-5 w-5" />
                      {!collapsed && <span className="text-sm">My Profile</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-10 px-3 rounded-md" onClick={handleNavClick}>
                    <Link to="/settings" className="flex items-center gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground transition-colors">
                      <Settings className="h-5 w-5" />
                      {!collapsed && <span className="text-sm">Settings</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => { openAuthModal('login'); handleNavClick(); }} className="h-10 px-3 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground transition-colors">
                  <User className="h-5 w-5" />
                  {!collapsed && <span className="text-sm">Sign In</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="px-2 pt-4 border-t border-sidebar-border/40">
        <SidebarGroupLabel className={collapsed ? 'sr-only' : 'px-3 pb-2 text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wide'}>
          About
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-md" onClick={handleNavClick}>
                <NavLink to="/terms" className={getNavCls}>
                  <Scale className="h-5 w-5" />
                  {!collapsed && <span className="text-sm">Terms of Service</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-md" onClick={handleNavClick}>
                <NavLink to="/privacy" className={getNavCls}>
                  <ShieldCheck className="h-5 w-5" />
                  {!collapsed && <span className="text-sm">Privacy Policy</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    {/* Toggle button on right edge of sidebar */}
    <SidebarRail className="mx-0" />

    {/* Modals */}
    <CreateCommunityWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
    <SetLocationModal open={locationModalOpen} onOpenChange={setLocationModalOpen} />
  </Sidebar>;
}