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
  Avatar,
  Button,
  Snackbar
} from '@mui/material';
import SupportWorker from './SupportWorker';
import axiosInstance from '../api/axiosConfig';

const SupportWorkerTable = () => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [bookedWorkers, setBookedWorkers] = useState(new Set());
  const [visibleMessage, setVisibleMessage] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/support_workers');
        setWorkers(response.data);
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };

    fetchData();
  }, []);

  const handleBook = (workerId) => {
    setBookedWorkers((prev) => new Set([...prev, workerId]));
  };

  const handleOpenModal = (worker) => {
    setSelectedWorker(worker);
  };

  const handleCloseModal = () => {
    setSelectedWorker(null);
  };

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
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Available Days</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <Avatar>{worker.first_name.charAt(0)}{worker.last_name.charAt(0)}</Avatar>
                  </TableCell>
                  <TableCell>{worker.id}</TableCell>
                  <TableCell>{`${worker.first_name} ${worker.last_name}`}</TableCell>
                  <TableCell>{worker.location}</TableCell>
                  <TableCell>{worker.availability}</TableCell>
                  <TableCell>{worker.phone}</TableCell>
                  <TableCell>{worker.email}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleOpenModal(worker)}
                      style={{ borderRadius: 20 }}
                    >
                      Book
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {selectedWorker && (
        <SupportWorker
          worker={selectedWorker}
          handleBook={handleBook}
          handleClose={handleCloseModal}
          onSuccess={(date) => { 
            setVisibleMessage(`${selectedWorker.first_name} ${selectedWorker.last_name} booked for ${date}`); 
            handleCloseModal(); 
          }}
          isBooked={bookedWorkers.has(selectedWorker.id)}
        />
        )
      }
      {visibleMessage && (
        <Snackbar
          open={true}
          message={visibleMessage}
          onClose={() => setVisibleMessage(false)}
          autoHideDuration={5000}
        />
        )
      }
      </Container>
    );
};

export default SupportWorkerTable;
