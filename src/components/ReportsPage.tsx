import { useState, useEffect } from 'react';
import {
  Container, Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, MenuItem, Chip, Collapse, IconButton,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';

interface ReportAppointment {
  id: number;
  date: string;
  location: string;
  duration: number;
  client: { id: number; first_name: string; last_name: string; date_of_birth?: string };
}

interface Report {
  id: number;
  date: string;
  activities: string;
  observations: string;
  follow_up_actions: string;
  appointment: ReportAppointment;
}

const Row = ({ report }: { report: Report }) => {
  const [open, setOpen] = useState(false);
  const appt = report.appointment;
  const clientName = appt?.client
    ? `${appt.client.first_name} ${appt.client.last_name}`
    : '—';
  const apptDate = appt?.date
    ? new Date(appt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ width: 40, pr: 0 }}>
          <IconButton size="small" onClick={() => setOpen(o => !o)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{apptDate}</TableCell>
        <TableCell sx={{ color: '#7B2FBE', fontWeight: 600 }}>{clientName}</TableCell>
        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{appt?.location || '—'}</TableCell>
        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {report.activities || '—'}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, bgcolor: '#faf8ff' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {appt?.client && (
                <Box sx={{ display: 'flex', gap: 3, pb: 1, borderBottom: '1px solid #ede7f6' }}>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.25}>Client</Typography>
                    <Typography variant="body2" fontWeight={700} color="#7B2FBE">{clientName}</Typography>
                  </Box>
                  {appt.client.date_of_birth && (
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.25}>Date of Birth</Typography>
                      <Typography variant="body2">
                        {new Date(appt.client.date_of_birth).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              {[
                { label: 'Activities', value: report.activities },
                { label: 'Observations', value: report.observations },
                { label: 'Follow-up actions', value: report.follow_up_actions },
              ].map(({ label, value }) => value ? (
                <Box key={label}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.25}>
                    {label}
                  </Typography>
                  <Typography variant="body2">{value}</Typography>
                </Box>
              ) : null)}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [clientFilter, setClientFilter] = useState('');

  useEffect(() => {
    axiosInstance.get('/visit_reports').then(r => setReports(r.data)).catch(() => {});
  }, []);

  const clients = Array.from(
    new Map(
      reports
        .filter(r => r.appointment?.client)
        .map(r => {
          const c = r.appointment.client;
          const name = `${c.first_name} ${c.last_name}`;
          return [name, name] as [string, string];
        })
    ).entries()
  ).map(([name]) => name).sort();

  const filtered = clientFilter
    ? reports.filter(r => {
        const c = r.appointment?.client;
        return c && `${c.first_name} ${c.last_name}` === clientFilter;
      })
    : reports;

  return (
    <Container>
      <Box mt={5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Visit Reports</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {reports.length} report{reports.length !== 1 ? 's' : ''} submitted
            </Typography>
          </Box>
          <Chip
            label={filtered.length}
            size="small"
            sx={{ bgcolor: '#ede7f6', color: '#7B2FBE', fontWeight: 700 }}
          />
        </Box>

        <TextField
          select
          label="Filter by client"
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          sx={{ mb: 3, minWidth: 220 }}
          size="small"
        >
          <MenuItem value="">All clients</MenuItem>
          {clients.map(name => (
            <MenuItem key={name} value={name}>{name}</MenuItem>
          ))}
        </TextField>

        {filtered.length === 0 ? (
          <Typography fontStyle="italic" color="text.secondary">
            {reports.length === 0 ? 'No reports submitted yet.' : 'No reports match the selected filter.'}
          </Typography>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9f4ff' }}>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 700 }}>Location</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 700 }}>Activities (preview)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(r => <Row key={r.id} report={r} />)}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default ReportsPage;
