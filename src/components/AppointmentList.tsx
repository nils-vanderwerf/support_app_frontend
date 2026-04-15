import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDuration } from '../utils/formatDuration';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Container, Box, Chip,
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
  status: string;
}

const statusChip = (status: string) => {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    approved:  { label: 'Approved',  color: '#1b5e20', bg: '#e8f5e9' },
    pending:   { label: 'Pending',   color: '#e65100', bg: '#fff3e0' },
    declined:  { label: 'Declined',  color: '#b71c1c', bg: '#ffebee' },
  };
  const s = map[status] ?? { label: status, color: '#555', bg: '#f5f5f5' };
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: '0.7rem' }}
    />
  );
};

const AppointmentTable = ({
  rows, isClient, onEdit, onDelete, onRebook, showActions,
}: {
  rows: Appointment[];
  isClient: boolean;
  onEdit: (a: Appointment) => void;
  onDelete: (a: Appointment) => void;
  onRebook: (a: Appointment) => void;
  showActions: boolean;
}) => (
  <TableContainer component={Paper} sx={{ overflowX: 'auto', mb: 2 }}>
    <Table sx={{ minWidth: 600 }}>
      <TableHead>
        <TableRow sx={{ bgcolor: '#f9f4ff' }}>
          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>{isClient ? 'Support Worker' : 'Client'}</TableCell>
          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 700 }}>Location</TableCell>
          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 700 }}>Duration</TableCell>
          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 700 }}>Notes</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
          {showActions && <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((a) => (
          <TableRow key={a.id} hover>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>
              {new Date(a.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </TableCell>
            <TableCell
              sx={{ cursor: 'pointer', color: '#7B2FBE', fontWeight: 600, '&:hover': { textDecoration: 'underline' }, whiteSpace: 'nowrap' }}
            >
              {isClient
                ? `${a.support_worker?.first_name ?? ''} ${a.support_worker?.last_name ?? ''}`.trim() || '—'
                : `${a.client?.first_name ?? ''} ${a.client?.last_name ?? ''}`.trim() || '—'
              }
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{a.location}</TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatDuration(a.duration)}</TableCell>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{a.notes}</TableCell>
            <TableCell>{statusChip(a.status)}</TableCell>
            {showActions && (
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {new Date(a.date) > new Date() ? (
                  <Box display="flex" gap={1}>
                    <Button size="small" variant="outlined" onClick={() => onEdit(a)} sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}>Edit</Button>
                    <Button size="small" variant="outlined" onClick={() => onDelete(a)} color="error">Delete</Button>
                  </Box>
                ) : (
                  <Button size="small" variant="outlined" onClick={() => onRebook(a)} sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}>Rebook</Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

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

  const now = new Date();
  const upcoming = appointments
    .filter(a => new Date(a.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = appointments
    .filter(a => new Date(a.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  const sectionLabel = (title: string, count: number) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, mt: 3 }}>
      <Typography variant="h6" fontWeight={700}>{title}</Typography>
      <Chip label={count} size="small" sx={{ bgcolor: '#ede7f6', color: '#7B2FBE', fontWeight: 700 }} />
    </Box>
  );

  return (
    <Container>
      <Box mt={5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>Appointments</Typography>
          <Button
            variant="contained"
            sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}
            onClick={() => setAgentOpen(true)}
          >
            Book with AI
          </Button>
        </Box>

        {upcoming.length === 0 && past.length === 0 && (
          <Typography fontStyle="italic" mt={2}>No appointments found</Typography>
        )}

        {upcoming.length > 0 && (
          <>
            {sectionLabel('Upcoming', upcoming.length)}
            <AppointmentTable
              rows={upcoming}
              isClient={isClient}
              onEdit={handleEdit}
              onDelete={(a) => { setAppointmentToDelete(a); setDeleteDialogueVisible(true); }}
              onRebook={setRebookAppointment}
              showActions
            />
          </>
        )}

        {past.length > 0 && (
          <>
            {sectionLabel('Past Appointments', past.length)}
            <AppointmentTable
              rows={past}
              isClient={isClient}
              onEdit={handleEdit}
              onDelete={(a) => { setAppointmentToDelete(a); setDeleteDialogueVisible(true); }}
              onRebook={setRebookAppointment}
              showActions
            />
          </>
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
