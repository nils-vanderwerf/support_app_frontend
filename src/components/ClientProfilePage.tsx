import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, Chip, Button, Paper, Grid, Divider,
  CircularProgress, TextField, MenuItem,
} from '@mui/material';
import { LocationOn, Phone, Email, Favorite, Warning, ArrowBack, CalendarMonth, Edit, Save, Cancel, Chat, Cake, Assessment } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { Client } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BookingForm from './BookingForm';
import DateOfBirthPicker from './DateOfBirthPicker';
import ClientProgressReportDrawer from './ClientProgressReportDrawer';
import ClientVisitReports from './ClientVisitReports';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const ClientProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supportWorker, client: authClient } = useAuth();
  const { showToast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showProgressReport, setShowProgressReport] = useState(false);

  const isOwnProfile = authClient?.id === Number(id);

  useEffect(() => {
    axiosInstance.get(`/clients/${id}`)
      .then(res => { setClient(res.data); setForm(res.data); })
      .catch(() => navigate('/clients'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axiosInstance.patch(`/clients/${id}`, { client: form });
      setClient(res.data);
      setForm(res.data);
      setEditing(false);
    } catch (err: any) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const medications = form.medication ? form.medication.split(',').map(m => m.trim()).filter(Boolean) : [];
  const allergies = form.allergies ? form.allergies.split(',').map(a => a.trim()).filter(Boolean) : [];

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (!client) return null;

  const initials = `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`;

  return (
    <Box maxWidth={900} mx="auto" px={{ xs: 1, sm: 0 }}>
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ height: { xs: 120, sm: 200 }, bgcolor: '#7B2FBE' }} />
        <Box sx={{ px: { xs: 2, sm: 4 }, pb: 3, position: 'relative' }}>
          <Avatar sx={{ width: { xs: 80, sm: 120 }, height: { xs: 80, sm: 120 }, fontSize: { xs: 24, sm: 40 }, bgcolor: '#5a1f9b', border: '4px solid white', position: 'absolute', top: { xs: -40, sm: -60 }, left: { xs: 16, sm: 32 } }}>
            {initials}
          </Avatar>
          <Box sx={{ ml: { xs: 0, sm: '160px' }, pt: { xs: '52px', sm: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 0 } }}>
            <Box flex={1} mr={{ xs: 0, sm: 2 }}>
              {editing ? (
                <Box display="flex" flexWrap="wrap" gap={1} mb={0.5}>
                  <TextField size="small" label="First name" value={form.first_name ?? ''} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                  <TextField size="small" label="Middle name" value={form.middle_name ?? ''} onChange={e => setForm({ ...form, middle_name: e.target.value })} />
                  <TextField size="small" label="Last name" value={form.last_name ?? ''} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                </Box>
              ) : (
                <Typography variant="h4" fontWeight={700}>
                  {client.first_name} {client.middle_name ? `${client.middle_name} ` : ''}{client.last_name}
                </Typography>
              )}
              <Typography variant="body1" color="text.secondary">Client</Typography>
            </Box>
            <Box display="flex" gap={1} mt={{ xs: 0, sm: 1 }} flexWrap="wrap" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}>Back</Button>
              {isOwnProfile && !editing && (
                <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditing(true)} sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}>Edit Profile</Button>
              )}
              {editing && (
                <>
                  <Button variant="outlined" startIcon={<Cancel />} onClick={() => { setEditing(false); setForm(client); }} sx={{ borderColor: 'grey.400', color: 'grey.600' }}>Cancel</Button>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving} sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a0dad' } }}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </>
              )}
              {supportWorker && !editing && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Chat />}
                    onClick={async () => {
                      const res = await axiosInstance.post('/conversations', { client_id: client.id });
                      navigate(`/messages/${res.data.id}`);
                    }}
                    sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}
                  >
                    Message
                  </Button>
                  {client.has_approved_appointment && (
                    <Button variant="outlined" startIcon={<Assessment />} onClick={() => setShowProgressReport(true)} sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}>
                      Progress Report
                    </Button>
                  )}
                  <Button variant="contained" startIcon={<CalendarMonth />} onClick={() => setShowBookingForm(true)} sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a0dad' } }}>
                    Book Appointment
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Contact</Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <LocationOn sx={{ color: '#7B2FBE', fontSize: 20, flexShrink: 0 }} />
              {editing
                ? <TextField size="small" fullWidth value={form.location ?? ''} onChange={e => setForm({ ...form, location: e.target.value })} />
                : <Typography variant="body2">{client.location || '—'}</Typography>
              }
            </Box>
            {(editing || client.phone) && (
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <Phone sx={{ color: '#7B2FBE', fontSize: 20, flexShrink: 0 }} />
                {editing
                  ? <TextField size="small" fullWidth value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  : <Typography variant="body2">{client.phone}</Typography>
                }
              </Box>
            )}
            {(editing || client.email) && (
              <Box display="flex" alignItems="center" gap={1}>
                <Email sx={{ color: '#7B2FBE', fontSize: 20, flexShrink: 0 }} />
                <Typography variant="body2">{client.email}</Typography>
              </Box>
            )}
            {!editing && client.age != null && (
              <Box display="flex" alignItems="center" gap={1} mt={1.5}>
                <Cake sx={{ color: '#7B2FBE', fontSize: 20, flexShrink: 0 }} />
                <Typography variant="body2">{client.age}</Typography>
              </Box>
            )}
            {editing && (
              <Box mt={2} display="flex" flexDirection="column" gap={1.5}>
                <TextField select size="small" fullWidth label="Gender" value={form.gender ?? ''} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  {GENDERS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
                <DateOfBirthPicker value={form.date_of_birth} onChange={v => setForm({ ...form, date_of_birth: v })} />
              </Box>
            )}
          </Paper>

          {(editing || client.emergency_contact_first_name) && (
            <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>Emergency Contact</Typography>
              {editing ? (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <TextField size="small" fullWidth label="First name" value={form.emergency_contact_first_name ?? ''} onChange={e => setForm({ ...form, emergency_contact_first_name: e.target.value })} />
                  <TextField size="small" fullWidth label="Last name" value={form.emergency_contact_last_name ?? ''} onChange={e => setForm({ ...form, emergency_contact_last_name: e.target.value })} />
                  <TextField size="small" fullWidth label="Phone" value={form.emergency_contact_phone ?? ''} onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })} />
                </Box>
              ) : (
                <>
                  <Typography variant="body2" fontWeight={500}>{client.emergency_contact_first_name} {client.emergency_contact_last_name}</Typography>
                  <Typography variant="body2" color="text.secondary">{client.emergency_contact_phone}</Typography>
                </>
              )}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          {(editing || client.bio) && (
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={1}>About</Typography>
              <Divider sx={{ mb: 2 }} />
              {editing
                ? <TextField multiline rows={4} fullWidth value={form.bio ?? ''} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Write something about yourself…" />
                : <Typography variant="body1" color="text.secondary">{client.bio}</Typography>
              }
            </Paper>
          )}

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Favorite sx={{ color: '#7B2FBE' }} />
              <Typography variant="h6" fontWeight={600}>Health Information</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {(editing || client.health_conditions) && (
              <Box mb={2}>
                <Typography variant="body2" fontWeight={600} mb={0.5}>Health Conditions</Typography>
                {editing
                  ? <TextField size="small" fullWidth value={form.health_conditions ?? ''} onChange={e => setForm({ ...form, health_conditions: e.target.value })} />
                  : <Typography variant="body2" color="text.secondary">{client.health_conditions}</Typography>
                }
              </Box>
            )}
            {(editing || client.medication) && (
              <Box mb={2}>
                <Typography variant="body2" fontWeight={600} mb={1}>Medications</Typography>
                {editing
                  ? <TextField size="small" fullWidth value={form.medication ?? ''} onChange={e => setForm({ ...form, medication: e.target.value })} helperText="Separate with commas" />
                  : <Box display="flex" flexWrap="wrap" gap={0.5}>{medications.map(m => <Chip key={m} label={m} size="small" sx={{ bgcolor: '#7B2FBE', color: 'white' }} />)}</Box>
                }
              </Box>
            )}
            {(editing || client.allergies) && (
              <Box>
                <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                  <Warning sx={{ color: '#e65100', fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={600}>Allergies</Typography>
                </Box>
                {editing
                  ? <TextField size="small" fullWidth value={form.allergies ?? ''} onChange={e => setForm({ ...form, allergies: e.target.value })} helperText="Separate with commas" />
                  : <Box display="flex" flexWrap="wrap" gap={0.5}>{allergies.map(a => <Chip key={a} label={a} size="small" sx={{ bgcolor: '#e65100', color: 'white' }} />)}</Box>
                }
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {(isOwnProfile || (supportWorker && client.has_approved_appointment)) && (
        <ClientVisitReports clientId={client.id} isOwnProfile={isOwnProfile} />
      )}

      {showBookingForm && supportWorker && (
        <BookingForm clientId={client.id} supportWorkerId={supportWorker.id} onSuccess={() => { showToast('Appointment booked'); setShowBookingForm(false); }} onClose={() => setShowBookingForm(false)} />
      )}

      <ClientProgressReportDrawer
        clientId={client.id}
        clientName={`${client.first_name} ${client.last_name}`}
        open={showProgressReport}
        onClose={() => setShowProgressReport(false)}
      />
    </Box>
  );
};

export default ClientProfilePage;
