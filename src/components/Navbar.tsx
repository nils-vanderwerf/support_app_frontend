import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box} from '@mui/material';
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
        <Button color="inherit" component={Link} to="/clients">Clients</Button>
        <Button color="inherit" component={Link} to="/support-workers">Support Workers</Button>
        <Button color="inherit" component={Link} to="/appointments">Appointments</Button>
        
        <Box sx={{ flexGrow: 1 }} />
        {auth.user ? (
          <>
            <Typography sx={{ mr: 2 }}>Welcome, {auth.user.first_name}</Typography>
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