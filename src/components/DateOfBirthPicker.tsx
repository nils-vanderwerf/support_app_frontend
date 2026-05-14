import { useState, useEffect, useRef } from 'react';
import { Box, MenuItem, TextField, Typography } from '@mui/material';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const currentYear = new Date().getFullYear();
const MIN_YEAR = 1920;

interface Props {
  value: string | null | undefined;
  onChange: (iso: string | null) => void;
}

function parseIso(iso: string | null | undefined) {
  if (!iso) return { day: '', month: '', year: '' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { day: '', month: '', year: '' };
  return {
    day: String(d.getUTCDate()),
    month: String(d.getUTCMonth() + 1),
    year: String(d.getUTCFullYear()),
  };
}

function toIso(day: string, month: string, year: string): string | null {
  if (!day || !month || !year || year.length < 4) return null;
  const d = parseInt(day), m = parseInt(month), y = parseInt(year);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().split('T')[0];
}

const DateOfBirthPicker = ({ value, onChange }: Props) => {
  const initial = parseIso(value);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const prevValue = useRef(value);

  // Sync from parent only when value changes to a real date string.
  // Ignores null/undefined so partial user input isn't wiped when toIso
  // returns null mid-entry (e.g. month picked but year not yet filled).
  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      if (value) {
        const p = parseIso(value);
        setDay(p.day);
        setMonth(p.month);
        setYear(p.year);
      }
    }
  }, [value]);

  const handle = (field: 'day' | 'month' | 'year', val: string) => {
    const next = {
      day:   field === 'day'   ? val : day,
      month: field === 'month' ? val : month,
      year:  field === 'year'  ? val : year,
    };
    if (field === 'day')   setDay(val);
    if (field === 'month') setMonth(val);
    if (field === 'year')  setYear(val);
    onChange(toIso(next.day, next.month, next.year));
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5} ml={0.25}>
        Date of birth
      </Typography>
      <Box display="flex" gap={1}>
        <TextField
          select
          size="small"
          label="Day"
          value={day}
          onChange={e => handle('day', e.target.value)}
          sx={{ width: 90 }}
        >
          {DAYS.map(d => (
            <MenuItem key={d} value={String(d)}>{d}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Month"
          value={month}
          onChange={e => handle('month', e.target.value)}
          sx={{ width: 130 }}
        >
          {MONTHS.map((m, i) => (
            <MenuItem key={i} value={String(i + 1)}>{m}</MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label="Year"
          type="number"
          value={year}
          onChange={e => handle('year', e.target.value)}
          inputProps={{ min: MIN_YEAR, max: currentYear }}
          sx={{ width: 95 }}
        />
      </Box>
    </Box>
  );
};

export default DateOfBirthPicker;
