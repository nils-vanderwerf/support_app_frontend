import { useState } from 'react';
import {
  Drawer, Box, Typography, TextField, Button, CircularProgress,
  Alert, Divider, IconButton,
} from '@mui/material';
import { Close, AutoAwesome, Save } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';

interface Appointment {
  id: number;
  date: string;
  client_id: number;
  client?: { first_name: string; last_name: string };
}

interface Props {
  appointment: Appointment;
  open: boolean;
  onClose: () => void;
}

interface ReportFields {
  activities: string;
  observations: string;
  follow_up_actions: string;
}

const EMPTY: ReportFields = { activities: '', observations: '', follow_up_actions: '' };

const VisitReportDrawer = ({ appointment, open, onClose }: Props) => {
  const [fields, setFields] = useState<ReportFields>(EMPTY);
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const field = (key: keyof ReportFields, label: string) => (
    <TextField
      label={label}
      multiline
      minRows={3}
      fullWidth
      value={fields[key]}
      onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
    />
  );

  const handleDraft = async () => {
    setDrafting(true);
    setError('');
    try {
      const { data } = await axiosInstance.post('/visit_reports/draft', {
        appointment_id: appointment.id,
      });
      setFields({
        activities: data.activities ?? '',
        observations: data.observations ?? '',
        follow_up_actions: data.follow_up_actions ?? '',
      });
    } catch {
      setError('Could not generate draft. Try again.');
    } finally {
      setDrafting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await axiosInstance.post('/visit_reports', {
        appointment_id: appointment.id,
        client_id: appointment.client_id,
        date: appointment.date,
        ...fields,
      });
      setSaved(true);
    } catch {
      setError('Could not save report. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFields(EMPTY);
    setSaved(false);
    setError('');
    onClose();
  };

  const apptDate = new Date(appointment.date).toLocaleDateString([], { dateStyle: 'full' });
  const clientName = appointment.client
    ? `${appointment.client.first_name} ${appointment.client.last_name}`
    : 'Client';

  return (
    <Drawer anchor="right" open={open} onClose={handleClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3 } }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Visit Report</Typography>
          <Typography variant="caption" color="text.secondary">{clientName} · {apptDate}</Typography>
        </Box>
        <IconButton onClick={handleClose}><Close /></IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {saved ? (
        <Alert severity="success">Report saved successfully.</Alert>
      ) : (
        <Box display="flex" flexDirection="column" gap={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <Button
            variant="outlined"
            startIcon={drafting ? <CircularProgress size={16} /> : <AutoAwesome />}
            onClick={handleDraft}
            disabled={drafting}
            sx={{ borderColor: '#7B2FBE', color: '#7B2FBE', alignSelf: 'flex-start' }}
          >
            {drafting ? 'Generating draft…' : 'Generate draft with AI'}
          </Button>

          {field('activities', 'Activities')}
          {field('observations', 'Observations')}
          {field('follow_up_actions', 'Follow-up actions')}

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Save />}
            onClick={handleSave}
            disabled={saving || (!fields.activities && !fields.observations && !fields.follow_up_actions)}
            sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' }, mt: 1 }}
          >
            {saving ? 'Saving…' : 'Save Report'}
          </Button>
        </Box>
      )}
    </Drawer>
  );
};

export default VisitReportDrawer;
