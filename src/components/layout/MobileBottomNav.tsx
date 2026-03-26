import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, PlusCircle, MessageSquare, Video, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar, SidebarContext } from '@/components/ui/sidebar';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Communities', icon: Users, path: '/communities' },
  { label: 'Clips', icon: Video, path: '/civic-clips' },
  { label: 'Create', icon: PlusCircle, path: '/create', authRequired: true },
  { label: 'Chat', icon: MessageSquare, path: '/chat' },
  { label: 'Menu', icon: Menu, path: 'menu' }, // Special case for sidebar
];

export const MobileBottomNav = () => {
  const { user } = useAuth();
  const sidebarContext = React.useContext(SidebarContext);
  const setOpenMobile = sidebarContext?.setOpenMobile || ((_open: boolean) => {});
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const filteredItems = NAV_ITEMS.filter(item => {
    if (item.label === 'Create') return true;
    return !item.authRequired || user;
  });

  const handleScroll = useCallback(() => {
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (!scrollContainer) return;
    const currentY = scrollContainer.scrollTop;
    if (currentY > lastScrollY && currentY > 60) {
      setVisible(false);
    } else {
      setVisible(true);
    }
    setLastScrollY(currentY);
  }, [lastScrollY]);

  useEffect(() => {
    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (!scrollContainer) return;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Always show on route change
  useEffect(() => {
    setVisible(true);
    setLastScrollY(0);
  }, [location.pathname]);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-background/95 backdrop-blur-lg border-t border-border",
        "transition-transform duration-300 ease-in-out",
        isStandalone && "pb-[env(safe-area-inset-bottom)]",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex items-center justify-around h-14 px-1">
        {filteredItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          const isCreate = item.label === 'Create';

          return (
            <button
              key={item.path}
              onClick={() => {
                if (item.label === 'Menu') {
                  setOpenMobile(true);
                } else {
                  navigate(item.path);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full",
                "transition-colors duration-150 tap-highlight-transparent",
                isCreate
                  ? "text-primary"
                  : isActive
                    ? "text-primary"
                    : "text-muted-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "shrink-0",
                  isCreate ? "h-7 w-7" : "h-5 w-5"
                )}
                strokeWidth={isActive || isCreate ? 2.5 : 1.8}
              />
              {!isCreate && (
                <span className={cn(
                  "text-[10px] leading-tight",
                  isActive ? "font-semibold" : "font-normal"
                )}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
