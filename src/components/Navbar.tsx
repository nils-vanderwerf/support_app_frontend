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
  const [adminUnread, setAdminUnread] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  useEffect(() => {
    if (auth.user?.role !== 'admin') return;
    const fetchAdminNotifications = () => {
      axiosInstance.get('/admin/stats')
        .then(res => setAdminUnread(res.data.unread_messages ?? 0))
        .catch(() => {});
    };
    fetchAdminNotifications();
    const interval = setInterval(fetchAdminNotifications, 15000);
    return () => clearInterval(interval);
  }, [auth.user?.role]);

  const handleLogout = async () => {
    setDrawerOpen(false);
    try { await axiosInstance.delete('/logout'); } catch {}
    setAuthToken(null);
    auth?.setUser(null);
    navigate('/login');
  };

  const isAdmin = auth.user?.role === 'admin';
  const isPendingWorker = auth.supportWorker?.status === 'pending';

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
        {isAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/admin/messages" onClick={() => { setDrawerOpen(false); setAdminUnread(0); }}>
              <ListItemText primary={
                adminUnread > 0
                  ? <Badge badgeContent={adminUnread} color="error" max={9}>Messages</Badge>
                  : 'Messages'
              } />
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
        <Button color="inherit" component={Link} to="/">Home</Button>
        {isAdmin && <Button color="inherit" component={Link} to="/admin">Admin</Button>}
        {!isAdmin && !isPendingWorker && (
          <>
            {auth.user && !isAdmin && <Button color="inherit" component={Link} to="/">Home</Button>}
            {isAdmin && <Button color="inherit" component={Link} to="/admin">Admin</Button>}
            {isAdmin && (
              <Button color="inherit" component={Link} to="/admin/messages" onClick={() => setAdminUnread(0)}>
                <Badge badgeContent={adminUnread} color="error" max={9}>Messages</Badge>
              </Button>
            )}
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
            )}
          </>
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
              Welcome, {auth.user.first_name ?? auth.user.email}
            </Typography>
            {(auth.client || auth.supportWorker) && !isPendingWorker && (
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
