import React from 'react';
import { useParams, useLocation } from 'react-router-dom';

// Feature-based imports
import Community from '@/features/community/pages/Community';
import OfficialDetail from '@/features/governance/pages/OfficialDetail';
import OfficePage from '@/features/governance/pages/OfficePage';
import ProjectDetail from '@/features/accountability/pages/ProjectDetail';
import PromiseDetail from '@/features/accountability/pages/PromiseDetail';

// Legacy imports (not yet migrated)
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * PrefixRouter - Renders the appropriate component based on the URL prefix
 * 
 * Route mapping:
 * - /g/:id (UUID) → OfficePage (verified office holder's accountability hub)
 * - /g/:username → Profile (verified government official's profile)
 * - /u/:username → Profile (regular users)
 * - /w/:username → Profile (verified users)
 * - /c/:name → Community
 * - /p/:id → ProjectDetail
 * - /pr/:id → PromiseDetail
 */
const PrefixRouter: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Determine which prefix we're dealing with by checking the URL
  if (pathname.startsWith('/g/')) {
    // Extract the parameter after /g/
    const param = pathname.split('/')[2];

    // If it's a UUID, route to OfficePage (office holder's accountability hub)
    // If it's a username, route to Profile (government official's profile)
    if (param && UUID_REGEX.test(param)) {
      return <OfficePage />;
    } else {
      // Username - route to Profile for verified government official
      return <Profile />;
    }
  }

  if (pathname.startsWith('/p/')) {
    // Project detail page
    return <ProjectDetail />;
  }

  if (pathname.startsWith('/pr/')) {
    // Promise detail page
    return <PromiseDetail />;
  }

  if (pathname.startsWith('/w/')) {
    // Verified user profile
    return <Profile />;
  }

  if (pathname.startsWith('/c/')) {
    // Community page
    return <Community />;
  }

  if (pathname.startsWith('/u/')) {
    // User profile
    return <Profile />;
  }

  // Fallback
  return <NotFound />;
};

export default PrefixRouter;
