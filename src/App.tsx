import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Box, CssBaseline, List, ListItem, ListItemText } from '@mui/material';
import SecureRoute from './components/SecureRoute';
import Home from './components/Home';
import SupportWorkerList from './components/SupportWorkerList';
import ClientList from './components/ClientList';
import Sidebar from './components/Sidebar';
import SignUp from './components/SignUp';
import Login from './components/Login';
import { AuthProvider } from './context/AuthContext';

const drawerWidth = 240;

const App = () => {
  return (

    <Router>
      <AuthProvider>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: `calc(100% - ${drawerWidth}px)`
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/clients" element={<SecureRoute><ClientList/></SecureRoute>} />
            <Route path='/support-workers' element={<SecureRoute><SupportWorkerList/></SecureRoute>} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Box>
      </Box>
      </AuthProvider>
    </Router>
  );
};

export default App;