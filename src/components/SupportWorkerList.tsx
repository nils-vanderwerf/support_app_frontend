import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Container, Box, Avatar,
} from '@mui/material';
import axiosInstance from '../api/axiosConfig';
import { SupportWorker as SupportWorkerType } from '../context/AuthContext';

const SupportWorkerList = () => {
  const [workers, setWorkers] = useState<SupportWorkerType[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get('/support_workers')
      .then(res => setWorkers(res.data))
      .catch(err => console.error('Error fetching support workers:', err));
  }, []);

  return (
    <Container>
      <Box mt={5}>
        <Typography variant="h4" align="center" gutterBottom>
          Support Workers
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Avatar</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Available Days</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workers.map((worker) => (
                <TableRow
                  key={worker.id}
                  onClick={() => navigate(`/support-workers/${worker.id}`)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f3e8ff' } }}
                >
                  <TableCell>
                    <Avatar sx={{ bgcolor: '#7B2FBE' }}>
                      {worker.first_name.charAt(0)}{worker.last_name.charAt(0)}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ color: '#7B2FBE', fontWeight: 600 }}>
                    {worker.first_name} {worker.last_name}
                  </TableCell>
                  <TableCell>{worker.location}</TableCell>
                  <TableCell>{worker.availability}</TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>{worker.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default SupportWorkerList;
