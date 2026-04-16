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
import { SupportWorker as SupportWorkerType } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import BookingAgent from './BookingAgent';
import { formatAvailability } from './AvailabilitySelector';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const DAY_ALIASES: Record<string, string> = {
  mon: 'monday', tue: 'tuesday', tues: 'tuesday', wed: 'wednesday',
  thu: 'thursday', thur: 'thursday', thurs: 'thursday', fri: 'friday',
  sat: 'saturday', sun: 'sunday',
};
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export function parseAvail(raw: string | null | undefined): Record<string, boolean> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      // AvailabilitySelector format: { days: ["Mon","Tue",...], time_window: "..." }
      if (Array.isArray(parsed.days)) {
        const map: Record<string, boolean> = {};
        parsed.days.forEach((d: string) => {
          const lower = d.toLowerCase();
          const full = DAY_ALIASES[lower] ?? (DAYS.includes(lower) ? lower : null);
          if (full) map[full] = true;
        });
        return map;
      }
      return parsed;
    }
  } catch { /* fall through to string parsing */ }

  const lower = raw.toLowerCase().trim();
  if (['all', 'all days', 'any', 'anytime', 'flexible', 'now', 'immediately'].includes(lower)) {
    return Object.fromEntries(DAYS.map(d => [d, true]));
  }
  if (['weekdays', 'weekday', 'mon-fri', 'monday to friday', 'monday - friday'].includes(lower)) {
    return Object.fromEntries(WEEKDAYS.map(d => [d, true]));
  }
  if (['weekends', 'weekend', 'sat-sun', 'saturday and sunday'].includes(lower)) {
    return { saturday: true, sunday: true };
  }

  const result: Record<string, boolean> = {};
  const tokens = lower.split(/[\s,/&+]+/);
  tokens.forEach(token => {
    const day = DAY_ALIASES[token] ?? (DAYS.includes(token) ? token : null);
    if (day) result[day] = true;
  });
  return result;
}

const SupportWorkerList = () => {
  const [workers, setWorkers] = useState<SupportWorkerType[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<SupportWorkerType | null>(null);
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

  const handleOpenModal = (worker: SupportWorkerType) => {
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
                  <TableCell>{formatAvailability(worker.availability) || '—'}</TableCell>
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
