import { useState } from 'react';
import { 
  Home, 
  TrendingUp, 
  Users, 
  Globe, 
  MessageSquare, 
  Bookmark,
  Plus,
  Settings,
  HelpCircle,
  FileText,
  Shield,
  Briefcase,
  Star,
  Building2,
  Target,
  Calculator,
  BarChart3,
  GraduationCap,
  Vote,
  MapPin,
  Eye,
  Megaphone,
  Phone,
  User
} from 'lucide-react';
import { NavLink, useLocation, Link } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Popular', url: '/popular', icon: TrendingUp },
  { title: 'Government Tracker', url: '/officials', icon: Building2 },
  { title: 'Explore', url: '/explore', icon: Globe },
];

const feedItems = [
  { title: 'Budget Analysis', url: '/feed/budget', icon: BarChart3 },
  { title: 'Policy Updates', url: '/feed/policy', icon: FileText },
  { title: 'Civic Education', url: '/c/CivicEducation', icon: GraduationCap },
];

const communityItems = [
  { title: 'Create Community', url: '/create-community', icon: Plus },
  { title: 'Manage Communities', url: '/manage-communities', icon: Settings },
  { title: 'Browse All', url: '/communities', icon: Star },
];

const resourceItems = [
  { title: 'Public Participation', url: '/participation', icon: Megaphone },
  { title: 'Government Contacts', url: '/contacts', icon: Phone },
  { title: 'Civic Education Hub', url: '/education', icon: HelpCircle },
  { title: 'Help', url: '/help', icon: HelpCircle },
  { title: 'Privacy Policy', url: '/privacy', icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground';

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarContent className="gap-0">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analysis & Updates */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-muted-foreground uppercase tracking-wider'}>
            📊 Analysis & Updates
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {feedItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Communities */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-muted-foreground uppercase tracking-wider'}>
            🏘️ Communities
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communityItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Resources */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-muted-foreground uppercase tracking-wider'}>
            📚 Resources
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Profile Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-muted-foreground uppercase tracking-wider'}>
            👤 Profile
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {!collapsed && <span>My Profile</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
