import { useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Dialog, DialogTitle, DialogActions, DialogContent, TextField, Box, Button } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import { Appointment } from './AppointmentList';

interface BookingProps {
  clientId: number;
  supportWorkerId: number;
  onClose: () => void;
  onSuccess: (date: string) => void;
  appointment?: Appointment;
}

const toDatePart = (iso: string) => iso.split('T')[0];
const toTimePart = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const BookingForm = ({ clientId, supportWorkerId, onClose, onSuccess, appointment }: BookingProps) => {
  const [date, setDate] = useState(appointment ? toDatePart(appointment.date) : new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(appointment ? toTimePart(appointment.date) : '09:00');
  const [duration, setDuration] = useState(appointment?.duration ?? 0);
  const [location, setLocation] = useState(appointment?.location ?? '');
  const [notes, setNotes] = useState(appointment?.notes ?? '');

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

  return (
    <Dialog open={true} aria-labelledby="booking-dialog-title">
      <DialogTitle id="booking-dialog-title">
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          {appointment ? "Edit Appointment" : "Book Appointment"}
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
      <DialogActions>
        <Button onClick={handleSubmit} autoFocus>Book</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingForm;
