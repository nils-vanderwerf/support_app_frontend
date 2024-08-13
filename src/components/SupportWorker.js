import React from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar
} from '@mui/material';
import { styled } from '@mui/system';

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

const SupportWorker = ({ worker, handleBook, handleClose, isBooked }) => {
  return (
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
            <Typography variant="body1"><strong>ID:</strong> {worker.id}</Typography>
            <Typography variant="body1"><strong>Location:</strong> {worker.location}</Typography>
            <Typography variant="body1"><strong>Availability:</strong> {worker.available_days.join(', ')}</Typography>
            <Typography variant="body1"><strong>Phone:</strong> {worker.phone}</Typography>
            <Typography variant="body1"><strong>Email:</strong> {worker.email}</Typography>
            {isBooked && (
              <Typography variant="body2" color="secondary" sx={{ mt: 2 }}>
                This worker has been booked.
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <CloseButton onClick={handleClose} variant="contained">
          Close
        </CloseButton>
        {!isBooked && (
          <Button onClick={() => handleBook(worker.id)} color="primary" variant="contained" sx={{ backgroundColor: '#007bff', color: '#fff' }}>
            Book
          </Button>
        )}
      </DialogActions>
    </CustomDialog>
  );
};

export default SupportWorker;
