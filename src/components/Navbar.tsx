import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box} from '@mui/material';
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

  const isAdmin = auth.user?.is_admin;
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
        {auth.user && (
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