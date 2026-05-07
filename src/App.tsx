import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import SecureRoute from './components/SecureRoute';
import Home from './components/Home';
import SupportWorkerList from './components/SupportWorkerList';
import ClientList from './components/ClientList';
import AppointmentList from './components/AppointmentList';
import ConversationList from './components/ConversationList';
import ConversationView from './components/ConversationView';
import InvitationsPage from './components/InvitationsPage';
import SupportWorkerProfilePage from './components/SupportWorkerProfilePage';
import ClientProfilePage from './components/ClientProfilePage';
import Navbar from './components/Navbar';
import SignUp from './components/SignUp';
import Login from './components/Login';
import VettingAgent from './components/VettingAgent';
import AdminDashboard from './components/AdminDashboard';
import SupportWorkerAdminThread from './components/SupportWorkerAdminThread';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

const ClientsRoute = () => {
  const { client } = useAuth();
  if (client) return <Navigate to="/" replace />;
  return <ClientList />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user?.is_admin) return <Navigate to="/" replace />;
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
          <Routes>
            <Route path="/" element={<SecureRoute><Home /></SecureRoute>} />
            <Route path="/clients" element={<SecureRoute><ClientsRoute /></SecureRoute>} />
            <Route path="/clients/:id" element={<SecureRoute><ClientProfilePage /></SecureRoute>} />
            <Route path='/support-workers' element={<SecureRoute><SupportWorkerList /></SecureRoute>} />
            <Route path='/support-workers/:id' element={<SecureRoute><SupportWorkerProfilePage /></SecureRoute>} />
            <Route path='/appointments' element={<SecureRoute><AppointmentList /></SecureRoute>} />
            <Route path='/invitations' element={<SecureRoute><InvitationsPage /></SecureRoute>} />
            <Route path='/messages' element={<SecureRoute><ConversationList /></SecureRoute>} />
            <Route path='/messages/admin' element={<RequireSupportWorker><SupportWorkerAdminThread /></RequireSupportWorker>} />
            <Route path='/messages/:id' element={<SecureRoute><ConversationView /></SecureRoute>} />
            <Route path="/vetting" element={<VettingRoute><VettingAgent /></VettingRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Box>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;