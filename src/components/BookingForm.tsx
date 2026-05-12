import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import {
  Dialog, DialogTitle, DialogActions, DialogContent, TextField, Box, Button,
  Switch, FormControlLabel, ToggleButton, ToggleButtonGroup, Typography, Divider,
  useMediaQuery, useTheme, InputAdornment,
} from '@mui/material';
import LocationAutocomplete from './LocationAutocomplete';
import { CloseOutlined, Chat, Warning } from '@mui/icons-material';
import { Appointment } from './AppointmentList';

interface ExistingAppt {
  id: number;
  date: string;
  duration: number;
  notes?: string;
  client: { id: number; first_name: string; last_name: string };
  support_worker: { id: number; first_name: string; last_name: string };
}

function detectClashesForDates(
  dates: string[], time: string, duration: number, offset: string, existing: ExistingAppt[]
) {
  return dates.flatMap(d => {
    const start = new Date(`${d}T${time}:00${offset}`).getTime();
    const end = start + (duration || 60) * 60_000;
    const clash = existing.find(a => {
      const as = new Date(a.date).getTime();
      const ae = as + (a.duration || 60) * 60_000;
      return start < ae && end > as;
    });
    return clash ? [{ date: `${d}T${time}:00${offset}`, clash }] : [];
  });
}

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
  conversationId?: number;
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

  useEffect(() => {
    axiosInstance.get('/appointments').then(r => setExistingAppts(r.data)).catch(() => {});
  }, []);

  const isNew = !appointment;
  const recurringDates = recurring ? buildRecurringDates(date, frequency, repeatCount) : [];

  const doSubmit = async () => {
    const offset = localOffsetStr();
    try {
      if (appointment) {
        const datetime = `${date}T${time}:00${offset}`;
        await axiosInstance.patch(`/appointments/${appointment.id}`, {
          appointment: { date: datetime, duration, location, notes }
        });
        // Create follow-on sessions from the second date onward
        if (recurring && recurringDates.length > 1) {
          await Promise.all(
            recurringDates.slice(1).map(d =>
              axiosInstance.post('/appointments', {
                appointment: {
                  date: `${d}T${time}:00${offset}`,
                  duration, location, notes,
                  client_id: clientId,
                  support_worker_id: supportWorkerId,
                  status: 'approved',
                }
              })
            )
          );
        }
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
                ...(conversationId ? { conversation_id: conversationId } : {}),
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
            ...(conversationId ? { conversation_id: conversationId } : {}),
          }
        });
        onClose();
        onSuccess(datetime);
      }
    } catch (error) {
      console.error('Error posting data: ', error);
    }
  };

  const handleSubmit = () => {
    const offset = localOffsetStr();
    const datesToCheck = recurring && recurringDates.length > 0
      ? recurringDates
      : [date];
    const clashes = detectClashesForDates(datesToCheck, time, duration, offset, existingAppts);
    if (clashes.length > 0) {
      setClashDialog({ clashes, onConfirm: doSubmit });
    } else {
      doSubmit();
    }
  };

  return (
    <Dialog open={true} aria-labelledby="booking-dialog-title" fullScreen={isMobile}>
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
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5} ml={0.25}>Duration</Typography>
            <Box display="flex" gap={1}>
              <TextField
                type="number"
                value={Math.floor(duration / 60)}
                onChange={e => {
                  const h = Math.max(0, parseInt(e.target.value) || 0);
                  setDuration(h * 60 + (duration % 60));
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
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

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
                        {!isNew
                          ? `This appointment updated + ${recurringDates.length - 1} new session${recurringDates.length - 1 !== 1 ? 's' : ''} added`
                          : isPending
                          ? `${recurringDates.length} invitations will be sent`
                          : `${recurringDates.length} appointments will be created`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {recurringDates.map(formatPreviewDate).join(' · ')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
          </>
        </Box>
      </DialogContent>
      {clashDialog && (
        <Dialog open onClose={() => setClashDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning sx={{ color: '#e65100' }} />
            Scheduling Conflict
          </DialogTitle>
          <DialogContent>
            <Typography mb={2}>
              {clashDialog.clashes.length === 1
                ? 'This time clashes with an existing appointment:'
                : `${clashDialog.clashes.length} selected times clash with existing appointments:`}
            </Typography>
            {clashDialog.clashes.map(({ date: d, clash }) => (
              <Box key={d} sx={{ mb: 1.5, p: 1.5, bgcolor: '#fff8f0', borderRadius: 2, border: '1px solid #ffcc80' }}>
                <Typography variant="body2" fontWeight={600} mb={0.5}>
                  {new Date(d).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clashes with{' '}
                  <Typography
                    component={RouterLink}
                    to="/appointments"
                    onClick={() => { setClashDialog(null); onClose(); }}
                    sx={{ color: '#7B2FBE', textDecoration: 'underline', cursor: 'pointer' }}
                    variant="body2"
                  >
                    {new Date(clash.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    {clash.notes ? ` · ${clash.notes}` : ''}
                  </Typography>
                </Typography>
              </Box>
            ))}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setClashDialog(null)}>Cancel</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => { clashDialog.onConfirm(); setClashDialog(null); }}
            >
              Book Anyway
            </Button>
          </DialogActions>
        </Dialog>
      )}

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
          {isPending
            ? recurring ? `Send ${repeatCount} Invitations` : 'Send Invitation'
            : recurring ? (isNew ? `Book ${repeatCount} Sessions` : `Save + Add ${repeatCount - 1} More`) : (appointment ? 'Save' : 'Book')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingForm;
