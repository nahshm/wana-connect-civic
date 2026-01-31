import { useState } from 'react';
import { Home, Video, TrendingUp, Globe, Plus, Settings, Star, Building2, User, Building, Users } from 'lucide-react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { CreateCommunityWizard } from '@/components/community/CreateCommunityWizard';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from '@/components/ui/sidebar';
import { useOfficeHolderId } from '@/hooks/useOfficeHolderId';
import { usePrimaryCommunity } from '@/hooks/usePrimaryCommunity';
import { SetLocationModal } from '@/components/community/SetLocationModal';
const mainItems = [{
  title: 'For You',
  url: '/',
  icon: Home
}, {
  title: 'Reels',
  url: '/civic-clips',
  icon: Video
}, {
  title: 'Popular',
  url: '/popular',
  icon: TrendingUp
}, {
  title: 'Government Tracker',
  url: '/officials',
  icon: Building2
}, {
  title: 'Explore',
  url: '/communities',
  icon: Globe
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const [wizardOpen, setWizardOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const {
    officeHolderId,
    isLoading
  } = useOfficeHolderId();
  const {
    path: primaryCommunityPath,
    hasLocation,
    isLoading: communityLoading
  } = usePrimaryCommunity();
  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };
  const getNavCls = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground transition-colors';

  // Handler for My Communities click
  const handleMyCommunitiesClick = (e: React.MouseEvent) => {
    if (!hasLocation && !communityLoading) {
      e.preventDefault();
      setLocationModalOpen(true);
    }
  };
  return <Sidebar collapsible="icon" variant="sidebar">
    <SidebarContent className="gap-0 py-2 bg-popover px-[10px]">
      <SidebarGroup className="px-2">
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {mainItems.map(item => <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-md">
                <NavLink to={item.url} end className={getNavCls}>
                  <item.icon className="h-5 w-5" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="px-2 pt-4 border-t border-sidebar-border/40">
        <SidebarGroupLabel className={collapsed ? 'sr-only' : 'px-3 pb-2 text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wide'}>
          Communities
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {/* My Office - Only show for verified officials */}
            {officeHolderId && <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-10 px-3 rounded-md">
                  <NavLink to={`/g/${officeHolderId}`} className={getNavCls}>
                    <Building className="h-5 w-5" />
                    {!collapsed && <span className="text-sm">My Office</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>}

            {/* My Communities - Navigate to primary community or show modal */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-md">
                {primaryCommunityPath && hasLocation ? <NavLink to={primaryCommunityPath} className={getNavCls}>
                    <Users className="h-5 w-5" />
                    {!collapsed && <span className="text-sm">My Communities</span>}
                  </NavLink> : <button onClick={handleMyCommunitiesClick} className="flex items-center gap-3 w-full text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground transition-colors">
                    <Users className="h-5 w-5" />
                    {!collapsed && <span className="text-sm">My Communities</span>}
                  </button>}
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setWizardOpen(true)} className="h-10 px-3 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground transition-colors">
                <Plus className="h-5 w-5" />
                {!collapsed && <span className="text-sm">Create Community</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-md">
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
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-md">
                <Link to="/profile" className="flex items-center gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground transition-colors">
                  <User className="h-5 w-5" />
                  {!collapsed && <span className="text-sm">My Profile</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-md">
                <Link to="/settings" className="flex items-center gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground transition-colors">
                  <Settings className="h-5 w-5" />
                  {!collapsed && <span className="text-sm">Settings</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    {/* Toggle button on right edge of sidebar */}
    <SidebarRail />

    {/* Modals */}
    <CreateCommunityWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
    <SetLocationModal open={locationModalOpen} onOpenChange={setLocationModalOpen} />
  </Sidebar>;
}