import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import {
  Dialog, DialogTitle, DialogActions, DialogContent, TextField, Box, Button,
  Switch, FormControlLabel, ToggleButton, ToggleButtonGroup, Typography, Divider,
} from '@mui/material';
import LocationAutocomplete from './LocationAutocomplete';
import { CloseOutlined, Chat } from '@mui/icons-material';
import { Appointment } from './AppointmentList';

type Frequency = 'weekly' | 'fortnightly' | 'monthly';

function buildRecurringDates(startDate: string, frequency: Frequency, count: number): string[] {
  const dates: string[] = [];
  const base = new Date(startDate + 'T12:00:00');
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    if (frequency === 'weekly') d.setDate(base.getDate() + i * 7);
    else if (frequency === 'fortnightly') d.setDate(base.getDate() + i * 14);
    else d.setMonth(base.getMonth() + i);
    dates.push(d.toLocaleDateString('en-CA'));
  }
  return dates;
}

function formatPreviewDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

interface Suggested {
  date?: string | null;
  time?: string | null;
  duration?: number | null;
  location?: string | null;
  notes?: string | null;
}

interface BookingProps {
  clientId: number;
  supportWorkerId: number;
  onClose: () => void;
  onSuccess: (date: string) => void;
  appointment?: Appointment;
  isPending?: boolean;
  suggested?: Suggested;
}

const toDatePart = (iso: string) => new Date(iso).toLocaleDateString('en-CA');
const toTimePart = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const localOffsetStr = () => {
  const off = new Date().getTimezoneOffset();
  const sign = off <= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
};

const BookingForm = ({ clientId, supportWorkerId, onClose, onSuccess, appointment, isPending = false, suggested }: BookingProps) => {
  const navigate = useNavigate();
  const [date, setDate] = useState(appointment ? toDatePart(appointment.date) : (suggested?.date ?? new Date().toISOString().split('T')[0]));
  const [time, setTime] = useState(appointment ? toTimePart(appointment.date) : (suggested?.time ?? '09:00'));
  const [duration, setDuration] = useState(appointment?.duration ?? suggested?.duration ?? 0);
  const [location, setLocation] = useState(appointment?.location ?? suggested?.location ?? '');
  const [notes, setNotes] = useState(appointment?.notes ?? suggested?.notes ?? '');
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [repeatCount, setRepeatCount] = useState(4);

  const isNew = !appointment;
  const recurringDates = recurring && isNew ? buildRecurringDates(date, frequency, repeatCount) : [];

  const handleSubmit = async () => {
    const offset = localOffsetStr();
    try {
      if (appointment) {
        const datetime = `${date}T${time}:00${offset}`;
        await axiosInstance.patch(`/appointments/${appointment.id}`, {
          appointment: { date: datetime, duration, location, notes }
        });
        onClose();
        onSuccess(datetime);
      } else if (recurring && recurringDates.length > 0) {
        await Promise.all(
          recurringDates.map(d =>
            axiosInstance.post('/appointments', {
              appointment: {
                date: `${d}T${time}:00${offset}`,
                duration, location, notes,
                client_id: clientId,
                support_worker_id: supportWorkerId,
                status: isPending ? 'pending' : 'approved',
              }
            })
          )
        );
        onClose();
        onSuccess(`${recurringDates[0]}T${time}:00${offset}`);
      } else {
        const datetime = `${date}T${time}:00${offset}`;
        await axiosInstance.post('/appointments', {
          appointment: {
            date: datetime, duration, location, notes,
            client_id: clientId,
            support_worker_id: supportWorkerId,
            status: isPending ? 'pending' : 'approved',
          }
        });
        onClose();
        onSuccess(datetime);
      }
    } catch (error) {
      console.error('Error posting data: ', error);
    }
  };

  return (
    <Dialog open={true} aria-labelledby="booking-dialog-title">
      <DialogTitle id="booking-dialog-title">
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          {appointment ? "Edit Appointment" : isPending ? "Send Appointment Invitation" : "Book Appointment"}
          <CloseOutlined sx={{ color: 'text.secondary' }} onClick={onClose} />
        </Box>
      </DialogTitle>

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
          <TextField
            label="Duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
          />
          <LocationAutocomplete value={location} onChange={setLocation} />
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {isNew && !isPending && (
            <>
              <Divider />
              <FormControlLabel
                control={
                  <Switch
                    checked={recurring}
                    onChange={e => setRecurring(e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7B2FBE' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7B2FBE' } }}
                  />
                }
                label="Recurring booking"
              />

              {recurring && (
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <ToggleButtonGroup
                    value={frequency}
                    exclusive
                    onChange={(_, v) => { if (v) setFrequency(v); }}
                    size="small"
                  >
                    {(['weekly', 'fortnightly', 'monthly'] as Frequency[]).map(f => (
                      <ToggleButton
                        key={f}
                        value={f}
                        sx={{
                          textTransform: 'capitalize',
                          '&.Mui-selected': { bgcolor: '#7B2FBE', color: 'white', '&:hover': { bgcolor: '#6a27a3' } },
                        }}
                      >
                        {f}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>

                  <TextField
                    label="Number of sessions"
                    type="number"
                    size="small"
                    value={repeatCount}
                    onChange={e => setRepeatCount(Math.max(2, Math.min(52, parseInt(e.target.value) || 2)))}
                    inputProps={{ min: 2, max: 52 }}
                    sx={{ width: 180 }}
                  />

                  {recurringDates.length > 0 && (
                    <Box sx={{ bgcolor: '#f3e8ff', borderRadius: 2, px: 2, py: 1.5 }}>
                      <Typography variant="caption" fontWeight={600} color="#7B2FBE" display="block" mb={0.5}>
                        {recurringDates.length} appointments will be created
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {recurringDates.map(formatPreviewDate).join(' · ')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        {!isPending && (
          <Button
            startIcon={<Chat />}
            onClick={async () => {
              const res = await axiosInstance.post('/conversations', { client_id: clientId, support_worker_id: supportWorkerId });
              onClose();
              navigate(`/messages/${res.data.id}`);
            }}
            sx={{ color: '#7B2FBE' }}
          >
            Send Message
          </Button>
        )}
        <Button onClick={handleSubmit} autoFocus sx={{ ml: 'auto' }}>
          {isPending ? 'Send Invitation' : recurring ? `Book ${repeatCount} Sessions` : 'Book'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingForm;
