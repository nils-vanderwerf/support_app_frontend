import React from 'react';
import { useState } from 'react';
import { SupportWorker } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import {
  Dialog, DialogTitle, DialogActions, DialogContent, TextField, Box, Button, Alert,
  Switch, FormControlLabel, ToggleButton, ToggleButtonGroup, Typography, Divider,
  useMediaQuery, useTheme, InputAdornment,
} from '@mui/material';
import LocationAutocomplete from './LocationAutocomplete';
import { CloseOutlined, Chat, Warning } from '@mui/icons-material';
import { Appointment } from './AppointmentList';


interface BookingProps {
  worker: SupportWorker;
  onClose: () => void;
  onSuccess: (date: string) => void;
  appointment?: Appointment;
}

const toDatePart = (iso: string) => iso.split('T')[0];
const toTimePart = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const BookingForm = ({ clientId, supportWorkerId, onClose, onSuccess, appointment, isPending = false, suggested, conversationId }: BookingProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [date, setDate] = useState(appointment ? toDatePart(appointment.date) : (suggested?.date ?? new Date().toISOString().split('T')[0]));
  const [time, setTime] = useState(appointment ? toTimePart(appointment.date) : (suggested?.time ?? '09:00'));
  const [duration, setDuration] = useState(appointment?.duration ?? suggested?.duration ?? 0);
  const [location, setLocation] = useState(appointment?.location ?? suggested?.location ?? '');
  const [notes, setNotes] = useState(appointment?.notes ?? suggested?.notes ?? '');
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [repeatCount, setRepeatCount] = useState(4);
  const [existingAppts, setExistingAppts] = useState<ExistingAppt[]>([]);
  const [clashDialog, setClashDialog] = useState<{
    clashes: Array<{ date: string; clash: ExistingAppt }>;
    onConfirm: () => void;
  } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const datetime = `${date}T${time}`;
    try {
      if (appointment) {
        await axiosInstance.patch(`/appointments/${appointment.id}`, {
          appointment: { date: datetime, duration, location, notes }
        });
      } else {
        await axiosInstance.post('/appointments', {
          appointment: {
            date: datetime,
            duration,
            location,
            notes,
            client_id: clientId,
            support_worker_id: supportWorkerId,
          }
        });
      }
      onClose();
      onSuccess(datetime);
    } catch (error) {
      console.error('Error posting data: ', error);
    }
  };

  const handleSubmit = () => {
    if (!duration || duration <= 0) {
      setError('Please set a duration greater than 0 minutes.');
      return;
    }
    const offset = localOffsetStr();
    const datesToCheck = recurring && recurringDates.length > 0
      ? recurringDates
      : [date];
    const appts = appointment ? existingAppts.filter(a => a.id !== appointment.id) : existingAppts;
    const clashes = detectClashesForDates(datesToCheck, time, duration, offset, appts);
    if (clashes.length > 0) {
      setClashDialog({ clashes, onConfirm: doSubmit });
    } else {
      doSubmit();
    }
  };

  return (
    <Dialog open={true} aria-labelledby="booking-dialog-title">
      <DialogTitle id="booking-dialog-title">
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          {appointment ? "Edit Appointment" : "Book Appointment"}
          <CloseOutlined sx={{ color: 'text.secondary' }} onClick={onClose} />
        </Box>
      </DialogTitle>

      {error && <Alert severity="error" sx={{ mx: 3, mt: 1 }}>{error}</Alert>}
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <TextField
            label="Time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5} ml={0.25}>Duration</Typography>
            <Box display="flex" gap={1}>
              <TextField
                type="number"
                value={Math.floor(duration / 60)}
                onChange={e => {
                  const h = Math.max(0, parseInt(e.target.value) || 0);
                  setDuration(h * 60 + (duration % 60));
                  setError('');
                }}
                size="small"
                sx={{ width: 100 }}
                inputProps={{ min: 0, max: 23 }}
                InputProps={{ endAdornment: <InputAdornment position="end">h</InputAdornment> }}
              />
              <TextField
                type="number"
                value={duration % 60}
                onChange={e => {
                  const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                  setDuration(Math.floor(duration / 60) * 60 + m);
                  setError('');
                }}
                size="small"
                sx={{ width: 110 }}
                inputProps={{ min: 0, max: 59, step: 15 }}
                InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
              />
            </Box>
          </Box>
          <LocationAutocomplete value={location} onChange={setLocation} />
          <TextField
            label="Location"
            value={location}
            onChange={(e) =>setLocation(e.target.value)}
          />
           <TextField
            label="Notes"
            value={notes}
            onChange={(e) =>setNotes(e.target.value)}
           />
           </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmit} autoFocus>
           Book
          </Button>
        )}
        <Button onClick={handleSubmit} autoFocus sx={{ ml: 'auto' }}>
          {isPending
            ? recurring ? `Send ${repeatCount} Invitations` : 'Send Invitation'
            : recurring ? (isNew ? `Book ${repeatCount} Sessions` : `Save + Add ${repeatCount - 1} More`) : (appointment ? 'Save' : 'Book')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingForm;