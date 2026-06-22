import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import Login from '../features/accounts/pages/Login';
import Register from '../features/accounts/pages/Register';
import VerifyEmail from '../features/accounts/pages/VerifyEmail';
import Profile from '../features/accounts/pages/Profile';
import Dashboard from '../features/analytics/pages/Dashboard';
import JobList from '../features/jobs/pages/JobList';
import JobDetail from '../features/jobs/pages/JobDetail';
import JobCreate from '../features/jobs/pages/JobCreate';
import ResumeUpload from '../features/resumes/pages/ResumeUpload';
import ApplicationsList from '../features/applications/pages/ApplicationsList';
import CompanyProfile from '../features/recruiters/pages/CompanyProfile';
import NotificationsList from '../features/accounts/pages/NotificationsList';
import InterviewPrep from '../features/analytics/pages/InterviewPrep';
import CareerAdvisor from '../features/analytics/pages/CareerAdvisor';

// Loading Spinner
const PageLoader = () => (
  <div class="flex items-center justify-center min-h-screen bg-slate-950">
    <div class="relative w-16 h-16">
      <div class="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  </div>
);

// Router Guards

// 1. Private Route - Requires authentication
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
};

// 2. Public Route - Restricts logged-in users from seeing Auth screens
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  
  if (user) {
    const target = user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard';
    return <Navigate to={target} replace />;
  }
  return children;
};

// 3. Role-based Route - Restricts access based on user role
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(user.role)) {
    const fallback = user.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard';
    return <Navigate to={fallback} replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
      
      {/* Root redirection based on Auth status */}
      <Route path="/" element={<PrivateRoute><DashboardRedirect /></PrivateRoute>} />

      {/* Common Authenticated Routes */}
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/jobs" element={<PrivateRoute><JobList /></PrivateRoute>} />
      <Route path="/jobs/:id" element={<PrivateRoute><JobDetail /></PrivateRoute>} />
      <Route path="/applications" element={<PrivateRoute><ApplicationsList /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><NotificationsList /></PrivateRoute>} />
      <Route path="/interview-prep" element={<PrivateRoute><InterviewPrep /></PrivateRoute>} />
      <Route path="/career-advisor" element={<PrivateRoute><CareerAdvisor /></PrivateRoute>} />

      {/* Candidate-Only Routes */}
      <Route path="/candidate/dashboard" element={
        <RoleRoute allowedRoles={['candidate']}><Dashboard /></RoleRoute>
      } />
      <Route path="/resumes" element={
        <RoleRoute allowedRoles={['candidate']}><ResumeUpload /></RoleRoute>
      } />

      {/* Recruiter-Only Routes */}
      <Route path="/recruiter/dashboard" element={
        <RoleRoute allowedRoles={['recruiter']}><Dashboard /></RoleRoute>
      } />
      <Route path="/jobs/create" element={
        <RoleRoute allowedRoles={['recruiter']}><JobCreate /></RoleRoute>
      } />
      <Route path="/company" element={
        <RoleRoute allowedRoles={['recruiter']}><CompanyProfile /></RoleRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Simple redirection helper at the root
const DashboardRedirect = () => {
  const { user } = useAuth();
  const target = user?.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard';
  return <Navigate to={target} replace />;
};

export default AppRoutes;
export { PrivateRoute, PublicRoute, RoleRoute };
