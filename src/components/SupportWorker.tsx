import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Chip
} from '@mui/material';
import { SupportWorker as SupportWorkerType, useAuth } from '../context/AuthContext';
import { styled } from '@mui/system';
import { useState } from 'react';
import BookingForm from './BookingForm';

const CustomDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    width: '600px',
    border: '2px solid #e0e0e0', // Direct color definition for the border
    borderRadius: '10px',
    boxShadow: '0px 3px 6px rgba(0,0,0,0.16)',
  },
});

const HeaderBox = styled(Box)({
  backgroundColor: '#f0f0f0', // Light grey background
  borderRadius: '10px 10px 0 0', // Rounded top corners
  textAlign: 'center',
  padding: '16px 0',
  position: 'relative',
});

const IntersectingAvatar = styled(Avatar)({
  width: 128,
  height: 128,
  position: 'absolute',
  top: '125%',
  left: '15%',
  transform: 'translate(-50%, -50%)',
  boxShadow: '0 0 6px rgba(0,0,0,0.1)',
});

const CloseButton = styled(Button)({
  backgroundColor: '#808080', // Default grey color
  color: '#ffffff',
  '&:hover': {
    backgroundColor: '#ff4d4d', // Red color on hover
  },
});

interface SupportWorkerProps {
  worker: SupportWorkerType;
  handleClose: () => void;
  onSuccess: (date: string) => void;
}

const SupportWorker = ({ worker, handleClose, onSuccess}: SupportWorkerProps) => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const { client } = useAuth();

  return (
    <>
    <CustomDialog open onClose={handleClose}>
      <HeaderBox>
        <Typography variant="h6">Support Worker</Typography>
        <IntersectingAvatar>
          {worker.first_name.charAt(0)}{worker.last_name.charAt(0)}
        </IntersectingAvatar>
      </HeaderBox>
      <DialogTitle sx={{ textAlign: 'left', mt: 10 }}>
        {`${worker.first_name} ${worker.last_name}`}
      </DialogTitle>
      <DialogContent>
        <Box display="flex">
          <Box sx={{ flex: 1, pl: 2 }}>
            <Typography variant="body1"><strong>Location:</strong> {worker.location}</Typography>
            <Typography variant="body1"><strong>Availability:</strong> {worker.availability}</Typography>
            <Typography variant="body1"><strong>Phone:</strong> {worker.phone}</Typography>
            <Typography variant="body1"><strong>Email:</strong> {worker.email}</Typography>
            {worker.specializations && worker.specializations.length > 0 && (
              <Box mt={1}>
                <Typography variant="body1"><strong>Specializations:</strong></Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                  {worker.specializations.map((s) => (
                    <Chip key={s.id} label={s.name} size="small" sx={{ bgcolor: '#7B2FBE', color: 'white' }} />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <CloseButton onClick={handleClose} variant="contained">
          Close
        </CloseButton>
          {client && (
            <Button onClick={() => setShowBookingForm(true)} color="primary" variant="contained" sx={{ backgroundColor: '#007bff', color: '#fff' }}>
              Book
            </Button>
          )}
      </DialogActions>
      </CustomDialog>
        {showBookingForm && client && (
          <BookingForm
            clientId={client.id}
            supportWorkerId={worker.id}
            onSuccess={onSuccess}
            onClose={() => setShowBookingForm(false)}
          />
        )}
    </>
  );
};

export default SupportWorker;
