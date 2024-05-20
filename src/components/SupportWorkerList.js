import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  Button
} from '@mui/material';
import SupportWorkers from './SupportWorkers';

const SupportWorkerTable = () => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [bookedWorkers, setBookedWorkers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/support_workers.json'); // Fetch from static JSON file
        setWorkers(response.data);
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };

    fetchData();
  }, []);

  const handleBook = (workerId) => {
    // Add the worker to the bookedWorkers state
    setBookedWorkers((prevBookedWorkers) => [...prevBookedWorkers, workerId]);
    console.log(`Booked support worker with ID ${workerId}`);
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
                  <TableCell>{worker.available_days.join(', ')}</TableCell>
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
        <SupportWorkers
          worker={selectedWorker}
          handleBook={handleBook}
          handleClose={handleCloseModal}
          isBooked={bookedWorkers.includes(selectedWorker.id)}
        />
      )}
    </Container>
  );
};

export default SupportWorkerTable;
