import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Container, Box, Avatar, Button,
} from '@mui/material';
import axiosInstance from '../api/axiosConfig';
import { SupportWorker as SupportWorkerType } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import BookingAgent from './BookingAgent';

const SupportWorkerList = () => {
  const [workers, setWorkers] = useState<SupportWorkerType[]>([]);
  const [agentOpen, setAgentOpen] = useState(false);
  const { client } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get('/support_workers')
      .then(res => setWorkers(res.data))
      .catch(err => console.error('Error fetching support workers:', err));
  }, []);

  return (
    <Container>
      <Box mt={5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Support Workers</Typography>
          {client && (
            <Button variant="contained" sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }} onClick={() => setAgentOpen(true)}>
              Book with AI
            </Button>
          )}
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Avatar</TableCell>
                <TableCell>Name</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Location</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Available Days</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Specializations</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Experience</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Qualifications</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, minWidth: 130 }}>Phone</TableCell>
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
                  <TableCell>{formatAvailability(worker.availability) || '—'}</TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>{worker.email}</TableCell>
                </TableRow>
              ) : (
                filteredWorkers.map(worker => (
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
                    <TableCell sx={{ color: '#7B2FBE', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {worker.first_name} {worker.last_name}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{worker.location}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatAvailability(worker.availability) || '—'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {worker.specializations?.map(s => (
                          <Chip key={s.id} label={s.name} size="small" sx={{ bgcolor: '#f3e8ff', color: '#7B2FBE', fontSize: 11 }} />
                        )) || '—'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {worker.experience != null ? `${worker.experience} yr${worker.experience === 1 ? '' : 's'}` : '—'}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {worker.qualification != null ? `${worker.qualification}` : '-'} {worker.field_of_study != null ? `in ${worker.field_of_study}` : ''}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, minWidth: 130, whiteSpace: 'nowrap' }}>{worker.phone}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {agentOpen && (
        <BookingAgent open={agentOpen} onClose={() => setAgentOpen(false)} onBooked={() => setAgentOpen(false)} isClient={true} />
      )}
    </Container>
  );
};

export default SupportWorkerList;
