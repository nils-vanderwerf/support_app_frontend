import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Box, CssBaseline, List, ListItem, ListItemText } from '@mui/material';
import Home from './components/Home';
import SupportWorkerList from './components/SupportWorkerList';
import ClientList from './components/ClientList.js';
import Sidebar from './components/Sidebar';
import SignUp from './components/SignUp.js';
import Login from './components/Login';
import Auth0ProviderWithHistory from './components/auth0Provider'

const drawerWidth = 240;

const App = () => {
  return (

    <Router>
      <Auth0ProviderWithHistory>
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
            <Route path="/clients" element={<ClientList />} />
            <Route path="/support-workers" element={<SupportWorkerList />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Box>
      </Box>
      </Auth0ProviderWithHistory>
    </Router>
  );
};

export default App;