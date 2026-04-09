import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/login', { email, password });
      auth.setUser(response.data.success);
      navigate('/clients');
    } catch (error) {
      setError('Invalid email or password');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Box sx={{ width: 560 }}>
        <Typography variant="h4" fontWeight="bold" mb={1} color="#7B2FBE">
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Log in to your account
        </Typography>
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
            <a href="/forgot-password" style={{ color: '#7B2FBE', textDecoration: 'none' }}>
              Forgot password?
            </a>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;