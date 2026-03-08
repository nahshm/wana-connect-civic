import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const isCommunityPage = location.pathname.startsWith('/c/');

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Header spans full width at the top */}
      <Header />

      {/* Sidebar and content below header */}
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <SidebarInset className={cn(
          "flex-1 w-full min-h-0",
          isCommunityPage ? "overflow-hidden" : "overflow-auto"
        )}>
          <main className="h-full">
            {children}
          </main>
        </SidebarInset>
      </div>
    </div>
  );
};
