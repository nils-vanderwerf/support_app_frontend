import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Chip, Button, Divider,
  CircularProgress, Avatar, Table, TableBody, TableCell, TableHead, TableRow,
  Alert,
} from '@mui/material';
import { CheckCircle, Cancel, AdminPanelSettings, CalendarMonth } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  location: string;
  bio: string;
  status: string;
  police_check_number: string | null;
  wwcc_number: string | null;
  check_notes: string | null;
  agent_recommendation: string | null;
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

const AdminDashboard = () => {
  const [tab, setTab] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/admin/applications'),
      axiosInstance.get('/admin/appointments'),
    ]).then(([a, appts]) => {
      setApplications(a.data);
      setAppointments(appts.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: number) => {
    await axiosInstance.patch(`/admin/applications/${id}/approve`);
    setApplications(prev => prev.filter(a => a.id !== id));
    setFeedback({ msg: 'Support worker approved and now visible to clients.', type: 'success' });
  };

  const handleReject = async (id: number) => {
    await axiosInstance.patch(`/admin/applications/${id}/reject`);
    setApplications(prev => prev.filter(a => a.id !== id));
    setFeedback({ msg: 'Application rejected.', type: 'error' });
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#7B2FBE' }} /></Box>;

  return (
    <Box maxWidth={960} mx="auto" mt={5} px={2}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AdminPanelSettings sx={{ color: '#7B2FBE', fontSize: 36 }} />
        <Typography variant="h4" fontWeight={700}>Admin Dashboard</Typography>
      </Box>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.msg}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTabs-indicator': { bgcolor: '#7B2FBE' }, '& .Mui-selected': { color: '#7B2FBE !important' } }}>
        <Tab label={`Pending Applications (${applications.length})`} />
        <Tab label={`All Appointments (${appointments.length})`} />
      </Tabs>

      {tab === 0 && (
        <>
          {applications.length === 0 ? (
            <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 48, color: '#d0b0f0', mb: 1 }} />
              <Typography color="text.secondary">No pending applications.</Typography>
            </Paper>
          ) : (
            applications.map(app => (
              <Paper key={app.id} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <Avatar sx={{ bgcolor: '#7B2FBE', width: 48, height: 48 }}>
                    {app.first_name[0]}{app.last_name[0]}
                  </Avatar>
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography fontWeight={700}>{app.first_name} {app.last_name}</Typography>
                      <Chip label="Pending" size="small" sx={{ bgcolor: '#f3e8ff', color: '#7B2FBE' }} />
                      {app.agent_recommendation && (
                        <Chip
                          label={`Agent: ${app.agent_recommendation}`}
                          size="small"
                          sx={{
                            bgcolor: app.agent_recommendation === 'approved' ? '#e8f5e9' : '#fff3e0',
                            color: app.agent_recommendation === 'approved' ? '#2e7d32' : '#e65100',
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">{app.user?.email} · {app.location}</Typography>
                    {app.bio && <Typography variant="body2" mt={0.5}>{app.bio}</Typography>}

                    <Divider sx={{ my: 1.5 }} />

                    <Box display="flex" gap={4} flexWrap="wrap">
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>POLICE CHECK</Typography>
                        <Typography variant="body2">{app.police_check_number ?? <em>Not provided</em>}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>WWCC</Typography>
                        <Typography variant="body2">{app.wwcc_number ?? <em>Not provided</em>}</Typography>
                      </Box>
                    </Box>

                    {app.check_notes && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Notes: {app.check_notes}
                      </Typography>
                    )}

                    {app.specializations?.length > 0 && (
                      <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
                        {app.specializations.map(s => (
                          <Chip key={s.id} label={s.name} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </Box>

                  <Box display="flex" flexDirection="column" gap={1} flexShrink={0}>
                    <Button
                      variant="contained" size="small" startIcon={<CheckCircle />}
                      onClick={() => handleApprove(app.id)}
                      sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined" size="small" startIcon={<Cancel />}
                      onClick={() => handleReject(app.id)}
                      color="error"
                    >
                      Reject
                    </Button>
                  </Box>
                </Box>
              </Paper>
            ))
          )}
        </>
      )}

      {tab === 1 && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {appointments.length === 0 ? (
            <Box p={4} textAlign="center">
              <CalendarMonth sx={{ fontSize: 48, color: '#d0b0f0', mb: 1 }} />
              <Typography color="text.secondary">No appointments found.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f3e8ff' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Support Worker</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map(appt => (
                  <TableRow key={appt.id} hover>
                    <TableCell>
                      {new Date(appt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell>{appt.client ? `${appt.client.first_name} ${appt.client.last_name}` : '—'}</TableCell>
                    <TableCell>{appt.support_worker ? `${appt.support_worker.first_name} ${appt.support_worker.last_name}` : '—'}</TableCell>
                    <TableCell>{appt.location || '—'}</TableCell>
                    <TableCell>{appt.duration ? `${appt.duration} min` : '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={appt.status}
                        size="small"
                        sx={{
                          bgcolor: appt.status === 'approved' ? '#e8f5e9' : appt.status === 'pending' ? '#f3e8ff' : '#fce4e4',
                          color: appt.status === 'approved' ? '#2e7d32' : appt.status === 'pending' ? '#7B2FBE' : '#c62828',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default AdminDashboard;
