import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, Chip, Button, Paper, Grid, Divider, CircularProgress,
} from '@mui/material';
import { LocationOn, Phone, Email, Work, Schedule, ArrowBack } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { SupportWorker } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import BookingForm from './BookingForm';

const SupportWorkerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client } = useAuth();
  const [worker, setWorker] = useState<SupportWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    axiosInstance.get(`/support_workers/${id}`)
      .then(res => setWorker(res.data))
      .catch(() => navigate('/support-workers'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (!worker) return null;

  const initials = `${worker.first_name.charAt(0)}${worker.last_name.charAt(0)}`;

  return (
    <Box maxWidth={900} mx="auto">
      {/* Cover + Avatar */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ height: 200, bgcolor: '#7B2FBE', position: 'relative' }} />
        <Box sx={{ px: 4, pb: 3, position: 'relative' }}>
          <Avatar
            sx={{
              width: 120, height: 120, fontSize: 40, bgcolor: '#5a1f9b',
              border: '4px solid white', position: 'absolute', top: -60, left: 32,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ ml: '160px', pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {worker.first_name} {worker.middle_name ? `${worker.middle_name} ` : ''}{worker.last_name}
              </Typography>
              <Typography variant="body1" color="text.secondary">Support Worker</Typography>
            </Box>
            <Box display="flex" gap={1} mt={1}>
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}
                sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}>
                Back
              </Button>
              {client && (
                <Button variant="contained" onClick={() => setShowBookingForm(true)}
                  sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a0dad' } }}>
                  Book Appointment
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Contact</Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <LocationOn sx={{ color: '#7B2FBE', fontSize: 20 }} />
              <Typography variant="body2">{worker.location || '—'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Phone sx={{ color: '#7B2FBE', fontSize: 20 }} />
              <Typography variant="body2">{worker.phone || '—'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Email sx={{ color: '#7B2FBE', fontSize: 20 }} />
              <Typography variant="body2">{worker.email || '—'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Schedule sx={{ color: '#7B2FBE', fontSize: 20 }} />
              <Typography variant="body2">{worker.availability || '—'}</Typography>
            </Box>
          </Paper>

          {worker.specializations && worker.specializations.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>Specializations</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {worker.specializations.map(s => (
                  <Chip key={s.id} label={s.name} sx={{ bgcolor: '#7B2FBE', color: 'white' }} />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={8}>
          {worker.bio && (
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={1}>About</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">{worker.bio}</Typography>
            </Paper>
          )}

          {worker.experience && (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Work sx={{ color: '#7B2FBE' }} />
                <Typography variant="h6" fontWeight={600}>Experience</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">{worker.experience}</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {showBookingForm && client && (
        <BookingForm
          clientId={client.id}
          supportWorkerId={worker.id}
          onSuccess={() => setShowBookingForm(false)}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </Box>
  );
};

export default SupportWorkerProfilePage;
