import React from 'react';
import { Drawer } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

const drawerWidth = 240;

const Sidebar = () => {
      const {loginWithRedirect, logout, user, isLoading} = useAuth0()
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
            {!isLoading && !user && (
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
            )}
    </Drawer>
  );
};

export default Sidebar;
