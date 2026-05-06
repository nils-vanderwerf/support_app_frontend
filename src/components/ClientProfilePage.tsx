import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, Chip, Button, Paper, Grid, Divider, CircularProgress,
} from '@mui/material';
import { LocationOn, Phone, Email, Favorite, Warning, ArrowBack, CalendarMonth } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { Client } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import BookingForm from './BookingForm';

const ClientProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supportWorker } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    axiosInstance.get(`/clients/${id}`)
      .then(res => setClient(res.data))
      .catch(() => navigate('/clients'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (!client) return null;

  const initials = `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`;
  const medications = client.medication ? client.medication.split(',').map(m => m.trim()).filter(Boolean) : [];
  const allergies = client.allergies ? client.allergies.split(',').map(a => a.trim()).filter(Boolean) : [];

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
                {client.first_name} {client.middle_name ? `${client.middle_name} ` : ''}{client.last_name}
              </Typography>
              <Typography variant="body1" color="text.secondary">Client</Typography>
            </Box>
            <Box display="flex" gap={1} mt={1}>
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}
                sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}>
                Back
              </Button>
              {supportWorker && (
                <Button variant="contained" startIcon={<CalendarMonth />}
                  onClick={() => setShowBookingForm(true)}
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
              <Typography variant="body2">{client.location || '—'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Phone sx={{ color: '#7B2FBE', fontSize: 20 }} />
              <Typography variant="body2">{client.phone || '—'}</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Email sx={{ color: '#7B2FBE', fontSize: 20 }} />
              <Typography variant="body2">{client.email || '—'}</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Emergency Contact</Typography>
            <Typography variant="body2" fontWeight={500}>
              {client.emergency_contact_first_name} {client.emergency_contact_last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">{client.emergency_contact_phone}</Typography>
          </Paper>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={8}>
          {client.bio && (
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={1}>About</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">{client.bio}</Typography>
            </Paper>
          )}

          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Favorite sx={{ color: '#7B2FBE' }} />
              <Typography variant="h6" fontWeight={600}>Health Information</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {client.health_conditions && (
              <Box mb={2}>
                <Typography variant="body2" fontWeight={600} mb={0.5}>Health Conditions</Typography>
                <Typography variant="body2" color="text.secondary">{client.health_conditions}</Typography>
              </Box>
            )}
            {medications.length > 0 && (
              <Box mb={2}>
                <Typography variant="body2" fontWeight={600} mb={1}>Medications</Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {medications.map(m => (
                    <Chip key={m} label={m} size="small" sx={{ bgcolor: '#7B2FBE', color: 'white' }} />
                  ))}
                </Box>
              </Box>
            )}
            {allergies.length > 0 && (
              <Box>
                <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                  <Warning sx={{ color: '#e65100', fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={600}>Allergies</Typography>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {allergies.map(a => (
                    <Chip key={a} label={a} size="small" sx={{ bgcolor: '#e65100', color: 'white' }} />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {showBookingForm && supportWorker && (
        <BookingForm
          clientId={client.id}
          supportWorkerId={supportWorker.id}
          onSuccess={() => setShowBookingForm(false)}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </Box>
  );
};

export default ClientProfilePage;
