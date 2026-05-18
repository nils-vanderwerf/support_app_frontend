import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, Tooltip,
  Badge, Drawer, List, ListItem, ListItemButton, ListItemText, Divider,
  useMediaQuery, useTheme,
} from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance, { setAuthToken } from '../api/axiosConfig';

const Navbar = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [invitationsBadge, setInvitationsBadge] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!auth.client && !auth.supportWorker) return;
    const fetchNotifications = () => {
      axiosInstance.get('/notifications')
        .then(res => {
          setUnreadMessages(res.data.unread_messages);
          setInvitationsBadge(res.data.pending_invitations);
        })
        .catch(() => {});
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [auth.client, auth.supportWorker]);

  const handleLogout = async () => {
    setDrawerOpen(false);
    try { await axiosInstance.delete('/logout'); } catch {}
    setAuthToken(null);
    auth?.setUser(null);
    navigate('/login');
  };

  const isAdmin = auth.user?.role === 'admin';
  const isPendingWorker = auth.supportWorker?.status === 'pending';
  const showNav = auth.user && !isAdmin && !isPendingWorker;

  const navLinks = showNav ? [
    ...(auth.supportWorker ? [{ label: 'Clients', to: '/clients' }] : []),
    ...(auth.client ? [{ label: 'Support Workers', to: '/support-workers' }] : []),
    { label: 'Appointments', to: '/appointments' },
    ...(auth.client || auth.supportWorker ? [
      { label: 'Messages', to: '/messages', badge: unreadMessages, onNavigate: () => setUnreadMessages(0) },
      { label: 'Invitations', to: '/invitations', badge: invitationsBadge, onNavigate: () => setInvitationsBadge(0) },
    ] : []),
    ...(auth.supportWorker ? [{ label: 'Reports', to: '/reports' }] : []),
  ] : [];

  const profilePath = auth.client
    ? `/clients/${auth.client.id}`
    : auth.supportWorker ? `/support-workers/${auth.supportWorker.id}` : null;

  const drawer = (
    <Box sx={{ width: 260 }} role="presentation">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, bgcolor: '#7B2FBE' }}>
        <Typography color="white" fontWeight={600} fontSize={15}>
          {auth.user ? `${auth.user.first_name ?? auth.user.email}` : 'Menu'}
        </Typography>
        <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List disablePadding>
        {auth.user && !isAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="Home" />
            </ListItemButton>
          </ListItem>
        )}
        {isAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/admin" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="Admin" />
            </ListItemButton>
          </ListItem>
        )}
        {navLinks.map(link => (
          <ListItem disablePadding key={link.to}>
            <ListItemButton
              component={Link}
              to={link.to}
              onClick={() => { setDrawerOpen(false); link.onNavigate?.(); }}
            >
              <ListItemText primary={
                link.badge ? (
                  <Badge badgeContent={link.badge} color="error" max={9}>
                    {link.label}
                  </Badge>
                ) : link.label
              } />
            </ListItemButton>
          </ListItem>
        ))}
        {!auth.user && (
          <>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/signup" onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Sign Up" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/login" onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
      {auth.user && (
        <>
          <Divider />
          <List disablePadding>
            {profilePath && !isPendingWorker && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => { setDrawerOpen(false); navigate(profilePath); }}>
                  <ListItemText primary="My Profile" />
                </ListItemButton>
              </ListItem>
            )}
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error' }} />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );

  return (
    <AppBar sx={{ backgroundColor: '#7B2FBE', boxShadow: 'none' }}>
      <Toolbar>
        {/* Mobile hamburger */}
        {isMobile && (
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
        )}

        {/* Desktop nav links */}
        {!isMobile && (
          <>
            {auth.user && !isAdmin && <Button color="inherit" component={Link} to="/">Home</Button>}
            {isAdmin && <Button color="inherit" component={Link} to="/admin">Admin</Button>}
            {navLinks.map(link => (
              <Button
                key={link.to}
                color="inherit"
                component={Link}
                to={link.to}
                onClick={link.onNavigate}
              >
                <Badge badgeContent={link.badge || 0} color="error" max={9}>
                  {link.label}
                </Badge>
              </Button>
            ))}
            {!auth.user && (
              <>
                <Button color="inherit" component={Link} to="/signup">Sign Up</Button>
                <Button color="inherit" component={Link} to="/login">Login</Button>
              </>
            )}
          </>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* Right side — desktop only */}
        {!isMobile && auth.user && (
          <>
            <Typography
              sx={{ mr: 2, cursor: profilePath ? 'pointer' : 'default', '&:hover': { textDecoration: profilePath ? 'underline' : 'none' } }}
              onClick={() => profilePath && navigate(profilePath)}
            >
              Welcome, {auth.user.first_name ?? auth.user.email}
            </Typography>
            {profilePath && !isPendingWorker && (
              <Tooltip title="My Profile">
                <IconButton onClick={() => navigate(profilePath)} sx={{ mr: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: '#7B2FBE', fontSize: 14, fontWeight: 700 }}>
                    {auth.user.first_name?.charAt(0)}{auth.user.last_name?.charAt(0)}
                  </Avatar>
                </IconButton>
              </Tooltip>
            )}
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
          </>
        )}

        {/* Mobile: show avatar if logged in */}
        {isMobile && auth.user && profilePath && !isPendingWorker && (
          <IconButton onClick={() => { setDrawerOpen(false); navigate(profilePath); }}>
            <Avatar sx={{ width: 30, height: 30, bgcolor: 'white', color: '#7B2FBE', fontSize: 13, fontWeight: 700 }}>
              {auth.user.first_name?.charAt(0)}{auth.user.last_name?.charAt(0)}
            </Avatar>
          </IconButton>
        )}
      </Toolbar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
