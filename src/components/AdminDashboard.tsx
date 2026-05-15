import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Chip, Button, Divider,
  CircularProgress, Avatar, Table, TableBody, TableCell, TableHead, TableRow,
  Alert, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Badge,
} from '@mui/material';
import {
  CheckCircle, Cancel, AdminPanelSettings, CalendarMonth,
  People, Person, EventNote, PendingActions, Warning, Send, Message,
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

interface AdminMsg {
  id: number;
  sender: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface MessageThread {
  support_worker: { id: number; first_name: string; last_name: string; email: string };
  messages: AdminMsg[];
  unread_count: number;
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

const expiryWarningChip = (label: string, expiry: string | null | undefined) => {
  if (!expiry) return null;
  const d = new Date(expiry);
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days > 30) return null;
  const expired = days < 0;
  const color = expired ? '#c62828' : '#e65100';
  const bg = expired ? '#ffebee' : '#fff3e0';
  const text = expired
    ? `${label} Expired`
    : `${label} exp. ${d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}`;
  return (
    <Chip
      key={label}
      label={text}
      size="small"
      icon={<Warning fontSize="small" />}
      sx={{ bgcolor: bg, color, '& .MuiChip-icon': { color }, fontWeight: 600 }}
    />
  );
};

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

  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const threadBottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (tab !== 3) return;
    setMessagesLoading(true);
    axiosInstance.get('/admin/messages').then(r => {
      setMessageThreads(r.data);
      setTotalUnread(r.data.reduce((sum: number, t: MessageThread) => sum + t.unread_count, 0));
      if (r.data.length > 0) setSelectedThread(r.data[0]);
    }).catch(() => {}).finally(() => setMessagesLoading(false));
  }, [tab]);

  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages.length]);

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

  const handleSelectThread = (thread: MessageThread) => {
    setSelectedThread(thread);
    setMessageThreads(prev => prev.map(t =>
      t.support_worker.id === thread.support_worker.id ? { ...t, unread_count: 0 } : t
    ));
    setTotalUnread(prev => Math.max(0, prev - thread.unread_count));
  };

  const handleReply = async () => {
    if (!selectedThread || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      const { data } = await axiosInstance.post(
        `/admin/messages/${selectedThread.support_worker.id}/reply`,
        { content: replyText }
      );
      setReplyText('');
      const updated = { ...selectedThread, messages: [...selectedThread.messages, data] };
      setSelectedThread(updated);
      setMessageThreads(prev => prev.map(t =>
        t.support_worker.id === selectedThread.support_worker.id ? updated : t
      ));
    } finally {
      setReplyLoading(false);
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
        <Tab
          label={
            <Badge badgeContent={totalUnread} color="error" max={9}>
              <Box display="flex" alignItems="center" gap={0.75}>
                <Message fontSize="small" />
                Messages
              </Box>
            </Badge>
          }
        />
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
            applications.map(app => (
              <Paper key={app.id} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <Avatar sx={{ bgcolor: '#7B2FBE', width: 48, height: 48 }}>
                    {app.first_name[0]}{app.last_name[0]}
                  </Avatar>
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                      <Typography fontWeight={700}>{app.first_name} {app.last_name}</Typography>
                      <Chip label="Pending" size="small" sx={{ bgcolor: '#f3e8ff', color: '#7B2FBE' }} />
                      {app.agent_recommendation && (
                        <Chip
                          label={`Agent: ${app.agent_recommendation}`}
                          size="small"
                          sx={app.agent_recommendation === 'approved'
                            ? { bgcolor: '#e8f5e9', color: '#2e7d32' }
                            : { bgcolor: '#fff3e0', color: '#e65100' }}
                        />
                      )}
                      {expiryWarningChip('Police Check', app.police_check_expiry)}
                      {expiryWarningChip('WWCC', app.wwcc_expiry)}
                    </Box>
                    <Typography variant="body2" color="text.secondary">{app.user?.email} · {app.location}</Typography>
                    {app.bio && <Typography variant="body2" mt={0.5}>{app.bio}</Typography>}

                    <Divider sx={{ my: 1.5 }} />

                    <Box display="flex" gap={4} flexWrap="wrap">
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>POLICE CHECK</Typography>
                        <Typography variant="body2">{app.police_check_number ?? <em>Not provided</em>}</Typography>
                        {app.police_check_expiry && (
                          <Typography variant="caption" color="text.secondary">
                            Exp. {new Date(app.police_check_expiry).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>WWCC</Typography>
                        <Typography variant="body2">{app.wwcc_number ?? <em>Not provided</em>}</Typography>
                        {app.wwcc_expiry && (
                          <Typography variant="caption" color="text.secondary">
                            Exp. {new Date(app.wwcc_expiry).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                          </Typography>
                        )}
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
                      onClick={() => openApprove(app.id)}
                      sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined" size="small" startIcon={<Cancel />}
                      onClick={() => openReject(app.id)}
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

      {/* Approved Workers */}
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
      {tab === 3 && (
        <Box display="flex" gap={2} sx={{ height: 520 }}>
          {/* Thread list */}
          <Paper sx={{ width: 260, borderRadius: 3, overflowY: 'auto', flexShrink: 0 }}>
            {messagesLoading ? (
              <Box display="flex" justifyContent="center" pt={4}>
                <CircularProgress size={24} sx={{ color: '#7B2FBE' }} />
              </Box>
            ) : messageThreads.length === 0 ? (
              <Box p={3} textAlign="center">
                <Message sx={{ fontSize: 36, color: '#d0b0f0', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No messages yet.</Typography>
              </Box>
            ) : (
              messageThreads.map((thread, i) => (
                <Box key={thread.support_worker.id}>
                  <Box
                    onClick={() => handleSelectThread(thread)}
                    sx={{
                      p: 2, cursor: 'pointer',
                      bgcolor: selectedThread?.support_worker.id === thread.support_worker.id ? '#f3e8ff' : 'transparent',
                      '&:hover': { bgcolor: '#f9f0ff' },
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={600} fontSize={14}>
                        {thread.support_worker.first_name} {thread.support_worker.last_name}
                      </Typography>
                      {thread.unread_count > 0 && (
                        <Chip
                          label={thread.unread_count}
                          size="small"
                          sx={{ bgcolor: '#7B2FBE', color: 'white', height: 20, minWidth: 20, fontSize: 11 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {thread.support_worker.email}
                    </Typography>
                    {thread.messages.length > 0 && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block" mt={0.25}>
                        {thread.messages[thread.messages.length - 1].content}
                      </Typography>
                    )}
                  </Box>
                  {i < messageThreads.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </Paper>

          {/* Thread view */}
          {selectedThread ? (
            <Box flex={1} display="flex" flexDirection="column" minWidth={0}>
              <Paper sx={{ p: 1.5, mb: 1, borderRadius: 2, bgcolor: '#f3e8ff' }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ bgcolor: '#7B2FBE', width: 36, height: 36, fontSize: 14 }}>
                    {selectedThread.support_worker.first_name[0]}{selectedThread.support_worker.last_name[0]}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700} fontSize={15}>
                      {selectedThread.support_worker.first_name} {selectedThread.support_worker.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedThread.support_worker.email}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper sx={{ flex: 1, overflowY: 'auto', p: 2, borderRadius: 3, mb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedThread.messages.map(msg => (
                  <Box key={msg.id} display="flex" justifyContent={msg.sender === 'admin' ? 'flex-end' : 'flex-start'}>
                    <Box sx={{
                      maxWidth: '75%', p: 1.5,
                      borderRadius: msg.sender === 'admin' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      bgcolor: msg.sender === 'admin' ? '#7B2FBE' : '#f3e8ff',
                      color: msg.sender === 'admin' ? 'white' : 'text.primary',
                    }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.25, textAlign: 'right' }}>
                        {new Date(msg.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                <div ref={threadBottomRef} />
              </Paper>

              <Paper sx={{ p: 1.5, borderRadius: 3, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth size="small" placeholder="Reply…"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  multiline maxRows={3} disabled={replyLoading}
                />
                <IconButton
                  onClick={handleReply}
                  disabled={!replyText.trim() || replyLoading}
                  sx={{ color: '#7B2FBE', mb: 0.25 }}
                >
                  {replyLoading ? <CircularProgress size={20} sx={{ color: '#7B2FBE' }} /> : <Send />}
                </IconButton>
              </Paper>
            </Box>
          ) : (
            <Box flex={1} display="flex" alignItems="center" justifyContent="center">
              <Typography color="text.secondary">Select a conversation to view messages.</Typography>
            </Box>
          )}
        </Box>
      )}

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
