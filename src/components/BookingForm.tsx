import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { Dialog, DialogTitle, DialogActions, DialogContent, TextField, Box, Button } from '@mui/material';
import { CloseOutlined, Chat } from '@mui/icons-material';
import { Appointment } from './AppointmentList';

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

  const handleSubmit = async () => {
    const datetime = `${date}T${time}:00${localOffsetStr()}`;
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
            status: isPending ? 'pending' : 'approved',
          }
        });
      }
      onClose();
      onSuccess(datetime);
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
          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
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
          {isPending ? 'Send Invitation' : 'Book'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingForm;
