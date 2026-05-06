import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, Tooltip } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const auth = useAuth();
 const navigate = useNavigate();

const handleLogout = () => {
  auth?.setUser(null);
  navigate('/login')
}
  return (
    <AppBar sx={{ backgroundColor: '#7B2FBE', boxShadow: 'none' }}>
      <Toolbar>
        <Button color="inherit" component={Link} to="/">Home</Button>
        {auth.supportWorker && <Button color="inherit" component={Link} to="/clients">Clients</Button>}
        <Button color="inherit" component={Link} to="/support-workers">Support Workers</Button>
        <Button color="inherit" component={Link} to="/appointments">Appointments</Button>
        
        <Box sx={{ flexGrow: 1 }} />
        {auth.user ? (
          <>
            <Typography
              sx={{ mr: 2, cursor: (auth.client || auth.supportWorker) ? 'pointer' : 'default', '&:hover': { textDecoration: (auth.client || auth.supportWorker) ? 'underline' : 'none' } }}
              onClick={() => {
                if (auth.client) navigate(`/clients/${auth.client.id}`);
                else if (auth.supportWorker) navigate(`/support-workers/${auth.supportWorker.id}`);
              }}
            >
              Welcome, {auth.user.first_name}
            </Typography>
            {(auth.client || auth.supportWorker) && (
              <Tooltip title="My Profile">
                <IconButton
                  onClick={() => auth.client
                    ? navigate(`/clients/${auth.client.id}`)
                    : navigate(`/support-workers/${auth.supportWorker!.id}`)
                  }
                  sx={{ mr: 1 }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: '#7B2FBE', fontSize: 14, fontWeight: 700 }}>
                    {auth.user.first_name?.charAt(0)}{auth.user.last_name?.charAt(0)}
                  </Avatar>
                </IconButton>
              </Tooltip>
            )}
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/signup">Sign Up</Button>
            <Button color="inherit" component={Link} to="/login">Login</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;