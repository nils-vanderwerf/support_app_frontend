import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import axiosInstance from '../api/axiosConfig';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      await axiosInstance.patch(`/password_resets/${token}`, { password });
      navigate('/login', { state: { notice: 'Password updated. Please log in.' } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Box sx={{ width: 440 }}>
        <Typography variant="h4" fontWeight={700} color="#7B2FBE" mb={1}>
          Reset password
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Choose a new password for your account.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="New password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{ py: 1.5, bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Update password'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" mt={3} textAlign="center">
          <Link to="/login" style={{ color: '#7B2FBE', textDecoration: 'none' }}>Back to login</Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default ResetPassword;
