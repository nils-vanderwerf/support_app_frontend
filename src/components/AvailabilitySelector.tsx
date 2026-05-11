import { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, TextField, FormControlLabel, Checkbox, ToggleButton, ToggleButtonGroup,
} from '@mui/material';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PRESETS = [
  { label: 'Morning', value: '06:00-12:00' },
  { label: 'Afternoon', value: '12:00-18:00' },
  { label: 'Evening', value: '18:00-22:00' },
  { label: 'Full Day', value: '06:00-22:00' },
  { label: 'Custom', value: 'custom' },
];

interface AvailabilityValue {
  days: string[];
  time_windows: string[];
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

function parse(raw: string): AvailabilityValue {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.days)) {
      if (Array.isArray(parsed.time_windows)) return parsed;
      if (typeof parsed.time_window === 'string') {
        return { days: parsed.days, time_windows: parsed.time_window ? [parsed.time_window] : [] };
      }
    }
  } catch {}
  return { days: [], time_windows: [] };
}

function encode(days: string[], timeWindows: string[]): string {
  return JSON.stringify({ days, time_windows: timeWindows });
}

export function formatAvailability(raw: string | null | undefined): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.days) {
      const days: string[] = parsed.days;
      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const weekend = ['Sat', 'Sun'];
      let dayLabel: string;
      if (days.length === 7) dayLabel = 'Every day';
      else if (weekdays.every(d => days.includes(d)) && days.length === 5) dayLabel = 'Weekdays';
      else if (weekend.every(d => days.includes(d)) && days.length === 2) dayLabel = 'Weekends';
      else dayLabel = days.join(', ');

      // Support both time_windows (array) and legacy time_window (string)
      const windows: string[] = Array.isArray(parsed.time_windows)
        ? parsed.time_windows
        : parsed.time_window ? [parsed.time_window] : [];

      if (windows.length === 0) return dayLabel;

      const timeLabel = windows.map(w => {
        const preset = PRESETS.find(p => p.value === w);
        return preset && preset.value !== 'custom' ? `${preset.label} (${w})` : w;
      }).join(', ');

      return `${dayLabel} · ${timeLabel}`;
    }
  } catch {}

  const lower = raw.toLowerCase().trim();
  if (['all', 'all days', 'any', 'anytime', 'flexible', 'now', 'immediately'].includes(lower)) return 'Every day';
  if (['weekdays', 'weekday', 'mon-fri', 'monday to friday', 'monday - friday'].includes(lower)) return 'Weekdays';
  if (['weekends', 'weekend', 'sat-sun', 'saturday and sunday'].includes(lower)) return 'Weekends';

  return raw;
}

const AvailabilitySelector = ({ value, onChange }: Props) => {
  const initial = parse(value);
  const [selectedDays, setSelectedDays] = useState<string[]>(initial.days);
  const [selectedPresets, setSelectedPresets] = useState<string[]>(initial.time_windows);
  const [customFrom, setCustomFrom] = useState(() => {
    const custom = initial.time_windows.find(w => !PRESETS.some(p => p.value === w) && w.includes('-'));
    return custom ? custom.split('-')[0] : '09:00';
  });
  const [customTo, setCustomTo] = useState(() => {
    const custom = initial.time_windows.find(w => !PRESETS.some(p => p.value === w) && w.includes('-'));
    return custom ? custom.split('-')[1] : '17:00';
  });

  const hasCustom = selectedPresets.includes('custom');

  useEffect(() => {
    const windows = selectedPresets.map(p => p === 'custom' ? `${customFrom}-${customTo}` : p);
    onChange(encode(selectedDays, windows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays, selectedPresets, customFrom, customTo]);

  const toggleDay = (day: string) =>
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const selectWeekdays = () => setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const selectWeekend = () => setSelectedDays(['Sat', 'Sun']);
  const selectAll = () => setSelectedDays([...DAYS]);
  const clearDays = () => setSelectedDays([]);

  const daysSummary = () => {
    if (selectedDays.length === 7) return 'Every day';
    if (['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].every(d => selectedDays.includes(d)) && selectedDays.length === 5) return 'Weekdays';
    if (['Sat', 'Sun'].every(d => selectedDays.includes(d)) && selectedDays.length === 2) return 'Weekends';
    return null;
  };

  const summary = daysSummary();

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={1}>Available Days</Typography>
      <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
        {DAYS.map(day => (
          <FormControlLabel
            key={day}
            control={
              <Checkbox
                checked={selectedDays.includes(day)}
                onChange={() => toggleDay(day)}
                size="small"
                sx={{ color: '#7B2FBE', '&.Mui-checked': { color: '#7B2FBE' } }}
              />
            }
            label={day}
            sx={{ mr: 0.5 }}
          />
        ))}
      </Box>
      <Box display="flex" gap={1} mb={summary ? 1 : 0}>
        <Chip label="Weekdays" size="small" variant="outlined" onClick={selectWeekdays} sx={{ cursor: 'pointer' }} />
        <Chip label="Weekends" size="small" variant="outlined" onClick={selectWeekend} sx={{ cursor: 'pointer' }} />
        <Chip label="Every day" size="small" variant="outlined" onClick={selectAll} sx={{ cursor: 'pointer' }} />
        {selectedDays.length > 0 && (
          <Chip label="Clear" size="small" onClick={clearDays} sx={{ cursor: 'pointer' }} />
        )}
      </Box>
      {summary && (
        <Typography variant="caption" color="#7B2FBE" fontWeight={600}>{summary} selected</Typography>
      )}

      <Typography variant="body2" color="text.secondary" mt={2} mb={1}>Time Window</Typography>
      <ToggleButtonGroup
        value={selectedPresets}
        onChange={(_, v) => setSelectedPresets(v)}
        size="small"
        sx={{ flexWrap: 'wrap', gap: 0.5 }}
      >
        {PRESETS.map(p => (
          <ToggleButton
            key={p.value}
            value={p.value}
            sx={{
              borderRadius: '20px !important',
              border: '1px solid #7B2FBE !important',
              color: '#7B2FBE',
              '&.Mui-selected': { bgcolor: '#7B2FBE', color: 'white' },
              '&.Mui-selected:hover': { bgcolor: '#6a27a3' },
              mr: 0.5,
              mb: 0.5,
            }}
          >
            {p.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {hasCustom && (
        <Box display="flex" gap={2} mt={1.5} alignItems="center">
          <TextField
            label="From"
            type="time"
            size="small"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            sx={{ width: 130 }}
          />
          <Typography>to</Typography>
          <TextField
            label="To"
            type="time"
            size="small"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            sx={{ width: 130 }}
          />
        </Box>
      )}
      {selectedPresets.filter(p => p !== 'custom').length > 0 && (
        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
          {selectedPresets.filter(p => p !== 'custom').join(', ')}
        </Typography>
      )}
    </Box>
  );
};

export default AvailabilitySelector;
