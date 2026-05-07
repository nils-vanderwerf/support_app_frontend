import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, Tooltip, Badge } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

const Navbar = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [invitationsBadge, setInvitationsBadge] = useState(0);

  useEffect(() => {
    if (!auth.client && !auth.supportWorker) return;

    const fetchNotifications = () => {
      axiosInstance.get('/notifications')
        .then(res => {
          setUnreadMessages(res.data.unread_messages);
          setInvitationsBadge(res.data.pending_invitations + (res.data.recently_accepted ?? 0));
        })
        .catch(() => {});
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [auth.client, auth.supportWorker]);

  const handleLogout = () => {
    auth?.setUser(null);
    navigate('/login');
  };

  return (
    <AppBar sx={{ backgroundColor: '#7B2FBE', boxShadow: 'none' }}>
      <Toolbar>
        <Button color="inherit" component={Link} to="/">Home</Button>
        {auth.supportWorker && <Button color="inherit" component={Link} to="/clients">Clients</Button>}
        <Button color="inherit" component={Link} to="/support-workers">Support Workers</Button>
        <Button color="inherit" component={Link} to="/appointments">Appointments</Button>
        {(auth.client || auth.supportWorker) && (
          <Button color="inherit" component={Link} to="/messages" onClick={() => setUnreadMessages(0)}>
            <Badge badgeContent={unreadMessages} color="error" max={9}>
              Messages
            </Badge>
          </Button>
        )}
        {(auth.client || auth.supportWorker) && (
          <Button color="inherit" component={Link} to="/invitations" onClick={() => setInvitationsBadge(0)}>
            <Badge badgeContent={invitationsBadge} color="error" max={9}>
              Invitations
            </Badge>
          </Button>
        )}

        <Box sx={{ flexGrow: 1 }} />
        {auth.user ? (
          <>
            <Typography
              sx={{ mr: 2, cursor: (auth.client || auth.supportWorker) ? 'pointer' : 'default', '&:hover': { textDecoration: (auth.client || auth.supportWorker) ? 'underline' : 'none' } }}
              onClick={() => {
                if (auth.client) navigate(`/clients/${auth.client.id}`);
                else if (auth.supportWorker) navigate(`/support-workers/${auth.supportWorker!.id}`);
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
};

export default Navbar;
