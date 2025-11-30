import { ReactNode } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Header spans full width at the top */}
      <Header />

      {/* Sidebar and content below header */}
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full overflow-auto">
          <main className="h-full">
            {children}
          </main>
        </SidebarInset>
      </div>
    </div>
  );
};
