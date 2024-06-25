import React from 'react';
import { Link } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';

const drawerWidth = 240;

const Sidebar = () => {
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
          justifyContent: 'center',
          height: '100vh',
        }}
        >
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
    </Drawer>
  );
};

export default Sidebar;
