import React from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';

// Feature-based imports
import Community from '@/features/community/pages/Community';
import OfficialDetail from '@/features/governance/pages/OfficialDetail';
import ProjectDetail from '@/features/accountability/pages/ProjectDetail';
import PromiseDetail from '@/features/accountability/pages/PromiseDetail';

// Legacy imports (not yet migrated)
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

// Prefix handler components
const CommunityPrefixHandler: React.FC = () => {
  const { communityName } = useParams<{ communityName: string }>();
  return <Community />;
};

const UserPrefixHandler: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  return <Profile />;
};

const GovernmentPrefixHandler: React.FC = () => {
  const { officialId } = useParams<{ officialId: string }>();
  // Route to official detail page
  return <OfficialDetail />;
};

const ProjectPrefixHandler: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  // Route to project detail page
  return <ProjectDetail />;
};

const PromisePrefixHandler: React.FC = () => {
  const { promiseId } = useParams<{ promiseId: string }>();
  // For now, redirect to PromiseDetail page - will be enhanced with promise details
  return <PromiseDetail />;
};

const VerifiedUserPrefixHandler: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  return <Profile />;
};

// Main prefix router component that handles all functional prefixes
const PrefixRouter: React.FC = () => {
  return (
    <Routes>
      {/* Community prefix: c/communityName */}
      <Route path="c/:communityName" element={<CommunityPrefixHandler />} />

      {/* User profile prefix: u/username */}
      <Route path="u/:username" element={<UserPrefixHandler />} />

      {/* Government official prefix: g/officialId */}
      <Route path="g/:officialId" element={<GovernmentPrefixHandler />} />

      {/* Project prefix: p/projectId */}
      <Route path="p/:projectId" element={<ProjectPrefixHandler />} />

      {/* Promise prefix: pr/promiseId */}
      <Route path="pr/:promiseId" element={<PromisePrefixHandler />} />

      {/* Verified user prefix: w/username */}
      <Route path="w/:username" element={<VerifiedUserPrefixHandler />} />

      {/* Fallback for unknown prefixes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default PrefixRouter;
