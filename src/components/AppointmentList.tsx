import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDuration } from '../utils/formatDuration';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Container, Box,
  Button, Snackbar, Dialog, DialogTitle, DialogActions, DialogContent,
} from '@mui/material';
import axiosInstance from '../api/axiosConfig';
import { SupportWorker, Client } from '../context/AuthContext';
import BookingForm from './BookingForm';
import BookingAgent from './BookingAgent';

export interface Appointment {
  id: number;
  date: string;
  support_worker: SupportWorker;
  client: Client;
  location: string;
  duration: number;
  notes: string;
}

const AppointmentList = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visibleMessage, setVisibleMessage] = useState('');
  const [deleteDialogueVisible, setDeleteDialogueVisible] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | undefined>(undefined);
  const [editDialogueVisible, setEditDialogueVisible] = useState(false);
  const [rebookAppointment, setRebookAppointment] = useState<Appointment | null>(null);
  const [agentOpen, setAgentOpen] = useState(false);

  const { client } = useAuth();
  const isClient = !!client;
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    try {
      const response = await axiosInstance.get('/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleDelete = async (appointment: Appointment) => {
    try {
      await axiosInstance.delete(`/appointments/${appointment.id}`);
      setAppointments(appointments.filter(a => a.id !== appointment.id));
      setVisibleMessage('Appointment successfully deleted');
      setDeleteDialogueVisible(false);
    } catch (error) {
      setVisibleMessage('Appointment could not be deleted');
      setDeleteDialogueVisible(false);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setEditDialogueVisible(true);
  };

  const handleNameClick = (appointment: Appointment) => {
    if (isClient) {
      navigate(`/support-workers/${appointment.support_worker.id}`);
    } else {
      navigate(`/clients/${appointment.client.id}`);
    }
  };

  return (
    <Container>
      <Box mt={5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Appointments</Typography>
          <Button
            variant="contained"
            sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}
            onClick={() => setAgentOpen(true)}
          >
            Book with AI
          </Button>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>{isClient ? 'Support Worker' : 'Client'}</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{new Date(appointment.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                  <TableCell
                    onClick={() => handleNameClick(appointment)}
                    sx={{ cursor: 'pointer', color: '#7B2FBE', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  >
                    {isClient
                      ? `${appointment.support_worker?.first_name ?? ''} ${appointment.support_worker?.last_name ?? ''}`.trim() || '—'
                      : `${appointment.client?.first_name ?? ''} ${appointment.client?.last_name ?? ''}`.trim() || '—'
                    }
                  </TableCell>
                  <TableCell>{appointment.location}</TableCell>
                  <TableCell>{formatDuration(appointment.duration)}</TableCell>
                  <TableCell>{appointment.notes}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {new Date(appointment.date) > new Date() ? (
                      <Box display="flex" gap={1} justifyContent="flex-start">
                        <Button size="small" variant="outlined" onClick={() => handleEdit(appointment)} sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}>Edit</Button>
                        <Button size="small" variant="outlined" onClick={() => { setAppointmentToDelete(appointment); setDeleteDialogueVisible(true); }} color="error">Delete</Button>
                      </Box>
                    ) : (
                      <Button size="small" variant="outlined" onClick={() => setRebookAppointment(appointment)} sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}>Rebook</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {appointments.length === 0 && (
          <Typography fontStyle="italic">No appointments found</Typography>
        )}
      </Box>
      {agentOpen && (
        <BookingAgent
          open={agentOpen}
          onClose={() => setAgentOpen(false)}
          onBooked={(convId) => { setAgentOpen(false); navigate(`/messages/${convId}`); }}
          isClient={isClient}
        />
      )}
      {editDialogueVisible && appointmentToEdit && (
        <BookingForm
          appointment={appointmentToEdit}
          clientId={appointmentToEdit.client.id}
          supportWorkerId={appointmentToEdit.support_worker.id}
          onClose={() => setEditDialogueVisible(false)}
          onSuccess={() => setVisibleMessage('Appointment successfully updated')}
        />
      )}
      {rebookAppointment && (
        <BookingForm
          clientId={rebookAppointment.client.id}
          supportWorkerId={rebookAppointment.support_worker.id}
          onClose={() => setRebookAppointment(null)}
          onSuccess={() => { setVisibleMessage('Appointment booked'); fetchAppointments(); }}
        />
      )}
      {deleteDialogueVisible && (
        <Dialog open={true} aria-labelledby="delete-dialog-title">
          <DialogTitle id="delete-dialog-title">Delete Appointment</DialogTitle>
          <DialogContent>Are you sure you want to delete this appointment?</DialogContent>
          <DialogActions>
            <Button onClick={() => appointmentToDelete && handleDelete(appointmentToDelete)}>Confirm</Button>
            <Button onClick={() => setDeleteDialogueVisible(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      )}
      {visibleMessage && (
        <Snackbar
          open={true}
          message={visibleMessage}
          onClose={() => setVisibleMessage('')}
          autoHideDuration={5000}
        />
      )}
    </Container>
  );
};

export default AppointmentList;
