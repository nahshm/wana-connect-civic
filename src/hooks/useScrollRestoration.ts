import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to restore scroll position for a specific container
 * @param containerSelector CSS selector for the scrollable container
 */
export const useScrollRestoration = (containerSelector: string = '[data-scroll-container]') => {
  const location = useLocation();
  const scrollPositions = useRef<Record<string, number>>({});
  
  // Load initial positions from sessionStorage if they exist
  useEffect(() => {
    const saved = sessionStorage.getItem('scrollPositions');
    if (saved) {
      try {
        scrollPositions.current = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse scroll positions', e);
      }
    }
  }, []);

  // Save scroll position when navigating away or scrolling
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const handleScroll = () => {
      scrollPositions.current[location.pathname] = container.scrollTop;
      // Debounce saving to sessionStorage slightly if needed, but for now just sync
      sessionStorage.setItem('scrollPositions', JSON.stringify(scrollPositions.current));
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [location.pathname, containerSelector]);

  // Restore scroll position when location changes
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const savedPosition = scrollPositions.current[location.pathname];
    
    if (savedPosition !== undefined) {
      // Use a small timeout to ensure content has rendered
      // This is especially important for lists and lazy-loaded components
      const timer = setTimeout(() => {
        container.scrollTo({
          top: savedPosition,
          behavior: 'instant' // Must be instant for restoration
        });
      }, 50); // 50ms is usually enough for cached React Query data to render
      
      return () => clearTimeout(timer);
    } else {
      // If no saved position, reset to top
      container.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname, containerSelector]);
};
