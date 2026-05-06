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
