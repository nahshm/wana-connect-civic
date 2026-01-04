import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import PrefixRouter from "@/components/routing/PrefixRouter";

// Feature-based imports - Governance
import Officials from "@/features/governance/pages/Officials";
import OfficialDetail from "@/features/governance/pages/OfficialDetail";
import ClaimPositionPage from "@/features/governance/pages/ClaimPosition";
import BuildGovernancePage from "@/features/governance/pages/BuildGovernance";

// Feature-based imports - Accountability
import Projects from "@/features/accountability/pages/Projects";
import ProjectDetail from "@/features/accountability/pages/ProjectDetail";
import SubmitProject from "@/features/accountability/pages/SubmitProject";
import PromiseDetail from "@/features/accountability/pages/PromiseDetail";
import ReportIssue from "@/features/accountability/pages/ReportIssue";
import ActionDetail from "@/features/accountability/pages/ActionDetail";

// Feature-based imports - Community
import Communities from "@/features/community/pages/Communities";
import Community from "@/features/community/pages/Community";
import Chat from "@/features/community/pages/Chat";

// Feature-based imports - Feed
import Index from "@/features/feed/pages/Home";
import CreatePost from "@/features/feed/pages/CreatePost";
import EditPost from "@/features/feed/pages/EditPost";
import PostDetail from "@/features/feed/pages/PostDetail";
import { CivicClipsPage } from "@/features/feed/pages/CivicClips";

// Feature-based imports - Admin
import GeographicDataAdmin from "@/features/admin/pages/GeographicDataAdmin";
import { PositionVerification } from "@/features/admin/pages/PositionVerification";
import SuperAdminDashboard from "@/features/admin/pages/SuperAdminDashboard";

// Legacy pages (not yet migrated to features)
import SettingsPage from "./pages/Settings";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import OnboardingFlow from "./pages/Onboarding/OnboardingFlow";
import WelcomeDashboard from "./pages/Onboarding/WelcomeDashboard";
import CivicDashboard from "./pages/Dashboard/CivicDashboard";
import Analytics from "./pages/Dashboard/Analytics";
import { SearchResults } from "./pages/SearchResults";
import Quests from "./pages/Quests";
import Leaderboards from "./pages/Leaderboards";
import DiscoveryDashboard from "./pages/DiscoveryDashboard";
import { OnboardingGuard } from "@/components/routing/OnboardingGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="wanaiq-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SidebarProvider>
            <BrowserRouter>
              <OnboardingGuard>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/onboarding" element={<OnboardingFlow />} />
                  <Route path="/welcome" element={<WelcomeDashboard />} />
                  <Route path="/civic-clips" element={<CivicClipsPage />} />
                  <Route path="/*" element={
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/dashboard" element={<CivicDashboard />} />
                        <Route path="/dashboard/report" element={<ReportIssue />} />
                        <Route path="/dashboard/actions/:id" element={<ActionDetail />} />
                        <Route path="/dashboard/analytics" element={<Analytics />} />
                        <Route path="/create" element={<CreatePost />} />
                        <Route path="/submit" element={<CreatePost />} />
                        <Route path="/post/:id" element={<PostDetail />} />
                        <Route path="/edit-post/:id" element={<EditPost />} />
                        <Route path="/u/:username" element={<Profile />} />
                        <Route path="/profile/:username" element={<Profile />} />
                        <Route path="/c/:communityName/post/:id" element={<PostDetail />} />
                        <Route path="/c/:communityName" element={<Community />} />
                        <Route path="/community/:communityName" element={<Community />} />
                        <Route path="/communities" element={<Communities />} />
                        <Route path="/officials" element={<Officials />} />
                        <Route path="/officials/:officialId" element={<OfficialDetail />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/projects/submit" element={<SubmitProject />} />
                        <Route path="/claim-position" element={<ClaimPositionPage />} />
                        <Route path="/governance/build" element={<BuildGovernancePage />} />
                        <Route path="/projects/:projectId" element={<ProjectDetail />} />
                        <Route path="/promises/:promiseId" element={<PromiseDetail />} />
                        <Route path="/discover" element={<DiscoveryDashboard />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/search" element={<SearchResults />} />
                        <Route path="/quests" element={<Quests />} />
                        <Route path="/leaderboards" element={<Leaderboards />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/admin/geographic-data" element={<GeographicDataAdmin />} />
                        <Route path="/admin/verification" element={<PositionVerification />} />
                        <Route path="/superadmin" element={<SuperAdminDashboard />} />
                        {/* Functional prefix routes - handled by PrefixRouter */}
                        <Route path="/g/:username" element={<PrefixRouter />} />
                        <Route path="/p/:projectId" element={<PrefixRouter />} />
                        <Route path="/pr/:promiseId" element={<PrefixRouter />} />
                        <Route path="/w/:username" element={<PrefixRouter />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  } />
                </Routes>
              </OnboardingGuard>
            </BrowserRouter>
          </SidebarProvider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
