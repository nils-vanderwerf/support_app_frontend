import React from 'react';
import { Link } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import { AccountCircle } from '@mui/icons-material'; 
import { Login } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const Sidebar = () => {
 const auth = useAuth();
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
            {auth?.user && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1">Welcome, {auth.user.first_name}</Typography>
              </Box>
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
                <ListItem button component={Link} to="/signup">
                  <ListItemIcon><AccountCircle /></ListItemIcon>
                  <ListItemText primary="Sign Up" />
                </ListItem>
                <ListItem button component={Link} to="/login">
                  <ListItemIcon><Login /></ListItemIcon>
                  <ListItemText primary="Login" />
                </ListItem>
            </List>
          </Box>
            {/* {!isLoading && !user && (
              <button 
                className="btn btn-primary btn-block"
                onClick={() => loginWithRedirect()}
              >
                Log In
              </button>
            )}
            {!isLoading && user && (
              <button 
                className="btn btn-primary btn-block"
                onClick={() => logout()}
              >
                Log Out
              </button>
            )} */}
        </Box>
    </Drawer>
  );
};

export default Sidebar;
