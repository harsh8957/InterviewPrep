import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import SignupForm from './components/SignupForm';
import HRDashboard from './components/HRDashboard';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import InterviewPage from './pages/InterviewPage';
import ResultsPage from './pages/ResultsPage';
import ResultDetailPage from './pages/ResultDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import InterviewRoomPage from './pages/InterviewRoomPage';
import CandidateDashboardPage from './pages/CandidateDashboardPage';
import InterviewTipsPage from './pages/InterviewTipsPage';
import ResumeGuidePage from './pages/ResumeGuidePage';
import CareerBlogPage from './pages/CareerBlogPage';
import BlogPostPage from './pages/BlogPostPage';
import FAQPage from './pages/FAQPage';
import AboutPage from './pages/AboutPage';
import CareersPage from './pages/CareersPage';
import JobDetailPage from './pages/JobDetailPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import { InterviewProvider } from './contexts/InterviewContext';
import { HRProvider } from './contexts/HRContext';

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
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
            <Route
              path="signup"
              element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <SignupForm />}
            />
            <Route
              path="login"
              element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <LoginPage />}
            />
            
            {/* New Footer Pages */}
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

            <Route
              path="setup"
              element={user ? <SetupPage /> : <Navigate to="/login" />}
            />
            <Route
              path="interview"
              element={user ? <InterviewPage /> : <Navigate to="/login" />}
            />
            <Route
              path="results"
              element={user ? <ResultsPage /> : <Navigate to="/login" />}
            />
            <Route
              path="results/:id"
              element={user ? <ResultDetailPage /> : <Navigate to="/login" />}
            />
            <Route
              path="hr/dashboard"
              element={
                user?.role === 'hr' || user?.role === 'admin' ? (
                  <HRDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="candidate/dashboard"
              element={
                user?.role === 'candidate' ? (
                  <CandidateDashboardPage />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="interview-room/:id"
              element={user ? <InterviewRoomPage /> : <Navigate to="/login" />}
            />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </InterviewProvider>
      </HRProvider>
  );
};

export default App;
