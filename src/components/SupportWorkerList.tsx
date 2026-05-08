import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Container, Box, Avatar, Button, TextField,
  Chip, Slider, ToggleButton, ToggleButtonGroup, InputAdornment,
} from '@mui/material';
import { Search, LocationOn } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { SupportWorker as SupportWorkerType, Specialization } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import BookingAgent from './BookingAgent';
import { formatAvailability } from './AvailabilitySelector';
import { geocodeAddress, haversineDistance, LatLng } from '../utils/geoDistance';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

function parseAvail(raw: string): Record<string, boolean> {
  try { return JSON.parse(raw); } catch { return {}; }
}

const SupportWorkerList = () => {
  const [workers, setWorkers] = useState<SupportWorkerType[]>([]);
  const [agentOpen, setAgentOpen] = useState(false);
  const { client } = useAuth();
  const navigate = useNavigate();

  const [nameFilter, setNameFilter] = useState('');
  const [selectedSpecs, setSelectedSpecs] = useState<number[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [radius, setRadius] = useState(25);
  const [searchPos, setSearchPos] = useState<LatLng | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);
  const [workerPositions, setWorkerPositions] = useState<Map<number, LatLng | null>>(new Map());
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    axiosInstance.get('/support_workers')
      .then(res => setWorkers(res.data))
      .catch(err => console.error('Error fetching support workers:', err));
  }, []);

  // Debounced geocode of the search location
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

  // Geocode any worker locations not yet cached when search is active
  useEffect(() => {
    if (!searchPos) return;
    workers.forEach(w => {
      if (!workerPositions.has(w.id) && w.location) {
        geocodeAddress(w.location).then(pos => {
          setWorkerPositions(prev => new Map(prev).set(w.id, pos));
        });
      }
    });
  }, [searchPos, workers]);

  const allSpecs = useMemo<Specialization[]>(() => {
    const map = new Map<number, string>();
    workers.forEach(w => w.specializations?.forEach(s => map.set(s.id, s.name)));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      if (nameFilter && !`${w.first_name} ${w.last_name}`.toLowerCase().includes(nameFilter.toLowerCase())) return false;

      if (selectedSpecs.length > 0) {
        const ids = w.specializations?.map(s => s.id) ?? [];
        if (!selectedSpecs.every(id => ids.includes(id))) return false;
      }

      if (selectedDays.length > 0) {
        const avail = parseAvail(w.availability);
        if (!selectedDays.every(d => avail[d])) return false;
      }

      if (searchPos) {
        const wPos = workerPositions.get(w.id);
        if (wPos === undefined) return true; // not yet geocoded — show optimistically
        if (wPos === null) return false;
        if (haversineDistance(searchPos, wPos) > radius) return false;
      }

      return true;
    });
  }, [workers, nameFilter, selectedSpecs, selectedDays, searchPos, radius, workerPositions]);

  const toggleSpec = (id: number) =>
    setSelectedSpecs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const activeFilterCount = [
    nameFilter, selectedSpecs.length > 0, selectedDays.length > 0, searchPos,
  ].filter(Boolean).length;

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

        {/* Filter panel */}
        <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Filters {activeFilterCount > 0 && <Chip label={activeFilterCount} size="small" sx={{ ml: 1, bgcolor: '#7B2FBE', color: 'white', height: 20, fontSize: 11 }} />}
            </Typography>
            {activeFilterCount > 0 && (
              <Button size="small" sx={{ color: '#7B2FBE' }} onClick={() => { setNameFilter(''); setSelectedSpecs([]); setSelectedDays([]); setLocationInput(''); setSearchPos(null); setRadius(25); }}>
                Clear all
              </Button>
            )}
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            {/* Row 1: name + location */}
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
                label="Near location"
                size="small"
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                placeholder="e.g. Surry Hills, Sydney"
                sx={{ flex: 1, minWidth: 220 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn fontSize="small" sx={{ color: searchPos ? '#7B2FBE' : 'text.disabled' }} /></InputAdornment> }}
              />
            </Box>

            {/* Radius slider — only when location is typed */}
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

            {/* Specializations */}
            {allSpecs.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" mb={0.5} display="block">Specializations</Typography>
                <Box display="flex" flexWrap="wrap" gap={0.75}>
                  {allSpecs.map(s => (
                    <Chip
                      key={s.id}
                      label={s.name}
                      size="small"
                      onClick={() => toggleSpec(s.id)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: selectedSpecs.includes(s.id) ? '#7B2FBE' : '#f3e8ff',
                        color: selectedSpecs.includes(s.id) ? 'white' : '#7B2FBE',
                        '&:hover': { bgcolor: selectedSpecs.includes(s.id) ? '#6a27a3' : '#e8d5ff' },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Availability */}
            <Box>
              <Typography variant="caption" color="text.secondary" mb={0.5} display="block">Available on</Typography>
              <ToggleButtonGroup value={selectedDays} onChange={(_, v) => setSelectedDays(v)} size="small">
                {DAYS.map(d => (
                  <ToggleButton key={d} value={d} sx={{ px: 1.5, '&.Mui-selected': { bgcolor: '#7B2FBE', color: 'white', '&:hover': { bgcolor: '#6a27a3' } } }}>
                    {DAY_LABELS[d]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Paper>

        <Typography variant="body2" color="text.secondary" mb={1}>
          {filteredWorkers.length} of {workers.length} workers
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Avatar</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Available Days</TableCell>
                <TableCell>Specializations</TableCell>
                <TableCell>Phone</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWorkers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary', fontStyle: 'italic' }}>
                    No support workers match your filters
                  </TableCell>
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
                    <TableCell sx={{ color: '#7B2FBE', fontWeight: 600 }}>
                      {worker.first_name} {worker.last_name}
                    </TableCell>
                    <TableCell>{worker.location}</TableCell>
                    <TableCell>{formatAvailability(worker.availability) || '—'}</TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {worker.specializations?.map(s => (
                          <Chip key={s.id} label={s.name} size="small" sx={{ bgcolor: '#f3e8ff', color: '#7B2FBE', fontSize: 11 }} />
                        )) || '—'}
                      </Box>
                    </TableCell>
                    <TableCell>{worker.phone}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {agentOpen && (
        <BookingAgent open={agentOpen} onClose={() => setAgentOpen(false)} onBooked={convId => { setAgentOpen(false); navigate(`/messages/${convId}`); }} isClient={true} />
      )}
    </Container>
  );
};

export default SupportWorkerList;
