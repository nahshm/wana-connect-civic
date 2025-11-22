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
import Index from "./pages/Index";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import PostDetail from "./pages/PostDetail";
import Communities from "./pages/Communities";
import Community from "./pages/Community";
import Officials from "./pages/Officials";
import Projects from "./pages/Projects";
import SettingsPage from "./pages/Settings";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import OnboardingFlow from "./pages/Onboarding/OnboardingFlow";
import WelcomeDashboard from "./pages/Onboarding/WelcomeDashboard";
import CivicDashboard from "./pages/Dashboard/CivicDashboard";
import ReportIssue from "./pages/Dashboard/ReportIssue";
import ActionDetail from "./pages/Dashboard/ActionDetail";
import Analytics from "./pages/Dashboard/Analytics";
import GeographicDataAdmin from "./pages/Admin/GeographicDataAdmin";
import { SearchResults } from "./pages/SearchResults";
import { CivicClipsPage } from "./pages/CivicClips";
import Chat from "./pages/Chat";
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
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/search" element={<SearchResults />} />
                        <Route path="/civic-clips" element={<CivicClipsPage />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/admin/geographic-data" element={<GeographicDataAdmin />} />
                        {/* Functional prefix routes - handled by PrefixRouter */}
                        <Route path="/g/:officialId" element={<PrefixRouter />} />
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
