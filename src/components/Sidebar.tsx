import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Typography, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import { AccountCircle } from '@mui/icons-material'; 
import { Login } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;


const Sidebar = () => {
 const auth = useAuth();
 const navigate = useNavigate();

const handleLogout = () => {
  auth?.setUser(null);
  navigate('/login')
}
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
        <Box
          sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          height: '100vh',
        }}
        >
        {auth.user ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle1">Welcome, {auth.user.first_name}</Typography>
              <ListItem button onClick={handleLogout}>
                <ListItemIcon><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            </Box>
          ) : (
            <>
              <ListItem button component={Link} to="/login">
                <ListItemIcon><Login /></ListItemIcon>
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem button component={Link} to="/signup">
                <ListItemIcon><AccountCircle /></ListItemIcon>
                <ListItemText primary="Sign Up" />
              </ListItem>
            </>
          )}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <List>
                <ListItem button component={Link} to="/">
                <ListItemIcon><HomeIcon /></ListItemIcon>
                <ListItemText primary="Home" />
                </ListItem>
                <ListItem button component={Link} to="/clients">
                <ListItemIcon><PeopleIcon /></ListItemIcon>
                <ListItemText primary="Clients" />
                </ListItem>
                <ListItem button component={Link} to="/support-workers">
                <ListItemIcon><WorkIcon /></ListItemIcon>
                <ListItemText primary="Support Workers" />
                </ListItem>
            </List>
          </Box>
        </Box>
    </Drawer>
  );
};

export default Sidebar;
