import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import SecureRoute from './components/SecureRoute';
import Home from './components/Home';
import SupportWorkerList from './components/SupportWorkerList';
import ClientList from './components/ClientList';
import AppointmentList from './components/AppointmentList';
import SupportWorkerProfilePage from './components/SupportWorkerProfilePage';
import ClientProfilePage from './components/ClientProfilePage';
import Navbar from './components/Navbar';
import SignUp from './components/SignUp';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

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
  if (supportWorker?.status !== 'pending') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const MAPS_LIBRARIES: ('places')[] = ['places'];

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <CssBaseline />
        <Navbar />
        <Box component="main" sx={{ p: 3, mt: 8 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/clients" element={<SecureRoute><ClientList /></SecureRoute>} />
            <Route path="/clients/:id" element={<SecureRoute><ClientProfilePage /></SecureRoute>} />
            <Route path='/support-workers' element={<SecureRoute><SupportWorkerList /></SecureRoute>} />
            <Route path='/support-workers/:id' element={<SecureRoute><SupportWorkerProfilePage /></SecureRoute>} />
            <Route path='/appointments' element={<SecureRoute><AppointmentList /></SecureRoute>} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Box>
      </AuthProvider>
    </Router>
  );
};

export default App;