import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, Chip, Button, Paper, Grid, Divider,
  CircularProgress, TextField, MenuItem,
} from '@mui/material';
import { LocationOn, Phone, Email, Work, Schedule, ArrowBack, Edit, Save, Cancel, Chat, VerifiedUser, ChildCare, Cake } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { SupportWorker } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AvailabilitySelector, { formatAvailability } from './AvailabilitySelector';
import BookingForm from './BookingForm';
import LocationAutocomplete from './LocationAutocomplete';
import DateOfBirthPicker from './DateOfBirthPicker';
import InstitutionAutocomplete from './InstitutionAutocomplete';
import { QUALIFICATIONS } from '../constants/selectorOptions';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

const SupportWorkerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client, supportWorker } = useAuth();
  const { showToast } = useToast();
  const [worker, setWorker] = useState<SupportWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<SupportWorker>>({});
  const [showBookingForm, setShowBookingForm] = useState(false);

  const isOwnProfile = supportWorker?.id === Number(id);

  useEffect(() => {
    axiosInstance.get(`/support_workers/${id}`)
      .then(res => { setWorker(res.data); setForm(res.data); })
      .catch(() => navigate('/support-workers'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axiosInstance.patch(`/support_workers/${id}`, { support_worker: form });
      setWorker(res.data);
      setForm(res.data);
      setEditing(false);
    } catch (err: any) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof SupportWorker) =>
    editing
      ? <TextField size="small" fullWidth value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
      : <Typography variant="body2">{(worker as any)?.[key] || '—'}</Typography>;

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (!worker) return null;

  const initials = `${worker.first_name.charAt(0)}${worker.last_name.charAt(0)}`;

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
                  {worker.first_name} {worker.middle_name ? `${worker.middle_name} ` : ''}{worker.last_name}
                </Typography>
              )}
              <Typography variant="body1" color="text.secondary" mb={1}>Support Worker</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {worker.police_check_number && (
                  <Chip
                    icon={<VerifiedUser sx={{ fontSize: '16px !important' }} />}
                    label="Police Check Verified"
                    size="small"
                    sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, '& .MuiChip-icon': { color: '#2e7d32' } }}
                  />
                )}
                {worker.wwcc_number && (
                  <Chip
                    icon={<ChildCare sx={{ fontSize: '16px !important' }} />}
                    label="Working with Children Verified"
                    size="small"
                    sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, '& .MuiChip-icon': { color: '#2e7d32' } }}
                  />
                )}
              </Box>
            </Box>
            <Box display="flex" gap={1} mt={{ xs: 0, sm: 1 }} flexWrap="wrap" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}>Back</Button>
              {isOwnProfile && !editing && (
                <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditing(true)} sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}>Edit Profile</Button>
              )}
              {editing && (
                <>
                  <Button variant="outlined" startIcon={<Cancel />} onClick={() => { setEditing(false); setForm(worker); }} sx={{ borderColor: 'grey.400', color: 'grey.600' }}>Cancel</Button>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving} sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a0dad' } }}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </>
              )}
              {client && !editing && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Chat />}
                    onClick={async () => {
                      const res = await axiosInstance.post('/conversations', { support_worker_id: worker.id });
                      navigate(`/messages/${res.data.id}`);
                    }}
                    sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}
                  >
                    Message
                  </Button>
                  <Button variant="contained" onClick={() => setShowBookingForm(true)} sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a0dad' } }}>
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
                ? <LocationAutocomplete value={form.location ?? ''} onChange={v => setForm({ ...form, location: v })} size="small" />
                : <Typography variant="body2">{worker.location || '—'}</Typography>}
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Phone sx={{ color: '#7B2FBE', fontSize: 20, flexShrink: 0 }} />
              {field('phone')}
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Email sx={{ color: '#7B2FBE', fontSize: 20, flexShrink: 0 }} />
              <Typography variant="body2">{worker.email}</Typography>
            </Box>
            <Box display="flex" alignItems="flex-start" gap={1}>
              <Schedule sx={{ color: '#7B2FBE', fontSize: 20, flexShrink: 0, mt: 0.25 }} />
              {editing
                ? <AvailabilitySelector value={form.availability ?? ''} onChange={v => setForm({ ...form, availability: v })} />
                : <Typography variant="body2">{formatAvailability(worker.availability) || '—'}</Typography>
              }
            </Box>
            {!editing && worker.age != null && (
              <Box display="flex" alignItems="center" gap={1} mt={1.5}>
                <Cake sx={{ color: '#7B2FBE', fontSize: 20, flexShrink: 0 }} />
                <Typography variant="body2">{worker.age}</Typography>
              </Box>
            )}
            {editing && (
              <Box mt={2} display="flex" flexDirection="column" gap={1.5}>
                <TextField select size="small" fullWidth label="Gender" value={form.gender ?? ''} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  {GENDERS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
                <DateOfBirthPicker value={form.date_of_birth} onChange={v => setForm({ ...form, date_of_birth: v })} />
                <TextField select size="small" fullWidth label="Qualification (optional)" value={form.qualification ?? ''} onChange={e => setForm({ ...form, qualification: e.target.value })}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {QUALIFICATIONS.map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
                </TextField>
                <TextField size="small" fullWidth label="Field of study (optional)" value={form.field_of_study ?? ''} onChange={e => setForm({ ...form, field_of_study: e.target.value })} />
                <InstitutionAutocomplete value={form.institution ?? ''} onChange={v => setForm({ ...form, institution: v })} size="small" />
              </Box>
            )}
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

          {!editing && (worker.qualification || worker.institution) && (
            <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>Education</Typography>
              {worker.qualification && (
                <Chip
                  label={worker.field_of_study ? `${worker.qualification} — ${worker.field_of_study}` : worker.qualification}
                  size="small"
                  sx={{ bgcolor: '#7B2FBE', color: 'white', mb: worker.institution ? 1 : 0 }}
                />
              )}
              {worker.institution && (
                <Typography variant="body2" color="text.secondary">{worker.institution}</Typography>
              )}
            </Paper>
          )}

          {(editing || worker.emergency_contact_first_name) && (
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
                  <Typography variant="body2" fontWeight={500}>{worker.emergency_contact_first_name} {worker.emergency_contact_last_name}</Typography>
                  <Typography variant="body2" color="text.secondary">{worker.emergency_contact_phone}</Typography>
                </>
              )}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={1}>About</Typography>
            <Divider sx={{ mb: 2 }} />
            {editing
              ? <TextField multiline rows={4} fullWidth value={form.bio ?? ''} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Write something about yourself…" />
              : <Typography variant="body1" color="text.secondary">{worker.bio || '—'}</Typography>
            }
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Work sx={{ color: '#7B2FBE' }} />
              <Typography variant="h6" fontWeight={600}>Experience</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {editing
              ? (
                <TextField
                  size="small"
                  label="Years of experience"
                  type="number"
                  value={form.experience ?? ''}
                  onChange={e => setForm({ ...form, experience: Math.max(0, parseInt(e.target.value) || 0) })}
                  inputProps={{ min: 0, max: 50 }}
                  sx={{ width: 180 }}
                />
              )
              : (
                <Typography variant="body1" color="text.secondary">
                  {worker.experience != null ? `${worker.experience} year${worker.experience === 1 ? '' : 's'}` : '—'}
                </Typography>
              )
            }
          </Paper>
        </Grid>
      </Grid>

      {showBookingForm && client && (
        <BookingForm clientId={client.id} supportWorkerId={worker.id} onSuccess={() => { showToast('Appointment booked'); setShowBookingForm(false); }} onClose={() => setShowBookingForm(false)} />
      )}
    </Box>
  );
};

export default SupportWorkerProfilePage;
