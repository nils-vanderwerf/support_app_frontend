import React, { useState, useEffect } from 'react';
import { SupportWorker, Client } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { formatDuration } from '../utils/formatDuration';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Container,
  Box,
} from '@mui/material';
import axiosInstance from '../api/axiosConfig';
import SupportWorkerProfile from './SupportWorker';
import ClientProfile from './ClientProfile';
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
  const [selectedWorker, setSelectedWorker] = useState<SupportWorker | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { client } = useAuth();
  const isClient = !!client;

  useEffect(() => {
    const fetchData = async () => {
      try {
      const response = await axiosInstance.get('/appointments')
      setAppointments(response.data);
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };

    fetchData();
  }, []);

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
                <TableCell>{isClient ? "Support Worker" : "Client"}</TableCell>
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
                    onClick={() => isClient
                      ? setSelectedWorker(appointment.support_worker)
                      : setSelectedClient(appointment.client)
                    }
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
      {selectedWorker && (
        <SupportWorkerProfile
          worker={selectedWorker}
          handleClose={() => setSelectedWorker(null)}
          onSuccess={() => setSelectedWorker(null)}
        />
      )}
      {selectedClient && (
        <ClientProfile
          client={selectedClient}
          handleClose={() => setSelectedClient(null)}
          onSuccess={() => setSelectedClient(null)}
        />
      )}
      </Container>
    );
};

export default AppointmentList;
