import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Box, CssBaseline, CircularProgress } from '@mui/material';
import SecureRoute from './components/SecureRoute';
import Navbar from './components/Navbar';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

const Home = React.lazy(() => import('./components/Home'));
const SupportWorkerList = React.lazy(() => import('./components/SupportWorkerList'));
const ClientList = React.lazy(() => import('./components/ClientList'));
const AppointmentList = React.lazy(() => import('./components/AppointmentList'));
const ConversationList = React.lazy(() => import('./components/ConversationList'));
const ConversationView = React.lazy(() => import('./components/ConversationView'));
const InvitationsPage = React.lazy(() => import('./components/InvitationsPage'));
const ReportsPage = React.lazy(() => import('./components/ReportsPage'));
const SupportWorkerProfilePage = React.lazy(() => import('./components/SupportWorkerProfilePage'));
const ClientProfilePage = React.lazy(() => import('./components/ClientProfilePage'));
const SignUp = React.lazy(() => import('./components/SignUp'));
const VettingAgent = React.lazy(() => import('./components/VettingAgent'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const SupportWorkerAdminThread = React.lazy(() => import('./components/SupportWorkerAdminThread'));

const PageLoader = () => (
  <Box display="flex" justifyContent="center" mt={10}>
    <CircularProgress sx={{ color: '#7B2FBE' }} />
  </Box>
);

const ClientsRoute = () => {
  const { client } = useAuth();
  if (client) return <Navigate to="/" replace />;
  return <ClientList />;
};

const SupportWorkerRoute = () => {
  const { supportWorker } = useAuth();
  if (supportWorker) return <Navigate to="/" replace />;
  return <SupportWorkerList />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const VettingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, supportWorker, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (supportWorker?.status === 'approved') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const RequireSupportWorker = ({ children }: { children: React.ReactNode }) => {
  const { user, supportWorker, loading } = useAuth();
  if (loading) return null;
  if (!user || !supportWorker) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <CssBaseline />
          <Navbar />
          <Box component="main" sx={{ p: 3, mt: 8 }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<SecureRoute><Home /></SecureRoute>} />
                <Route path="/clients" element={<SecureRoute><ClientsRoute /></SecureRoute>} />
                <Route path="/clients/:id" element={<SecureRoute><ClientProfilePage /></SecureRoute>} />
                <Route path='/support-workers' element={<SecureRoute><SupportWorkerRoute /></SecureRoute>} />
                <Route path='/support-workers/:id' element={<SecureRoute><SupportWorkerProfilePage /></SecureRoute>} />
                <Route path='/appointments' element={<SecureRoute><AppointmentList /></SecureRoute>} />
                <Route path='/invitations' element={<SecureRoute><InvitationsPage /></SecureRoute>} />
                <Route path='/reports' element={<RequireSupportWorker><ReportsPage /></RequireSupportWorker>} />
                <Route path='/messages' element={<SecureRoute><ConversationList /></SecureRoute>} />
                <Route path='/messages/admin' element={<RequireSupportWorker><SupportWorkerAdminThread /></RequireSupportWorker>} />
                <Route path='/messages/:id' element={<SecureRoute><ConversationView /></SecureRoute>} />
                <Route path="/vetting" element={<VettingRoute><VettingAgent /></VettingRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
              </Routes>
            </Suspense>
          </Box>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
