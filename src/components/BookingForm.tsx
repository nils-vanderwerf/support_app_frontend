import React from 'react';
import { useState } from 'react';
import { SupportWorker } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogTitle, DialogActions, DialogContent, TextField, Box, Button } from '@mui/material';


interface BookingProps {
  worker: SupportWorker;
  onClose: () => void;
  onSuccess: (date: string) => void;
}

const BookingForm = ({worker, onClose, onSuccess}: BookingProps ) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(0);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const auth = useAuth();

    const handleSubmit = async() => {
        try {
          const response = await axiosInstance.post('/appointments', {
            appointment: {
               date: date,
               duration: duration,
               location: location,
               notes: notes,
               client_id: auth.client?.id,
               support_worker_id: worker.id
            }
          }
        );
        onClose();
        console.log('onSuccess called', date)
        onSuccess(date);
        } catch (error) {
          console.error('Error posting data: ', error);
        }
      };
    return (
      
       <Dialog
        open={true}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Book a Support Worker"}
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
            label="Duration"
            type="number"
            value={duration}
            onChange={(e) =>setDuration(parseInt(e.target.value))}
            />
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
        </DialogActions>
      </Dialog>
    )
  };

export default BookingForm;