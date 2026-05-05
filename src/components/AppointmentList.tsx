import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDuration } from '../utils/formatDuration';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Container, Box,
} from '@mui/material';
import axiosInstance from '../api/axiosConfig';
import { SupportWorker, Client } from '../context/AuthContext';

export interface Appointment {
  id: number;
  date: string;
  support_worker: SupportWorker;
  client: Client;
  location: string;
  duration: number;
  notes: string;
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
  const { client } = useAuth();
  const isClient = !!client;
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get('/appointments')
      .then(res => setAppointments(res.data))
      .catch(err => console.error('Error fetching appointments:', err));
  }, []);

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
        <Typography variant="h4" align="center" gutterBottom>
          Appointments
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>{isClient ? 'Support Worker' : 'Client'}</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                  <TableCell
                    onClick={() => handleNameClick(appointment)}
                    sx={{ cursor: 'pointer', color: '#7B2FBE', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  >
                    {isClient
                      ? `${appointment.support_worker.first_name} ${appointment.support_worker.last_name}`
                      : `${appointment.client.first_name} ${appointment.client.last_name}`
                    }
                  </TableCell>
                  <TableCell>{appointment.location}</TableCell>
                  <TableCell>{formatDuration(appointment.duration)}</TableCell>
                  <TableCell>{appointment.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {appointments.length === 0 && (
          <Typography fontStyle="italic">No appointments found</Typography>
        )}
      </Box>
    </Container>
  );
};

export default AppointmentList;
