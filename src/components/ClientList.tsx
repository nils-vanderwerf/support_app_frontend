import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Container, Box, Avatar,
} from '@mui/material';
import axiosInstance from '../api/axiosConfig';
import { Client } from '../context/AuthContext';

const ClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get('/clients')
      .then(res => setClients(res.data))
      .catch(err => console.error('Error fetching clients:', err));
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
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f3e8ff' } }}
                >
                  <TableCell>
                    <Avatar sx={{ bgcolor: '#7B2FBE' }}>
                      {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ color: '#7B2FBE', fontWeight: 600 }}>
                    {client.first_name} {client.last_name}
                  </TableCell>
                  <TableCell>{client.location}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.health_conditions}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default ClientList;
