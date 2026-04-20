import React, { useState, useEffect } from 'react';

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

export interface Appointment {
  id: number;
  date: string;
  support_worker_id: number;
  client_id: number;
  location: string;
  duration: number;
  notes: string; 
}

const AppointmentList = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  

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
                <TableCell>Support Worker</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{appointment.date}</TableCell>
                  <TableCell>{`${appointment.client_id ? appointment.client_id : appointment.support_worker_id }`}</TableCell>
                  <TableCell>{appointment.location}</TableCell>
                  <TableCell>{appointment.duration}</TableCell>
                  <TableCell>{appointment.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      </Container>
    );
};

export default AppointmentList;
