import { useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Dialog, DialogTitle, DialogActions, DialogContent, TextField, Box, Button } from '@mui/material';

interface BookingProps {
  clientId: number;
  supportWorkerId: number;
  onClose: () => void;
  onSuccess: (date: string) => void;
  appointment?: Appointment;
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

const BookingForm = ({ clientId, supportWorkerId, onClose, onSuccess, appointment }: BookingProps) => {
  const [date, setDate] = useState(appointment ? toDatePart(appointment.date) : new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(appointment ? toTimePart(appointment.date) : '09:00');
  const [duration, setDuration] = useState(appointment?.duration ?? 0);
  const [location, setLocation] = useState(appointment?.location ?? '');
  const [notes, setNotes] = useState(appointment?.notes ?? '');

  const handleSubmit = async () => {
    const datetime = `${date}T${time}:00${localOffsetStr()}`;
    try {
      await axiosInstance.post('/appointments', {
        appointment: {
          date,
          duration,
          location,
          notes,
          client_id: clientId,
          support_worker_id: supportWorkerId,
        }
      });
      onClose();
      onSuccess(date);
    } catch (error) {
      console.error('Error posting data: ', error);
    }
  };

  return (
    <Dialog open={true} aria-labelledby="booking-dialog-title">
      <DialogTitle id="booking-dialog-title">Book Appointment</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
      <DialogActions>
        <Button onClick={handleSubmit} autoFocus>Book</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingForm;