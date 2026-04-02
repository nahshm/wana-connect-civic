import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner';
import { cn } from '@/lib/utils';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const isCommunityPage = location.pathname.startsWith('/c/');
  const isCivicAssistant = location.pathname === '/civic-assistant';
  const isClipsPage = location.pathname === '/civic-clips';

  // Global Throttled Scroll Listener for "Good Behavior" (1M+ DAU Performance)
  // This dispatches a custom event to close all menus when the user scrolls significantly
  useEffect(() => {
    const container = document.querySelector('[data-scroll-container]');
    if (!container) return;

    let scrollTimeout: any;
    const handleScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('wanaiq:menu:collapse'));
          scrollTimeout = null;
        }, 150); // Throttled to 150ms for O(1) performance
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col w-full bg-background overflow-hidden text-foreground">
      {!isClipsPage && <Header />}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AppSidebar />
        <SidebarInset
          data-scroll-container
          className={cn(
            "flex-1 w-full h-full !min-h-0 pb-14 md:pb-0",
            (isCommunityPage || isCivicAssistant) ? "overflow-hidden" : "overflow-auto"
          )}
        >
          {isCivicAssistant ? (
            <div className="relative h-full min-h-0 w-full overflow-hidden">
              {children}
            </div>
          ) : (
            children
          )}
        </SidebarInset>
      </div>
      <MobileBottomNav />
      <InstallPromptBanner />
    </div>
  );
};
