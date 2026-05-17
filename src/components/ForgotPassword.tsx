import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import axiosInstance from '../api/axiosConfig';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/password_resets', { email });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Box sx={{ width: 440 }}>
        <Typography variant="h4" fontWeight={700} color="#7B2FBE" mb={1}>
          Forgot password
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Enter your email and we'll send you a reset link.
        </Typography>

        {submitted ? (
          <Alert severity="success">
            Check your inbox — if that email is registered you'll receive a reset link shortly.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Send reset link'}
            </Button>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" mt={3} textAlign="center">
          <Link to="/login" style={{ color: '#7B2FBE', textDecoration: 'none' }}>Back to login</Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
