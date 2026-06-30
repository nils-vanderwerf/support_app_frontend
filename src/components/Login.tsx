import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosInstance, { setAuthToken } from '../api/axiosConfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = (location.state as any)?.notice as string | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/login', { email, password });
      setAuthToken(response.data.token);
      flushSync(() => {
        auth.setUser(response.data.user);
        auth.setClient(response.data.client);
        auth.setSupportWorker(response.data.support_worker);
      });
      if (response.data.user?.is_admin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      setError('Invalid email or password');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Box sx={{ width: { xs: '95%', sm: 560 } }}>
        <Typography variant="h4" fontWeight="bold" mb={1} color="#7B2FBE">
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Log in to your account
        </Typography>
        {notice && <Alert severity="success" sx={{ mb: 3 }}>{notice}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ backgroundColor: '#7B2FBE', py: 1.5, '&:hover': { backgroundColor: '#6a0dad' } }}
          >
            Login
          </Button>
          <Typography variant="body2" align="center">
            <Link to="/forgot-password" style={{ color: '#7B2FBE', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </Typography>
        </Box>

        <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Don't have an account yet?
          </Typography>
          <Button
            component={Link}
            to="/signup"
            variant="outlined"
            fullWidth
            sx={{ borderColor: '#7B2FBE', color: '#7B2FBE', py: 1.5, '&:hover': { borderColor: '#6a0dad', bgcolor: '#f9f4ff' } }}
          >
            Create an account
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;