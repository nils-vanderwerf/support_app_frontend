import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, TextField, IconButton, CircularProgress,
  Button, Chip,
} from '@mui/material';
import { Send, ArrowBack, CalendarMonth, Check, Close } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
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
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteSuggested, setInviteSuggested] = useState<any>(null);
  const [fetchingSuggestion, setFetchingSuggestion] = useState(false);
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

  useEffect(() => { fetchConversation(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, aiTyping]);

  const triggerAiResponse = async (followUpsLeft = 2, isTopLevel = true) => {
    if (isTopLevel) setAiTyping(true);
    try {
      const aiRes = await axiosInstance.post(`/conversations/${id}/ai_respond`);
      setMessages(prev => [...prev, aiRes.data.message]);
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

  const handleApprove = async (apptId: number) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await axiosInstance.patch(`/appointments/${apptId}/approve`, { timezone: tz });
    setPendingAppointments(prev => prev.filter(a => a.id !== apptId));
    fetchConversation();
  };

  const handleDecline = async (apptId: number) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await axiosInstance.patch(`/appointments/${apptId}/decline`, { timezone: tz });
    setPendingAppointments(prev => prev.filter(a => a.id !== apptId));
    fetchConversation();
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
      {pendingAppointments.map(appt => (
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
          {(() => {
            const canRespond = appt.initiated_by === 'support_worker' ? !!client : !!supportWorker;
            return canRespond ? (
              <Box display="flex" gap={1} mt={1.5}>
                <Button variant="contained" size="small" startIcon={<Check />} onClick={() => handleApprove(appt.id)} sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}>Approve</Button>
                <Button variant="outlined" size="small" startIcon={<Close />} onClick={() => handleDecline(appt.id)} color="error">Decline</Button>
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>Waiting for response…</Typography>
            );
          })()}
        </Paper>
      ))}

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

      {/* Input */}
      <Paper sx={{ p: 1.5, borderRadius: 3, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        {client && (
          <Button size="small" variant="outlined" startIcon={fetchingSuggestion ? <CircularProgress size={14} sx={{ color: '#7B2FBE' }} /> : <CalendarMonth />} onClick={openInviteForm}
            disabled={fetchingSuggestion}
            sx={{ borderColor: '#7B2FBE', color: '#7B2FBE', flexShrink: 0, mb: 0.25 }}>
            Send Invitation
          </Button>
        )}
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

      {showInviteForm && conversation && (
        <BookingForm
          clientId={conversation.client.id}
          supportWorkerId={conversation.support_worker.id}
          onClose={() => { setShowInviteForm(false); setInviteSuggested(null); }}
          onSuccess={handleInviteSent}
          isPending
          suggested={inviteSuggested}
        />
      )}
    </Box>
  );
};

export default ConversationView;
