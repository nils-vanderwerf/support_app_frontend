import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Divider, TextField, MenuItem, Chip,
  IconButton, Collapse,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Assessment } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { renderMarkdown } from '../utils/renderMarkdown';

interface ProgressReportEntry {
  id: number;
  summary: string;
  report_count: number;
  created_at: string;
  support_worker?: { id: number; first_name: string; last_name: string };
}

const ReportRow = ({ report, showWorker }: { report: ProgressReportEntry; showWorker: boolean }) => {
  const [open, setOpen] = useState(false);
  const date = new Date(report.created_at).toLocaleDateString([], { dateStyle: 'medium' });

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" onClick={() => setOpen(o => !o)} sx={{ cursor: 'pointer' }}>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography variant="body2" fontWeight={600}>{date}</Typography>
          {showWorker && (
            <Typography variant="body2" sx={{ color: '#7B2FBE', fontWeight: 600 }}>
              {report.support_worker ? `${report.support_worker.first_name} ${report.support_worker.last_name}` : '—'}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Based on {report.report_count} visit{report.report_count !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <IconButton size="small">{open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}</IconButton>
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="body2" component="div" sx={{ lineHeight: 1.7 }}>
          {renderMarkdown(report.summary)}
        </Typography>
      </Collapse>
    </Paper>
  );
};

interface Props {
  clientId: number;
  isOwnProfile: boolean;
}

const ClientProgressReports = ({ clientId, isOwnProfile }: Props) => {
  const { supportWorker } = useAuth();
  const [reports, setReports] = useState<ProgressReportEntry[]>([]);
  const [workerFilter, setWorkerFilter] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    axiosInstance.get(`/clients/${clientId}/progress_reports`)
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

  // Reports are shared between any worker with an approved appointment (to
  // support handover), so surface who wrote what whenever more than one
  // worker has contributed, regardless of whether the viewer is the client.
  const showWorkerColumn = workers.length > 1;
  const showWorkerFilter = workers.length > 1;
  const showOnlyMineFilter = !isOwnProfile && !!supportWorker && workers.length > 1;

  const filtered = reports.filter(r => {
    if (showOnlyMineFilter && onlyMine && r.support_worker?.id !== supportWorker!.id) return false;
    if (workerFilter && r.support_worker) {
      if (`${r.support_worker.first_name} ${r.support_worker.last_name}` !== workerFilter) return false;
    }
    return true;
  });

  return (
    <Paper sx={{ p: 3, borderRadius: 3, mt: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Assessment sx={{ color: '#7B2FBE' }} />
        <Typography variant="h6" fontWeight={600}>Progress Reports</Typography>
        <Chip label={reports.length} size="small" sx={{ bgcolor: '#ede7f6', color: '#7B2FBE', fontWeight: 700 }} />
      </Box>
      <Divider sx={{ mb: 2 }} />

      {(showWorkerFilter || showOnlyMineFilter) && (
        <Box display="flex" gap={1.5} mb={2} flexWrap="wrap">
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
          {showOnlyMineFilter && (
            <Chip
              label="Only mine"
              onClick={() => setOnlyMine(o => !o)}
              variant={onlyMine ? 'filled' : 'outlined'}
              sx={onlyMine
                ? { bgcolor: '#7B2FBE', color: 'white', fontWeight: 600 }
                : { borderColor: '#7B2FBE', color: '#7B2FBE' }}
            />
          )}
        </Box>
      )}

      {filtered.length === 0 ? (
        <Typography fontStyle="italic" color="text.secondary">No progress reports match this filter.</Typography>
      ) : (
        filtered.map(r => <ReportRow key={r.id} report={r} showWorker={showWorkerColumn} />)
      )}
    </Paper>
  );
};

export default ClientProgressReports;
