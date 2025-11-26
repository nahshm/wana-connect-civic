import { ReactNode } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <SidebarInset className="flex-1 w-full flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
};
