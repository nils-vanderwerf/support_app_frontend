import { useState } from 'react';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/password_resets/request', { email });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Box sx={{ width: { xs: '95%', sm: 560 } }}>
        <Typography variant="h4" fontWeight="bold" mb={1} color="#7B2FBE">
          Forgot your password?
        </Typography>

        {submitted ? (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              If that email is registered, you'll receive a reset link shortly. Check your inbox.
            </Alert>
            <Typography variant="body2" align="center">
              <Link to="/login" style={{ color: '#7B2FBE' }}>Back to login</Link>
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Enter your email and we'll send you a link to reset your password.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
              <Typography variant="body2" align="center">
                <Link to="/login" style={{ color: '#7B2FBE', textDecoration: 'none' }}>Back to login</Link>
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ForgotPassword;
