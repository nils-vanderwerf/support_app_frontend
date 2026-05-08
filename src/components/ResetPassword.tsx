import { useState } from 'react';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/password_resets/reset', { token, password });
      navigate('/login', { state: { notice: 'Password updated. Please log in.' } });
    } catch (err: any) {
      const msgs = err.response?.data?.errors;
      setError(msgs ? msgs.join(', ') : 'Invalid or expired link. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Box sx={{ width: { xs: '95%', sm: 560 } }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            Invalid reset link. Please request a new one.
          </Alert>
          <Typography variant="body2" align="center">
            <Link to="/forgot-password" style={{ color: '#7B2FBE' }}>Request new link</Link>
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Box sx={{ width: { xs: '95%', sm: 560 } }}>
        <Typography variant="h4" fontWeight="bold" mb={1} color="#7B2FBE">
          Choose a new password
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Enter your new password below.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
          <TextField
            label="New password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ backgroundColor: '#7B2FBE', py: 1.5, '&:hover': { backgroundColor: '#6a0dad' } }}
          >
            {loading ? 'Updating…' : 'Update password'}
          </Button>
          <Typography variant="body2" align="center">
            <Link to="/login" style={{ color: '#7B2FBE', textDecoration: 'none' }}>Back to login</Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ResetPassword;
