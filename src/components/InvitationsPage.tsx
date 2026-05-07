import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Chip, CircularProgress, Divider,
} from '@mui/material';
import { CalendarMonth, Check, Close, Chat, CheckCircle } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

interface Invitation {
  id: number;
  date: string;
  duration: number;
  location: string;
  notes: string;
  status: string;
  conversation_id: number | null;
  client: { id: number; first_name: string; last_name: string };
  support_worker: { id: number; first_name: string; last_name: string };
}

const InvitationCard = ({
  inv, isClient, isSupportWorker, onApprove, onDecline, onChat,
}: {
  inv: Invitation;
  isClient: boolean;
  isSupportWorker: boolean;
  onApprove?: (id: number) => void;
  onDecline?: (id: number) => void;
  onChat: (convId: number) => void;
}) => {
  const otherName = isClient
    ? `${inv.support_worker.first_name} ${inv.support_worker.last_name}`
    : `${inv.client.first_name} ${inv.client.last_name}`;
  const accepted = inv.status === 'approved';

  return (
    <Box sx={{ p: 2.5 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        {accepted
          ? <CheckCircle sx={{ color: '#2e7d32', fontSize: 20 }} />
          : <CalendarMonth sx={{ color: '#7B2FBE', fontSize: 20 }} />}
        <Typography fontWeight={600}>{otherName}</Typography>
        {accepted
          ? <Chip label="Accepted" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />
          : <Chip label="Pending" size="small" sx={{ bgcolor: '#f3e8ff', color: '#7B2FBE' }} />}
      </Box>

      <Typography variant="body2" color="text.secondary" mb={0.5}>
        {new Date(inv.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
        {inv.duration ? ` · ${inv.duration} min` : ''}
        {inv.location ? ` · ${inv.location}` : ''}
      </Typography>

      {inv.notes && (
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          {inv.notes}
        </Typography>
      )}

      <Box display="flex" gap={1} mt={1.5} flexWrap="wrap" alignItems="center">
        {isSupportWorker && !accepted && onApprove && onDecline && (
          <>
            <Button variant="contained" size="small" startIcon={<Check />}
              onClick={() => onApprove(inv.id)}
              sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}>
              Approve
            </Button>
            <Button variant="outlined" size="small" startIcon={<Close />}
              onClick={() => onDecline(inv.id)} color="error">
              Decline
            </Button>
          </>
        )}
        {isClient && !accepted && (
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Waiting for response…
          </Typography>
        )}
        {inv.conversation_id && (
          <Button variant="outlined" size="small" startIcon={<Chat />}
            onClick={() => onChat(inv.conversation_id!)}
            sx={{ borderColor: '#7B2FBE', color: '#7B2FBE', ml: 'auto' }}>
            View Chat
          </Button>
        )}
      </Box>
    </Box>
  );
};

const InvitationsPage = () => {
  const { client, supportWorker } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Invitation[]>([]);
  const [accepted, setAccepted] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/appointments/pending'),
      axiosInstance.get('/appointments/recently_accepted'),
    ]).then(([p, a]) => {
      setPending(p.data);
      setAccepted(a.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: number) => {
    await axiosInstance.patch(`/appointments/${id}/approve`);
    setPending(prev => prev.filter(a => a.id !== id));
  };

  const handleDecline = async (id: number) => {
    await axiosInstance.patch(`/appointments/${id}/decline`);
    setPending(prev => prev.filter(a => a.id !== id));
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#7B2FBE' }} /></Box>;

  const isClient = !!client;
  const isSupportWorker = !!supportWorker;
  const isEmpty = pending.length === 0 && accepted.length === 0;

  return (
    <Box maxWidth={680} mx="auto" mt={5} px={2}>
      <Typography variant="h4" fontWeight={700} mb={3}>Invitations</Typography>

      {isEmpty ? (
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <CalendarMonth sx={{ fontSize: 48, color: '#d0b0f0', mb: 1 }} />
          <Typography color="text.secondary">No invitations yet.</Typography>
        </Paper>
      ) : (
        <>
          {pending.length > 0 && (
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
              <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={600}>
                  {isSupportWorker ? 'Incoming — Awaiting Your Response' : 'Outgoing — Awaiting Response'}
                </Typography>
              </Box>
              <Divider />
              {pending.map((inv, i) => (
                <Box key={inv.id}>
                  <InvitationCard
                    inv={inv} isClient={isClient} isSupportWorker={isSupportWorker}
                    onApprove={handleApprove} onDecline={handleDecline}
                    onChat={(convId) => navigate(`/messages/${convId}`)}
                  />
                  {i < pending.length - 1 && <Divider />}
                </Box>
              ))}
            </Paper>
          )}

          {accepted.length > 0 && (
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={600}>Recently Accepted</Typography>
              </Box>
              <Divider />
              {accepted.map((inv, i) => (
                <Box key={inv.id}>
                  <InvitationCard
                    inv={{ ...inv, status: 'approved' }} isClient={isClient} isSupportWorker={isSupportWorker}
                    onChat={(convId) => navigate(`/messages/${convId}`)}
                  />
                  {i < accepted.length - 1 && <Divider />}
                </Box>
              ))}
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default InvitationsPage;
