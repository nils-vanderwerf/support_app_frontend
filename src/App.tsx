import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import SecureRoute from './components/SecureRoute';
import Home from './components/Home';
import SupportWorkerList from './components/SupportWorkerList';
import ClientList from './components/ClientList';
import AppointmentList from './components/AppointmentList';
import Navbar from './components/Navbar';
import SignUp from './components/SignUp';
import Login from './components/Login';
import { AuthProvider } from './context/AuthContext';

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
            <Route path='/support-workers' element={<SecureRoute><SupportWorkerList /></SecureRoute>} />
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