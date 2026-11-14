import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import AppShell from './components/workspace/AppShell';
import { InterviewProvider } from './contexts/InterviewContext';
import { HRProvider } from './contexts/HRContext';

// Public pages (lazy loaded)
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupForm = lazy(() => import('./components/SignupForm'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const CareerBlogPage = lazy(() => import('./pages/CareerBlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const ResumeGuidePage = lazy(() => import('./pages/ResumeGuidePage'));
const InterviewTipsPage = lazy(() => import('./pages/InterviewTipsPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Workspace pages (lazy loaded)
const CandidateDashboardPage = lazy(() => import('./pages/CandidateDashboardPage'));
const HRDashboard = lazy(() => import('./components/HRDashboard'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const ProblemsPage = lazy(() => import('./pages/ProblemsPage'));
const ProblemWorkspacePage = lazy(() => import('./pages/ProblemWorkspacePage'));
const AssessmentsPage = lazy(() => import('./pages/AssessmentsPage'));
const AssessmentWorkspacePage = lazy(() => import('./pages/AssessmentWorkspacePage'));
const CoreCSPage = lazy(() => import('./pages/CoreCSPage'));
const SystemDesignPage = lazy(() => import('./pages/SystemDesignPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const SetupPage = lazy(() => import('./pages/SetupPage'));
const InterviewPage = lazy(() => import('./pages/InterviewPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const ResultDetailPage = lazy(() => import('./pages/ResultDetailPage'));
const InterviewRoomPage = lazy(() => import('./pages/InterviewRoomPage'));

// Loading Fallback Component
const PageLoadingFallback: React.FC = () => (
  <div className="flex min-h-[50vh] items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <span className="text-xs text-muted-foreground animate-pulse font-medium">Loading workspace...</span>
    </div>
  </div>
);

// Role-aware Protected Route Component
interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: ('candidate' | 'hr' | 'admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'hr') return <Navigate to="/hr/dashboard" replace />;
    return <Navigate to="/candidate/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-primary/20 animate-spin border-t-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading InterviewPrep...</p>
        </div>
      </div>
    );
  }

  return (
    <HRProvider>
      <InterviewProvider>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Public Layout Routes (Marketing Header & Footer) */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route
                path="signup"
                element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <SignupForm />}
              />
              <Route
                path="login"
                element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <LoginPage />}
              />

              {/* Public Resource and Content Pages */}
              <Route path="interview-tips" element={<InterviewTipsPage />} />
              <Route path="resume-guide" element={<ResumeGuidePage />} />
              <Route path="blog" element={<CareerBlogPage />} />
              <Route path="blog/:slug" element={<BlogPostPage />} />
              <Route path="faq" element={<FAQPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="careers" element={<CareersPage />} />
              <Route path="careers/:id" element={<JobDetailPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="terms-of-service" element={<TermsPage />} />

              {/* 404 Catch-All within Public Layout */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Authenticated Workspace Routes (Unified AppShell) */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Candidate Hub & Practice Tracks */}
              <Route
                path="candidate/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <CandidateDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="roadmap"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <RoadmapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="problems"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <ProblemsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="problems/:slug"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <ProblemWorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="assessments"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <AssessmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="assessments/:slug/attempt"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <AssessmentWorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="core-cs"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <CoreCSPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="system-design"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <SystemDesignPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="companies"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <CompaniesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="setup"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <SetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="interview"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <InterviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="results"
                element={
                  <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                    <ResultsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="results/:id" element={<ResultDetailPage />} />

              {/* Recruiter / HR Workspace */}
              <Route
                path="hr/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['hr', 'admin']}>
                    <HRDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Administrator Governance Workspace */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Account Profile & Workspace Settings */}
              <Route path="profile" element={<ProfilePage />} />

              {/* Interview Collaboration Room */}
              <Route path="interview-room/:id" element={<InterviewRoomPage />} />
            </Route>
          </Routes>
        </Suspense>
      </InterviewProvider>
    </HRProvider>
  );
};

export default App;
