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
  Star
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

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
  { title: 'Explore', url: '/explore', icon: Globe },
  { title: 'All', url: '/all', icon: MessageSquare },
];

const feedItems = [
  { title: 'Create a custom feed', url: '/create-feed', icon: Plus },
];

const recentItems = [
  { title: 'r/communities', url: '/communities', icon: Users },
];

const communityItems = [
  { title: 'Create a community', url: '/create-community', icon: Plus },
  { title: 'Manage communities', url: '/manage-communities', icon: Settings },
  { title: 'r/Kenya', url: '/r/kenya', icon: Star },
];

const resourceItems = [
  { title: 'About WanaIQ', url: '/about', icon: HelpCircle },
  { title: 'Help', url: '/help', icon: HelpCircle },
  { title: 'Blog', url: '/blog', icon: FileText },
  { title: 'Careers', url: '/careers', icon: Briefcase },
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

        {/* Custom Feeds */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-muted-foreground uppercase tracking-wider'}>
            Custom Feeds
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

        {/* Recent */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : 'text-xs font-medium text-sidebar-muted-foreground uppercase tracking-wider'}>
            Recent
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentItems.map((item) => (
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
            Communities
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
            Resources
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
      </SidebarContent>
    </Sidebar>
  );
}
