import { useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
} from '@mui/material';
import { styled } from '@mui/system';
import { Client, useAuth } from '../context/AuthContext';
import BookingForm from './BookingForm';

const CustomDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    width: '600px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    boxShadow: '0px 3px 6px rgba(0,0,0,0.16)',
  },
});

const HeaderBox = styled(Box)({
  backgroundColor: '#f0f0f0',
  borderRadius: '10px 10px 0 0',
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
  backgroundColor: '#808080',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: '#ff4d4d',
  },
});

interface ClientProfileProps {
  client: Client;
  handleClose: () => void;
  onSuccess: (date: string) => void;
}

const ClientProfile = ({ client, handleClose, onSuccess }: ClientProfileProps) => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const { supportWorker } = useAuth();

  return (
    <>
      <CustomDialog open onClose={handleClose}>
        <HeaderBox>
          <Typography variant="h6">Client</Typography>
          <IntersectingAvatar>
            {client.first_name.charAt(0)}{client.last_name.charAt(0)}
          </IntersectingAvatar>
        </HeaderBox>
        <DialogTitle sx={{ textAlign: 'left', mt: 10 }}>
          {`${client.first_name} ${client.last_name}`}
        </DialogTitle>
        <DialogContent>
          <Box display="flex">
            <Box sx={{ flex: 1, pl: 2 }}>
              <Typography variant="body1"><strong>Location:</strong> {client.location}</Typography>
              <Typography variant="body1"><strong>Phone:</strong> {client.phone}</Typography>
              <Typography variant="body1"><strong>Health Conditions:</strong> {client.health_conditions}</Typography>
              <Typography variant="body1"><strong>Medication:</strong> {client.medication}</Typography>
              <Typography variant="body1"><strong>Allergies:</strong> {client.allergies}</Typography>
              <Typography variant="body1"><strong>Emergency Contact:</strong> {client.emergency_contact_first_name} {client.emergency_contact_last_name} ({client.emergency_contact_phone})</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <CloseButton onClick={handleClose} variant="contained">Close</CloseButton>
          {supportWorker && (
            <Button onClick={() => setShowBookingForm(true)} color="primary" variant="contained" sx={{ backgroundColor: '#007bff', color: '#fff' }}>
              Book
            </Button>
          )}
        </DialogActions>
      </CustomDialog>
      {showBookingForm && supportWorker && (
        <BookingForm
          clientId={client.id}
          supportWorkerId={supportWorker.id}
          onSuccess={onSuccess}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </>
  );
};

export default ClientProfile;
