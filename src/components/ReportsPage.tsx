import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, MenuItem, Chip, Collapse, IconButton,
  Button, Dialog, DialogTitle, DialogContent, List, ListItemButton, ListItemText,
  ListItemAvatar, Avatar, Divider, Tabs, Tab,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, AddCircleOutline, AssignmentOutlined, EditOutlined, DeleteOutline, Assessment } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import VisitReportDrawer from './VisitReportDrawer';
import { renderMarkdown } from '../utils/renderMarkdown';

// ─── Shared types ────────────────────────────────────────────────────────────

interface ReportAppointment {
  id: number;
  date: string;
  location: string;
  duration: number;
  client_id: number;
  client: { id: number; first_name: string; last_name: string; date_of_birth?: string };
}

interface VisitReport {
  id: number;
  date: string;
  activities: string;
  observations: string;
  follow_up_actions: string;
  appointment: ReportAppointment;
}

interface PastAppointment {
  id: number;
  date: string;
  location: string;
  duration: number;
  client_id: number;
  client?: { id: number; first_name: string; last_name: string };
}

interface ProgressReport {
  id: number;
  summary: string;
  report_count: number;
  created_at: string;
  client: { id: number; first_name: string; last_name: string };
}

// ─── Visit Reports tab ───────────────────────────────────────────────────────

const VisitReportRow = ({ report, onEdit }: { report: VisitReport; onEdit: (r: VisitReport) => void }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const appt = report.appointment;
  const clientName = appt?.client ? `${appt.client.first_name} ${appt.client.last_name}` : '—';
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
        <TableCell
          onClick={() => appt?.client && navigate(`/clients/${appt.client.id}`)}
          sx={{ color: '#7B2FBE', fontWeight: 600, cursor: appt?.client ? 'pointer' : 'default', '&:hover': appt?.client ? { textDecoration: 'underline' } : {} }}
        >
          {clientName}
        </TableCell>
        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{appt?.location || '—'}</TableCell>
        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {report.activities || '—'}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, bgcolor: '#faf8ff' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ pt: 2, pb: 3, px: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
              <Box>
                <Button
                  size="small"
                  startIcon={<EditOutlined />}
                  onClick={() => onEdit(report)}
                  sx={{ color: '#7B2FBE', borderColor: '#7B2FBE', mt: 0.5 }}
                  variant="outlined"
                >
                  Edit report
                </Button>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const VisitReportsTab = () => {
  const [reports, setReports] = useState<VisitReport[]>([]);
  const [clientFilter, setClientFilter] = useState('');
  const [editTarget, setEditTarget] = useState<VisitReport | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pastAppointments, setPastAppointments] = useState<PastAppointment[]>([]);
  const [pickerClientFilter, setPickerClientFilter] = useState('');
  const [pickerDateRange, setPickerDateRange] = useState('90');
  const [reportTarget, setReportTarget] = useState<PastAppointment | null>(null);

  const loadReports = () => {
    axiosInstance.get('/visit_reports').then(r => setReports(r.data)).catch(() => {});
  };

  useEffect(() => { loadReports(); }, []);

  const openPicker = () => {
    axiosInstance.get('/appointments').then(r => {
      const now = new Date();
      const past = (r.data as PastAppointment[]).filter(a => new Date(a.date) < now);
      past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPastAppointments(past);
      setPickerClientFilter('');
      setPickerDateRange('90');
      setPickerOpen(true);
    }).catch(() => {});
  };

  const reportByApptId = new Map(reports.filter(r => r.appointment?.id).map(r => [r.appointment.id, r]));

  const pickerClients = Array.from(
    new Set(pastAppointments.filter(a => a.client).map(a => `${a.client!.first_name} ${a.client!.last_name}`))
  ).sort();

  const filteredPast = pastAppointments.filter(a => {
    if (pickerClientFilter) {
      const c = a.client;
      if (!c || `${c.first_name} ${c.last_name}` !== pickerClientFilter) return false;
    }
    if (pickerDateRange !== 'all') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(pickerDateRange));
      if (new Date(a.date) < cutoff) return false;
    }
    return true;
  });

  const clients = Array.from(
    new Set(reports.filter(r => r.appointment?.client).map(r => `${r.appointment.client.first_name} ${r.appointment.client.last_name}`))
  ).sort();

  const filtered = clientFilter
    ? reports.filter(r => {
        const c = r.appointment?.client;
        return c && `${c.first_name} ${c.last_name}` === clientFilter;
      })
    : reports;

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {reports.length} report{reports.length !== 1 ? 's' : ''} submitted
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddCircleOutline />}
          onClick={openPicker}
          sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' }, borderRadius: 2 }}
        >
          New Report
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TextField
          select label="Filter by client" value={clientFilter}
          onChange={e => setClientFilter(e.target.value)} sx={{ minWidth: 220 }} size="small"
        >
          <MenuItem value="">All clients</MenuItem>
          {clients.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
        </TextField>
        {clientFilter && (
          <Chip label={`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`} size="small"
            sx={{ bgcolor: '#ede7f6', color: '#7B2FBE', fontWeight: 700 }} />
        )}
      </Box>

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
              {filtered.map(r => <VisitReportRow key={r.id} report={r} onEdit={setEditTarget} />)}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Appointment picker */}
      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>New Visit Report</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select a past appointment to write a report for.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
            {pickerClients.length > 1 && (
              <TextField select label="Client" value={pickerClientFilter}
                onChange={e => setPickerClientFilter(e.target.value)} size="small" sx={{ minWidth: 180 }}>
                <MenuItem value="">All clients</MenuItem>
                {pickerClients.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
              </TextField>
            )}
            <TextField select label="Date range" value={pickerDateRange}
              onChange={e => setPickerDateRange(e.target.value)} size="small" sx={{ minWidth: 160 }}>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 3 months</MenuItem>
              <MenuItem value="180">Last 6 months</MenuItem>
              <MenuItem value="all">All time</MenuItem>
            </TextField>
          </Box>
          {filteredPast.length === 0 ? (
            <Typography fontStyle="italic" color="text.secondary" py={2}>No past appointments found.</Typography>
          ) : (
            <List disablePadding>
              {filteredPast.map((appt, i) => {
                const clientName = appt.client ? `${appt.client.first_name} ${appt.client.last_name}` : 'Unknown client';
                const apptDate = new Date(appt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                const existingReport = reportByApptId.get(appt.id);
                return (
                  <Box key={appt.id}>
                    {i > 0 && <Divider />}
                    <ListItemButton
                      onClick={() => {
                        setPickerOpen(false);
                        existingReport ? setEditTarget(existingReport) : setReportTarget(appt);
                      }}
                      sx={{ borderRadius: 1, py: 1.5 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#ede7f6', color: '#7B2FBE' }}>
                          <AssignmentOutlined />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight={700} variant="body2" color="#7B2FBE">{clientName}</Typography>
                            {existingReport && (
                              <Chip label="Edit report" size="small" sx={{ fontSize: 11, height: 20, bgcolor: '#ede7f6', color: '#7B2FBE' }} />
                            )}
                          </Box>
                        }
                        secondary={`${apptDate} · ${appt.location || 'No location'} · ${appt.duration ?? '?'} min`}
                      />
                    </ListItemButton>
                  </Box>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {reportTarget && (
        <VisitReportDrawer
          appointment={reportTarget}
          open={!!reportTarget}
          onClose={() => { setReportTarget(null); loadReports(); }}
        />
      )}
      {editTarget && (
        <VisitReportDrawer
          appointment={editTarget.appointment}
          open={!!editTarget}
          onClose={() => { setEditTarget(null); loadReports(); }}
          existingReport={editTarget}
        />
      )}
    </>
  );
};

// ─── Progress Reports tab ─────────────────────────────────────────────────────

const ProgressReportRow = ({ report, onDelete }: { report: ProgressReport; onDelete: (id: number) => void }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const clientName = `${report.client.first_name} ${report.client.last_name}`;
  const savedDate = new Date(report.created_at).toLocaleDateString([], { dateStyle: 'medium' });

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ width: 40, pr: 0 }}>
          <IconButton size="small" onClick={() => setOpen(o => !o)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{savedDate}</TableCell>
        <TableCell
          onClick={() => navigate(`/clients/${report.client.id}`)}
          sx={{ color: '#7B2FBE', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
        >
          {clientName}
        </TableCell>
        <TableCell>
          <Chip
            label={`${report.report_count} visit${report.report_count !== 1 ? 's' : ''}`}
            size="small"
            sx={{ bgcolor: '#ede7f6', color: '#7B2FBE', fontWeight: 600 }}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={4} sx={{ py: 0, bgcolor: '#faf8ff' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ pt: 2, pb: 3, px: 1 }}>
              <Typography variant="body2" component="div" sx={{ lineHeight: 1.7, mb: 2 }}>
                {renderMarkdown(report.summary)}
              </Typography>
              <Button
                size="small"
                startIcon={<DeleteOutline />}
                onClick={() => onDelete(report.id)}
                color="error"
                variant="outlined"
              >
                Delete report
              </Button>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const ProgressReportsTab = () => {
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [clientFilter, setClientFilter] = useState('');

  const loadReports = () => {
    axiosInstance.get('/progress_reports').then(r => setReports(r.data)).catch(() => {});
  };

  useEffect(() => { loadReports(); }, []);

  const handleDelete = async (id: number) => {
    await axiosInstance.delete(`/progress_reports/${id}`).catch(() => {});
    loadReports();
  };

  const clients = Array.from(
    new Set(reports.filter(r => r.client).map(r => `${r.client.first_name} ${r.client.last_name}`))
  ).sort();

  const filtered = clientFilter
    ? reports.filter(r => `${r.client.first_name} ${r.client.last_name}` === clientFilter)
    : reports;

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {reports.length} saved report{reports.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TextField
          select label="Filter by client" value={clientFilter}
          onChange={e => setClientFilter(e.target.value)} sx={{ minWidth: 220 }} size="small"
        >
          <MenuItem value="">All clients</MenuItem>
          {clients.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
        </TextField>
        {clientFilter && (
          <Chip label={`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`} size="small"
            sx={{ bgcolor: '#ede7f6', color: '#7B2FBE', fontWeight: 700 }} />
        )}
      </Box>

      {filtered.length === 0 ? (
        <Typography fontStyle="italic" color="text.secondary">
          {reports.length === 0
            ? 'No progress reports saved yet. Generate one from a client\'s profile page.'
            : 'No reports match the selected filter.'}
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9f4ff' }}>
                <TableCell sx={{ width: 40 }} />
                <TableCell sx={{ fontWeight: 700 }}>Saved</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Based on</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(r => <ProgressReportRow key={r.id} report={r} onDelete={handleDelete} />)}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ReportsPage = () => {
  const [tab, setTab] = useState(0);

  return (
    <Container>
      <Box mt={5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Assessment sx={{ color: '#7B2FBE', fontSize: 28 }} />
          <Typography variant="h4" fontWeight={700}>Reports</Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: '#7B2FBE' }, '& .MuiTabs-indicator': { bgcolor: '#7B2FBE' } }}
        >
          <Tab label="Visit Reports" icon={<AssignmentOutlined fontSize="small" />} iconPosition="start" />
          <Tab label="Progress Reports" icon={<Assessment fontSize="small" />} iconPosition="start" />
        </Tabs>

        {tab === 0 && <VisitReportsTab />}
        {tab === 1 && <ProgressReportsTab />}
      </Box>
    </Container>
  );
};

export default ReportsPage;
