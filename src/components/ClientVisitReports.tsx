import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Divider, TextField, MenuItem, Chip,
  IconButton, Collapse, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, AssignmentOutlined } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';

interface VisitReportEntry {
  id: number;
  date: string;
  activities: string;
  observations: string;
  follow_up_actions: string;
  appointment: { id: number; date: string; location: string };
  support_worker?: { id: number; first_name: string; last_name: string };
}

const ReportRow = ({ report, showWorker }: { report: VisitReportEntry; showWorker: boolean }) => {
  const [open, setOpen] = useState(false);
  const apptDate = new Date(report.appointment.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  const colSpan = showWorker ? 5 : 4;

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ width: 40, pr: 0 }}>
          <IconButton size="small" onClick={() => setOpen(o => !o)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{apptDate}</TableCell>
        {showWorker && (
          <TableCell sx={{ color: '#7B2FBE', fontWeight: 600 }}>
            {report.support_worker
              ? `${report.support_worker.first_name} ${report.support_worker.last_name}`
              : '—'}
          </TableCell>
        )}
        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
          {report.appointment.location || '—'}
        </TableCell>
        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {report.activities || '—'}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={colSpan} sx={{ py: 0, bgcolor: '#faf8ff' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ pt: 2, pb: 3, px: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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

interface Props {
  clientId: number;
  isOwnProfile: boolean;
}

const ClientVisitReports = ({ clientId, isOwnProfile }: Props) => {
  const [reports, setReports] = useState<VisitReportEntry[]>([]);
  const [dateRange, setDateRange] = useState('all');
  const [workerFilter, setWorkerFilter] = useState('');

  useEffect(() => {
    axiosInstance.get(`/clients/${clientId}/visit_reports`)
      .then(r => setReports(r.data))
      .catch(() => {});
  }, [clientId]);

  if (reports.length === 0) return null;

  const workers = Array.from(
    new Set(
      reports
        .filter(r => r.support_worker)
        .map(r => `${r.support_worker!.first_name} ${r.support_worker!.last_name}`)
    )
  ).sort();

  const showWorkerColumn = isOwnProfile;
  const showWorkerFilter = isOwnProfile && workers.length > 1;

  const filtered = reports.filter(r => {
    if (workerFilter && r.support_worker) {
      if (`${r.support_worker.first_name} ${r.support_worker.last_name}` !== workerFilter) return false;
    }
    if (dateRange !== 'all') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(dateRange));
      if (new Date(r.appointment.date) < cutoff) return false;
    }
    return true;
  });

  return (
    <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <AssignmentOutlined sx={{ color: '#7B2FBE' }} />
        <Typography variant="h6" fontWeight={600}>Visit Reports</Typography>
        <Chip label={reports.length} size="small" sx={{ bgcolor: '#ede7f6', color: '#7B2FBE', fontWeight: 700 }} />
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Box display="flex" gap={1.5} mb={2} flexWrap="wrap">
        <TextField
          select
          label="Time period"
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          size="small"
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="30">Last 30 days</MenuItem>
          <MenuItem value="90">Last 3 months</MenuItem>
          <MenuItem value="180">Last 6 months</MenuItem>
          <MenuItem value="all">All time</MenuItem>
        </TextField>
        {showWorkerFilter && (
          <TextField
            select
            label="Support worker"
            value={workerFilter}
            onChange={e => setWorkerFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All workers</MenuItem>
            {workers.map(name => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      {filtered.length === 0 ? (
        <Typography fontStyle="italic" color="text.secondary">No reports in this period.</Typography>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9f4ff' }}>
                <TableCell sx={{ width: 40 }} />
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                {showWorkerColumn && <TableCell sx={{ fontWeight: 700 }}>Support Worker</TableCell>}
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 700 }}>Activities (preview)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(r => (
                <ReportRow key={r.id} report={r} showWorker={showWorkerColumn} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default ClientVisitReports;
