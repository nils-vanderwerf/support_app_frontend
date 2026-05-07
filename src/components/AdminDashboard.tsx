import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Chip, Button, Divider,
  CircularProgress, Avatar, Table, TableBody, TableCell, TableHead, TableRow,
  Alert, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField,
} from '@mui/material';
import {
  CheckCircle, Cancel, AdminPanelSettings, CalendarMonth,
  People, Person, EventNote, PendingActions, Warning,
} from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  location: string;
  bio: string;
  police_check_number: string | null;
  police_check_expiry: string | null;
  wwcc_number: string | null;
  wwcc_expiry: string | null;
  check_notes: string | null;
  agent_recommendation: string | null;
  specializations: { id: number; name: string }[];
  user: { email: string };
}

interface Worker {
  id: number;
  first_name: string;
  last_name: string;
  location: string;
  bio: string;
  specializations: { id: number; name: string }[];
  user: { email: string };
}

interface Appointment {
  id: number;
  date: string;
  duration: number;
  location: string;
  status: string;
  client: { first_name: string; last_name: string } | null;
  support_worker: { first_name: string; last_name: string } | null;
}

interface Stats {
  approved_workers: number;
  pending_workers: number;
  total_clients: number;
  appointments_this_week: number;
}

const statusColor = (status: string) => {
  if (status === 'approved') return { bgcolor: '#e8f5e9', color: '#2e7d32' };
  if (status === 'pending')  return { bgcolor: '#f3e8ff', color: '#7B2FBE' };
  return { bgcolor: '#fce4e4', color: '#c62828' };
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Paper sx={{ p: 2.5, borderRadius: 3, flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{ color: '#7B2FBE', display: 'flex' }}>{icon}</Box>
    <Box>
      <Typography variant="h5" fontWeight={700} lineHeight={1}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  </Paper>
);

const AdminDashboard = () => {
  const [tab, setTab] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [apptFilter, setApptFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{ type: 'approve' | 'reject'; id: number } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);


  useEffect(() => {
    Promise.all([
      axiosInstance.get('/admin/applications'),
      axiosInstance.get('/admin/appointments'),
      axiosInstance.get('/admin/workers'),
      axiosInstance.get('/admin/stats'),
    ]).then(([apps, appts, wrks, st]) => {
      setApplications(apps.data);
      setAppointments(appts.data);
      setWorkers(wrks.data);
      setStats(st.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openApprove = (id: number) => { setConfirmModal({ type: 'approve', id }); setNoteText(''); };
  const openReject = (id: number) => { setConfirmModal({ type: 'reject', id }); setNoteText(''); };

  const handleConfirm = async () => {
    if (!confirmModal) return;
    const { type, id } = confirmModal;
    setConfirmLoading(true);
    try {
      if (type === 'approve') {
        await axiosInstance.patch(`/admin/applications/${id}/approve`, { note: noteText });
        const approved = applications.find(a => a.id === id);
        setApplications(prev => prev.filter(a => a.id !== id));
        if (approved) setWorkers(prev => [...prev, { ...approved }]);
        setStats(prev => prev ? { ...prev, approved_workers: prev.approved_workers + 1, pending_workers: prev.pending_workers - 1 } : prev);
        setFeedback({ msg: 'Support worker approved — notification sent to their messages.', type: 'success' });
      } else {
        await axiosInstance.patch(`/admin/applications/${id}/reject`, { note: noteText });
        setApplications(prev => prev.filter(a => a.id !== id));
        setStats(prev => prev ? { ...prev, pending_workers: prev.pending_workers - 1 } : prev);
        setFeedback({ msg: 'Application rejected — support worker has been notified.', type: 'error' });
      }
    } finally {
      setConfirmModal(null);
      setNoteText('');
      setConfirmLoading(false);
    }
  };

  const filteredAppointments = apptFilter === 'all'
    ? appointments
    : appointments.filter(a => a.status === apptFilter);

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#7B2FBE' }} /></Box>;

  return (
    <Box maxWidth={960} mx="auto" mt={5} px={2}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AdminPanelSettings sx={{ color: '#7B2FBE', fontSize: 36 }} />
        <Typography variant="h4" fontWeight={700}>Admin Dashboard</Typography>
      </Box>

      {stats && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard icon={<People />} label="Approved workers" value={stats.approved_workers} />
          <StatCard icon={<PendingActions />} label="Pending review" value={stats.pending_workers} />
          <StatCard icon={<Person />} label="Total clients" value={stats.total_clients} />
          <StatCard icon={<EventNote />} label="Appointments this week" value={stats.appointments_this_week} />
        </Box>
      )}

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.msg}
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, '& .MuiTabs-indicator': { bgcolor: '#7B2FBE' }, '& .Mui-selected': { color: '#7B2FBE !important' } }}
      >
        <Tab label={`Pending Applications (${applications.length})`} />
        <Tab label={`Appointments (${appointments.length})`} />
        <Tab label={`Approved Workers (${workers.length})`} />
      </Tabs>

      {/* Pending Applications */}
      {tab === 0 && (
        <>
          {applications.length === 0 ? (
            <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 48, color: '#d0b0f0', mb: 1 }} />
              <Typography color="text.secondary">No pending applications.</Typography>
            </Paper>
          ) : (
            applications.map(app => {
              const rec = app.agent_recommendation ?? '';
              const recApproved = /^approved/i.test(rec);
              const recConditional = /^conditionally/i.test(rec);
              const recStyle = recApproved
                ? { bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' }
                : recConditional
                  ? { bg: '#fff8e1', color: '#f57f17', border: '#ffe082' }
                  : { bg: '#fff3e0', color: '#e65100', border: '#ffcc80' };

              return (
                <Paper key={app.id} sx={{ borderRadius: 3, mb: 2, overflow: 'hidden' }}>
                  {/* Header row */}
                  <Box display="flex" alignItems="center" gap={2} px={3} pt={2.5} pb={1.5}>
                    <Avatar sx={{ bgcolor: '#7B2FBE', width: 44, height: 44, flexShrink: 0 }}>
                      {app.first_name[0]}{app.last_name[0]}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography fontWeight={700}>{app.first_name} {app.last_name}</Typography>
                        <Chip label="Pending" size="small" sx={{ bgcolor: '#f3e8ff', color: '#7B2FBE' }} />
                        {expiryWarningChip('Police Check', app.police_check_expiry)}
                        {expiryWarningChip('WWCC', app.wwcc_expiry)}
                      </Box>
                      <Typography variant="body2" color="text.secondary" mt={0.25}>
                        {app.user?.email} · {app.location}
                      </Typography>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1} flexShrink={0}>
                      <Button
                        variant="contained" size="small" startIcon={<CheckCircle />}
                        onClick={() => openApprove(app.id)}
                        sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' }, minWidth: 110 }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined" size="small" startIcon={<Cancel />}
                        onClick={() => openReject(app.id)}
                        color="error"
                        sx={{ minWidth: 110 }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>

                  {/* Agent recommendation */}
                  {rec && (
                    <Box sx={{ mx: 3, mb: 1.5, px: 1.5, py: 1, borderRadius: 1.5, bgcolor: recStyle.bg, border: `1px solid ${recStyle.border}` }}>
                      <Typography variant="body2" sx={{ color: recStyle.color, fontWeight: 500 }}>
                        <strong>Agent:</strong> {rec}
                      </Typography>
                    </Box>
                  )}

                  <Divider />

                  {/* Bio + credentials */}
                  <Box px={3} pt={1.5} pb={2.5}>
                    {app.bio && (
                      <Typography variant="body2" color="text.secondary" mb={1.5}>{app.bio}</Typography>
                    )}

                    <Box display="flex" gap={4} flexWrap="wrap" mb={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>POLICE CHECK</Typography>
                        <Typography variant="body2">{app.police_check_number ?? <em>Not provided</em>}</Typography>
                        {app.police_check_expiry && (
                          <Typography variant="caption" color="text.secondary">
                            Exp. {new Date(app.police_check_expiry).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>WWCC</Typography>
                        <Typography variant="body2">{app.wwcc_number ?? <em>Not provided</em>}</Typography>
                        {app.wwcc_expiry && (
                          <Typography variant="caption" color="text.secondary">
                            Exp. {new Date(app.wwcc_expiry).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {app.check_notes && (
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        Notes: {app.check_notes}
                      </Typography>
                    )}

                    {app.specializations?.length > 0 && (
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {app.specializations.map(s => (
                          <Chip key={s.id} label={s.name} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Paper>
              );
            })
          )}
        </>
      )}

      {/* Appointments */}
      {tab === 1 && (
        <>
          <Box mb={2}>
            <ToggleButtonGroup
              value={apptFilter}
              exclusive
              onChange={(_, v) => { if (v) setApptFilter(v); }}
              size="small"
            >
              <ToggleButton value="all" sx={{ '&.Mui-selected': { bgcolor: '#f3e8ff', color: '#7B2FBE' } }}>
                All ({appointments.length})
              </ToggleButton>
              <ToggleButton value="pending" sx={{ '&.Mui-selected': { bgcolor: '#f3e8ff', color: '#7B2FBE' } }}>
                Pending ({appointments.filter(a => a.status === 'pending').length})
              </ToggleButton>
              <ToggleButton value="approved" sx={{ '&.Mui-selected': { bgcolor: '#f3e8ff', color: '#7B2FBE' } }}>
                Approved ({appointments.filter(a => a.status === 'approved').length})
              </ToggleButton>
              <ToggleButton value="declined" sx={{ '&.Mui-selected': { bgcolor: '#f3e8ff', color: '#7B2FBE' } }}>
                Declined ({appointments.filter(a => a.status === 'declined').length})
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {filteredAppointments.length === 0 ? (
              <Box p={4} textAlign="center">
                <CalendarMonth sx={{ fontSize: 48, color: '#d0b0f0', mb: 1 }} />
                <Typography color="text.secondary">No appointments found.</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f3e8ff' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Support Worker</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAppointments.map(appt => (
                    <TableRow key={appt.id} hover>
                      <TableCell>
                        {new Date(appt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell>{appt.client ? `${appt.client.first_name} ${appt.client.last_name}` : '—'}</TableCell>
                      <TableCell>{appt.support_worker ? `${appt.support_worker.first_name} ${appt.support_worker.last_name}` : '—'}</TableCell>
                      <TableCell>{appt.location || '—'}</TableCell>
                      <TableCell>{appt.duration ? `${appt.duration} min` : '—'}</TableCell>
                      <TableCell>
                        <Chip label={appt.status} size="small" sx={statusColor(appt.status)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </>
      )}

      {tab === 2 && (
        <>
          {workers.length === 0 ? (
            <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
              <People sx={{ fontSize: 48, color: '#d0b0f0', mb: 1 }} />
              <Typography color="text.secondary">No approved workers yet.</Typography>
            </Paper>
          ) : (
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f3e8ff' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Specializations</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workers.map(w => (
                    <TableRow key={w.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ bgcolor: '#7B2FBE', width: 28, height: 28, fontSize: 12 }}>
                            {w.first_name[0]}{w.last_name[0]}
                          </Avatar>
                          {w.first_name} {w.last_name}
                        </Box>
                      </TableCell>
                      <TableCell>{w.user?.email}</TableCell>
                      <TableCell>{w.location || '—'}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {w.specializations?.length > 0
                            ? w.specializations.map(s => <Chip key={s.id} label={s.name} size="small" variant="outlined" />)
                            : <Typography variant="caption" color="text.secondary">None</Typography>
                          }
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}

      {/* Messages */}
      {/* Approve / Reject confirmation dialog */}
      <Dialog open={!!confirmModal} onClose={() => !confirmLoading && setConfirmModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {confirmModal?.type === 'approve' ? 'Approve Support Worker' : 'Reject Application'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {confirmModal?.type === 'approve'
              ? 'Optionally add a note — this will appear alongside the approval notification in the support worker\'s messages.'
              : 'Optionally explain the rejection. The support worker can reapply after 3 days.'}
          </Typography>
          <TextField
            fullWidth multiline rows={3} label="Note (optional)"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            disabled={confirmLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmModal(null)} disabled={confirmLoading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={confirmLoading}
            sx={confirmModal?.type === 'approve'
              ? { bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }
              : { bgcolor: '#c62828', '&:hover': { bgcolor: '#a01010' } }}
          >
            {confirmLoading
              ? <CircularProgress size={20} sx={{ color: 'white' }} />
              : confirmModal?.type === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
