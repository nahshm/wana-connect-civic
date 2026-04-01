// src/components/routing/ProtectedRoute.tsx
// PURPOSE: Wraps sensitive routes. Instead of redirecting to /login
// (which loses the user's context), it opens the existing AuthModal
// and shows a blurred placeholder. User logs in without leaving the page.

import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { isLikelyBot } from '../../lib/botDetection';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const authModal = useAuthModal();

  // Always call hooks before any conditional returns (React rules)
  useEffect(() => {
    if (!isLoading && !user && !isLikelyBot()) {
      authModal.open('login');
    }
  }, [isLoading, user, authModal]);

  // Hard block for bots — show nothing, not even a loading state
  if (isLikelyBot()) {
    return <div aria-hidden="true" />;
  }

  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  if (!user) {
    return <BlurredContentPlaceholder />;
  }

  return <>{children}</>;
}

// Shows a blurred version of the page while auth modal is open
function BlurredContentPlaceholder() {
  return (
    <div
      style={{
        filter: 'blur(4px)',
        pointerEvents: 'none',
        userSelect: 'none',
        minHeight: '60vh',
        opacity: 0.4,
      }}
      aria-hidden="true"
    >
      <div style={{ height: 200, background: 'var(--color-surface)', borderRadius: 8, marginBottom: 16 }} />
      <div style={{ height: 100, background: 'var(--color-surface)', borderRadius: 8, marginBottom: 16 }} />
      <div style={{ height: 150, background: 'var(--color-surface)', borderRadius: 8 }} />
    </div>
  );
}

function AuthLoadingSkeleton() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading-spinner" aria-label="Loading..." />
    </div>
  );
}
