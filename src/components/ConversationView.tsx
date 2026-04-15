import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, TextField, IconButton, CircularProgress,
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Send, ArrowBack, CalendarMonth, Check, Close, Warning } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BookingForm from './BookingForm';
import { encryptMessage, decryptMessage } from '../utils/encryption';

interface Message {
  id: number;
  content: string;
  sender_type: 'client' | 'support_worker';
  sender_id: number;
  created_at: string;
}

interface PendingAppointment {
  id: number;
  date: string;
  duration: number;
  location: string;
  notes: string;
  status: string;
  initiated_by?: string;
}

interface ExistingAppt {
  id: number;
  date: string;
  duration: number;
  notes?: string;
  client: { id: number; first_name: string; last_name: string };
  support_worker: { id: number; first_name: string; last_name: string };
}

function detectClashes(appts: PendingAppointment[], existing: ExistingAppt[]) {
  return appts.flatMap(appt => {
    const start = new Date(appt.date).getTime();
    const end = start + (appt.duration || 60) * 60_000;
    const clash = existing.find(a => {
      const as = new Date(a.date).getTime();
      const ae = as + (a.duration || 60) * 60_000;
      return start < ae && end > as;
    });
    return clash ? [{ appt, clash }] : [];
  });
}

interface ConversationDetail {
  id: number;
  client: { id: number; first_name: string; last_name: string };
  support_worker: { id: number; first_name: string; last_name: string };
  messages: Message[];
  appointments: PendingAppointment[];
}

const ConversationView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client, supportWorker } = useAuth();
  const { showToast } = useToast();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteSuggested, setInviteSuggested] = useState<any>(null);
  const [fetchingSuggestion, setFetchingSuggestion] = useState(false);
  const [existingAppts, setExistingAppts] = useState<ExistingAppt[]>([]);
  const [clashDialog, setClashDialog] = useState<{
    clashes: Array<{ appt: PendingAppointment; clash: ExistingAppt }>;
    onConfirm: () => void;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversation = async () => {
    const res = await axiosInstance.get(`/conversations/${id}`);
    const convId: number = res.data.id;
    const decrypted: Message[] = await Promise.all(
      res.data.messages.map(async (msg: Message) => ({
        ...msg,
        content: await decryptMessage(msg.content, convId),
      }))
    );
    setConversation(res.data);
    setMessages(decrypted);
    setPendingAppointments(res.data.appointments.filter((a: PendingAppointment) => a.status === 'pending'));
  };

  useEffect(() => {
    fetchConversation();
    axiosInstance.get('/appointments').then(r => setExistingAppts(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, aiTyping]);

  const triggerAiResponse = async (followUpsLeft = 2, isTopLevel = true) => {
    if (isTopLevel) setAiTyping(true);
    try {
      const aiRes = await axiosInstance.post(`/conversations/${id}/ai_respond`);
      if (aiRes.data.message) setMessages(prev => [...prev, aiRes.data.message]);
      if (aiRes.data.declined_all) {
        setPendingAppointments([]);
      } else if (aiRes.data.appointments) {
        const newAppts: PendingAppointment[] = aiRes.data.appointments.filter((a: PendingAppointment) => a.status === 'pending');
        setPendingAppointments(prev => [...prev, ...newAppts]);
      } else if (aiRes.data.appointment) {
        const appt = aiRes.data.appointment;
        if (appt.status === 'pending') {
          setPendingAppointments(prev => [...prev.filter(a => a.id !== appt.id), appt]);
        } else if (appt.status === 'approved' || appt.status === 'declined') {
          setPendingAppointments(prev => prev.filter(a => a.id !== appt.id));
        }
      }
      if (aiRes.data.continue && followUpsLeft > 0) {
        await new Promise(r => setTimeout(r, 1200));
        await triggerAiResponse(followUpsLeft - 1, false);
      }
    } catch {
      // AI response failed silently — user can try sending again
    } finally {
      if (isTopLevel) setAiTyping(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || aiTyping) return;
    setSending(true);
    setInput('');
    try {
      const encrypted = await encryptMessage(text, parseInt(id!));
      const res = await axiosInstance.post(`/conversations/${id}/messages`, { content: encrypted });
      // Store plaintext locally — the server holds only ciphertext
      setMessages(prev => [...prev, { ...res.data, content: text }]);
      setSending(false);
      await triggerAiResponse();
    } finally {
      setSending(false);
    }
  };

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const doApprove = async (apptId: number) => {
    await axiosInstance.patch(`/appointments/${apptId}/approve`, { timezone: tz });
    setPendingAppointments(prev => prev.filter(a => a.id !== apptId));
    showToast('Appointment confirmed');
    fetchConversation();
  };

  const doApproveAll = async (appts: PendingAppointment[]) => {
    await axiosInstance.patch('/appointments/bulk_approve', {
      appointment_ids: appts.map(a => a.id),
      timezone: tz,
    });
    setPendingAppointments([]);
    showToast(`${appts.length} appointment${appts.length !== 1 ? 's' : ''} confirmed`);
    fetchConversation();
  };

  const handleApprove = (apptId: number) => {
    const appt = pendingAppointments.find(a => a.id === apptId);
    if (!appt) return;
    const clashes = detectClashes([appt], existingAppts);
    if (clashes.length > 0) {
      setClashDialog({ clashes, onConfirm: () => doApprove(apptId) });
    } else {
      doApprove(apptId);
    }
  };

  const handleDecline = async (apptId: number) => {
    await axiosInstance.patch(`/appointments/${apptId}/decline`, { timezone: tz });
    setPendingAppointments(prev => prev.filter(a => a.id !== apptId));
    showToast('Appointment declined', 'info');
    fetchConversation();
  };

  const handleApproveAll = (appts: PendingAppointment[]) => {
    const clashes = detectClashes(appts, existingAppts);
    if (clashes.length > 0) {
      setClashDialog({ clashes, onConfirm: () => doApproveAll(appts) });
    } else {
      doApproveAll(appts);
    }
  };

  const openInviteForm = async () => {
    setFetchingSuggestion(true);
    try {
      const res = await axiosInstance.get(`/conversations/${id}/suggest_booking`);
      setInviteSuggested(res.data);
    } catch {
      setInviteSuggested({});
    } finally {
      setFetchingSuggestion(false);
      setShowInviteForm(true);
    }
  };

  const handleInviteSent = async () => {
    setShowInviteForm(false);
    showToast('Invitation sent');
    fetchConversation();
    await triggerAiResponse();
  };

  if (!conversation) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#7B2FBE' }} /></Box>;

  const mySenderType = client ? 'client' : 'support_worker';
  const otherPerson = client ? conversation.support_worker : conversation.client;
  const otherName = `${otherPerson.first_name} ${otherPerson.last_name}`;
  const initials = otherName.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <Box maxWidth={720} mx="auto" mt={5} px={2} display="flex" flexDirection="column" height="calc(100vh - 120px)">
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/messages')} sx={{ color: '#7B2FBE' }}><ArrowBack /></IconButton>
        <Avatar sx={{ bgcolor: '#7B2FBE' }}>{initials}</Avatar>
        <Typography
          variant="h6" fontWeight={600}
          onClick={() => navigate(client ? `/support-workers/${otherPerson.id}` : `/clients/${otherPerson.id}`)}
          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: '#7B2FBE' } }}
        >
          {otherName}
        </Typography>
      </Paper>

      {/* Pending invitations */}
      {(() => {
        const respondable = pendingAppointments.filter(a =>
          a.initiated_by === 'support_worker' ? !!client : !!supportWorker
        );
        return (
          <>
            {respondable.length > 1 && (
              <Box display="flex" justifyContent="flex-end" mb={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Check />}
                  onClick={() => handleApproveAll(respondable)}
                  sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}
                >
                  Approve All ({respondable.length})
                </Button>
              </Box>
            )}
            {pendingAppointments.map(appt => {
              const canRespond = appt.initiated_by === 'support_worker' ? !!client : !!supportWorker;
              return (
                <Paper key={appt.id} sx={{ p: 2, borderRadius: 3, border: '2px solid #7B2FBE', mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CalendarMonth sx={{ color: '#7B2FBE' }} />
                    <Typography fontWeight={600} color="#7B2FBE">Appointment Invitation</Typography>
                    <Chip label="Pending" size="small" sx={{ bgcolor: '#f3e8ff', color: '#7B2FBE' }} />
                  </Box>
                  <Typography variant="body2">
                    {new Date(appt.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                    {appt.duration ? ` · ${appt.duration} min` : ''}
                    {appt.location ? ` · ${appt.location}` : ''}
                  </Typography>
                  {appt.notes && <Typography variant="caption" color="text.secondary">{appt.notes}</Typography>}
                  {canRespond ? (
                    <Box display="flex" gap={1} mt={1.5}>
                      <Button variant="contained" size="small" startIcon={<Check />} onClick={() => handleApprove(appt.id)} sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}>Approve</Button>
                      <Button variant="outlined" size="small" startIcon={<Close />} onClick={() => handleDecline(appt.id)} color="error">Decline</Button>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>Waiting for response…</Typography>
                  )}
                </Paper>
              );
            })}
          </>
        );
      })()}

      {/* Messages */}
      <Paper sx={{ flex: 1, overflowY: 'auto', p: 2, borderRadius: 3, mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messages.length === 0 && !aiTyping && (
          <Typography color="text.secondary" fontStyle="italic" textAlign="center" mt={4}>Say hello to get started</Typography>
        )}
        {messages.map(msg => {
          if (msg.content.startsWith('[SYS]')) {
            const text = msg.content.replace('[SYS]', '').trim();
            return (
              <Box key={msg.id} display="flex" justifyContent="center" my={0.5}>
                <Box sx={{ px: 2, py: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>{text}</Typography>
                </Box>
              </Box>
            );
          }
          const isMine = msg.sender_type === mySenderType;
          return (
            <Box key={msg.id} display="flex" justifyContent={isMine ? 'flex-end' : 'flex-start'}>
              <Box sx={{
                maxWidth: '72%',
                p: 1.5,
                borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                bgcolor: isMine ? '#7B2FBE' : '#f3e8ff',
                color: isMine ? 'white' : 'text.primary',
              }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right', mt: 0.25 }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          );
        })}

        {aiTyping && (
          <Box display="flex" justifyContent="flex-start" alignItems="center" gap={1} pl={0.5}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: '#7B2FBE', fontSize: 11 }}>{initials}</Avatar>
            <Box sx={{ bgcolor: '#f3e8ff', borderRadius: '16px 16px 16px 4px', px: 1.5, py: 1 }}>
              <CircularProgress size={14} sx={{ color: '#7B2FBE' }} />
            </Box>
          </Box>
        )}
        <div ref={bottomRef} />
      </Paper>

      {/* Conversation starters on new conversations */}
      {messages.length === 0 && (supportWorker || client) && (
        <Box display="flex" flexWrap="wrap" gap={0.75} mb={1}>
          {(supportWorker ? [
            `Hey ${otherPerson.first_name}, I'm ${supportWorker.first_name} — what kind of support are you after?`,
            `Hi ${otherPerson.first_name}, what does your week usually look like?`,
            `Hey, what kinds of things do you need a hand with day to day?`,
            `Hi ${otherPerson.first_name} — what would make the biggest difference for you right now?`,
          ] : [
            `Hi ${otherPerson.first_name}, I came across your profile and thought we might be a good match — happy to tell you more about what I need.`,
            `Hey ${otherPerson.first_name}, I'm looking for some regular support — can we chat about what that might look like?`,
            `Hi ${otherPerson.first_name}, saw your profile and wanted to reach out. What do you generally help people with?`,
            `Hey, just wanted to say hi and see if we're a good fit before going into detail.`,
          ]).map(starter => (
            <Chip
              key={starter}
              label={starter}
              size="small"
              onClick={() => setInput(starter)}
              sx={{ cursor: 'pointer', bgcolor: '#f3e8ff', color: '#7B2FBE', '&:hover': { bgcolor: '#e8d5ff' }, height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }}
            />
          ))}
        </Box>
      )}

      {/* Input */}
      <Paper sx={{ p: 1.5, borderRadius: 3, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <Button size="small" variant="outlined" startIcon={fetchingSuggestion ? <CircularProgress size={14} sx={{ color: '#7B2FBE' }} /> : <CalendarMonth />} onClick={openInviteForm}
          disabled={fetchingSuggestion}
          sx={{ borderColor: '#7B2FBE', color: '#7B2FBE', flexShrink: 0, mb: 0.25 }}>
          Send Invitation
        </Button>
        <TextField
          fullWidth size="small" placeholder="Type a message…"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          multiline maxRows={3} disabled={sending || aiTyping}
        />
        <IconButton onClick={sendMessage} disabled={!input.trim() || sending || aiTyping} sx={{ color: '#7B2FBE', mb: 0.25 }}>
          <Send />
        </IconButton>
      </Paper>

      {clashDialog && (
        <Dialog open onClose={() => setClashDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning sx={{ color: '#e65100' }} />
            Scheduling Conflict
          </DialogTitle>
          <DialogContent>
            <Typography mb={2}>
              {clashDialog.clashes.length === 1
                ? 'This appointment clashes with an existing booking:'
                : `${clashDialog.clashes.length} appointments clash with existing bookings:`}
            </Typography>
            {clashDialog.clashes.map(({ appt, clash }) => (
              <Box key={appt.id} sx={{ mb: 1.5, p: 1.5, bgcolor: '#fff8f0', borderRadius: 2, border: '1px solid #ffcc80' }}>
                <Typography variant="body2" fontWeight={600} mb={0.5}>
                  {new Date(appt.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                  {appt.duration ? ` · ${appt.duration} min` : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clashes with{' '}
                  <Typography
                    component={RouterLink}
                    to="/appointments"
                    onClick={() => setClashDialog(null)}
                    sx={{ color: '#7B2FBE', textDecoration: 'underline', cursor: 'pointer' }}
                    variant="body2"
                  >
                    {new Date(clash.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    {clash.notes ? ` · ${clash.notes}` : ''}
                  </Typography>
                </Typography>
              </Box>
            ))}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setClashDialog(null)}>Cancel</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => { clashDialog.onConfirm(); setClashDialog(null); }}
            >
              Approve Anyway
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {showInviteForm && conversation && (
        <BookingForm
          clientId={conversation.client.id}
          supportWorkerId={conversation.support_worker.id}
          onClose={() => { setShowInviteForm(false); setInviteSuggested(null); }}
          onSuccess={handleInviteSent}
          isPending
          suggested={inviteSuggested}
          conversationId={conversation.id}
        />
      )}
    </Box>
  );
};

export default ConversationView;
