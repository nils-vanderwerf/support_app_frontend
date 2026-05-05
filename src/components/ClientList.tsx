import { useState, useEffect } from 'react';
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
  Avatar,
  Button,
  Snackbar,
} from '@mui/material';
import ClientProfile from './ClientProfile';
import axiosInstance from '../api/axiosConfig';
import { Client } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

const ClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [visibleMessage, setVisibleMessage] = useState('');
  const { supportWorker } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/clients');
        setClients(response.data);
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
          Clients
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Avatar</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Health Conditions</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Avatar>{client.first_name.charAt(0)}{client.last_name.charAt(0)}</Avatar>
                  </TableCell>
                  <TableCell
                    onClick={() => setSelectedClient(client)}
                    sx={{ cursor: 'pointer', color: '#7B2FBE', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  >
                    {client.first_name} {client.last_name}
                  </TableCell>
                  <TableCell>{client.location}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.health_conditions}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setSelectedClient(client)}
                      style={{ borderRadius: 20 }}
                    >
                      {supportWorker ? 'Book' : 'View'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {selectedClient && (
        <ClientProfile
          client={selectedClient}
          handleClose={() => setSelectedClient(null)}
          onSuccess={(date) => {
            setVisibleMessage(`Appointment booked for ${selectedClient.first_name} ${selectedClient.last_name} on ${date}`);
            setSelectedClient(null);
          }}
        />
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

export default ClientList;
