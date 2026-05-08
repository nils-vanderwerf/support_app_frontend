import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Container, Box, Avatar, Button, TextField,
  Chip, Slider, InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { Client, useAuth } from '../context/AuthContext';
import BookingAgent from './BookingAgent';
import { geocodeAddress, haversineDistance, LatLng } from '../utils/geoDistance';
import LocationAutocomplete from './LocationAutocomplete';

const ClientList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [agentOpen, setAgentOpen] = useState(false);
  const { supportWorker } = useAuth();
  const navigate = useNavigate();

  const [nameFilter, setNameFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [radius, setRadius] = useState(25);
  const [searchPos, setSearchPos] = useState<LatLng | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);
  const [clientPositions, setClientPositions] = useState<Map<number, LatLng | null>>(new Map());
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    axiosInstance.get('/clients')
      .then(res => setClients(res.data))
      .catch(err => console.error('Error fetching clients:', err));
  }, []);

  const handleLocationCoordinates = (latLng: LatLng | null) => {
    if (geocodeTimer.current) { clearTimeout(geocodeTimer.current); geocodeTimer.current = null; }
    setSearchPos(latLng);
    setGeocoding(false);
    setGeocodeFailed(latLng === null);
  };

  useEffect(() => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    if (!locationInput.trim()) { setSearchPos(null); setGeocoding(false); setGeocodeFailed(false); return; }
    setGeocoding(true);
    setGeocodeFailed(false);
    geocodeTimer.current = setTimeout(async () => {
      const pos = await geocodeAddress(locationInput);
      setSearchPos(pos);
      setGeocoding(false);
      setGeocodeFailed(pos === null);
    }, 500);
  }, [locationInput]);

  useEffect(() => {
    if (!searchPos) return;
    clients.forEach(c => {
      if (!clientPositions.has(c.id) && c.location) {
        geocodeAddress(c.location).then(pos => {
          setClientPositions(prev => new Map(prev).set(c.id, pos));
        });
      }
    });
  }, [searchPos, clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (nameFilter && !`${c.first_name} ${c.last_name}`.toLowerCase().includes(nameFilter.toLowerCase())) return false;

      if (conditionFilter && !c.health_conditions?.toLowerCase().includes(conditionFilter.toLowerCase())) return false;

      if (searchPos) {
        const cPos = clientPositions.get(c.id);
        if (cPos === undefined) return true;
        if (cPos === null) return false;
        if (haversineDistance(searchPos, cPos) > radius) return false;
      }

      return true;
    });
  }, [clients, nameFilter, conditionFilter, searchPos, radius, clientPositions]);

  const activeFilterCount = [nameFilter, conditionFilter, searchPos].filter(Boolean).length;

  return (
    <Container>
      <Box mt={5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Clients</Typography>
          {supportWorker && (
            <Button variant="contained" sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }} onClick={() => setAgentOpen(true)}>
              Book with AI
            </Button>
          )}
        </Box>

        {/* Filter panel */}
        <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Filters {activeFilterCount > 0 && <Chip label={activeFilterCount} size="small" sx={{ ml: 1, bgcolor: '#7B2FBE', color: 'white', height: 20, fontSize: 11 }} />}
            </Typography>
            {activeFilterCount > 0 && (
              <Button size="small" sx={{ color: '#7B2FBE' }} onClick={() => { setNameFilter(''); setConditionFilter(''); setLocationInput(''); setSearchPos(null); setGeocoding(false); setGeocodeFailed(false); setRadius(25); }}>
                Clear all
              </Button>
            )}
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="Search by name"
                size="small"
                value={nameFilter}
                onChange={e => setNameFilter(e.target.value)}
                sx={{ flex: 1, minWidth: 180 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              />
              <TextField
                label="Care needs / conditions"
                size="small"
                value={conditionFilter}
                onChange={e => setConditionFilter(e.target.value)}
                placeholder="e.g. autism, dementia"
                sx={{ flex: 1, minWidth: 200 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              />
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <LocationAutocomplete
                  label="Near location"
                  value={locationInput}
                  onChange={setLocationInput}
                  onCoordinates={handleLocationCoordinates}
                  size="small"
                />
              </Box>
            </Box>

            {locationInput && (
              <Box px={1}>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Radius: <strong>{radius} km</strong>
                  {geocoding && <span style={{ color: '#aaa' }}> — geocoding…</span>}
                  {geocodeFailed && <span style={{ color: '#e57373' }}> — address not found</span>}
                </Typography>
                <Slider
                  value={radius}
                  onChange={(_, v) => setRadius(v as number)}
                  min={5} max={100}
                  marks={[{ value: 5, label: '5km' }, { value: 25, label: '25km' }, { value: 50, label: '50km' }, { value: 100, label: '100km' }]}
                  sx={{ color: '#7B2FBE', maxWidth: 400 }}
                />
              </Box>
            )}
          </Box>
        </Paper>

        <Typography variant="body2" color="text.secondary" mb={1}>
          {filteredClients.length} of {clients.length} clients
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
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                    No clients match your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map(c => (
                  <TableRow
                    key={c.id}
                    onClick={() => navigate(`/clients/${c.id}`)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f3e8ff' } }}
                  >
                    <TableCell>
                      <Avatar sx={{ bgcolor: '#7B2FBE' }}>
                        {c.first_name.charAt(0)}{c.last_name.charAt(0)}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ color: '#7B2FBE', fontWeight: 600 }}>
                      {c.first_name} {c.last_name}
                    </TableCell>
                    <TableCell>{c.location}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.health_conditions}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {agentOpen && (
        <BookingAgent open={agentOpen} onClose={() => setAgentOpen(false)} onBooked={convId => { setAgentOpen(false); navigate(`/messages/${convId}`); }} isClient={false} />
      )}
    </Container>
  );
};

export default ClientList;
