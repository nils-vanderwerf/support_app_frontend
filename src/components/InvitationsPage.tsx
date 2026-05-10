import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Chip, CircularProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { CalendarMonth, Check, Close, Chat, CheckCircle, Warning } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

interface Invitation {
  id: number;
  date: string;
  duration: number;
  location: string;
  notes: string;
  status: string;
  initiated_by?: string;
  conversation_id: number | null;
  client: { id: number; first_name: string; last_name: string };
  support_worker: { id: number; first_name: string; last_name: string };
}

interface ExistingAppt {
  id: number;
  date: string;
  duration: number;
  notes?: string;
  client: { id: number; first_name: string; last_name: string };
  support_worker: { id: number; first_name: string; last_name: string };
}

function detectClashes(invitations: Invitation[], existing: ExistingAppt[]) {
  return invitations.flatMap(inv => {
    const start = new Date(inv.date).getTime();
    const end = start + (inv.duration || 60) * 60_000;
    const clash = existing.find(a => {
      const as = new Date(a.date).getTime();
      const ae = as + (a.duration || 60) * 60_000;
      return start < ae && end > as;
    });
    return clash ? [{ inv, clash }] : [];
  });
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
        {(() => {
          const canRespond = inv.initiated_by === 'support_worker' ? isClient : isSupportWorker;
          return !accepted && canRespond && onApprove && onDecline ? (
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
          ) : !accepted ? (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Waiting for response…
            </Typography>
          ) : null;
        })()}
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
  const [existingAppts, setExistingAppts] = useState<ExistingAppt[]>([]);
  const [clashDialog, setClashDialog] = useState<{
    clashes: Array<{ inv: Invitation; clash: ExistingAppt }>;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/appointments/pending'),
      axiosInstance.get('/appointments/recently_accepted'),
      axiosInstance.get('/appointments'),
    ]).then(([p, a, appts]) => {
      setPending(p.data);
      setAccepted(a.data);
      setExistingAppts(appts.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const doApprove = async (id: number) => {
    await axiosInstance.patch(`/appointments/${id}/approve`, { timezone: tz });
    setPending(prev => prev.filter(a => a.id !== id));
  };

  const doApproveAll = async (invs: Invitation[]) => {
    await Promise.all(invs.map(a => axiosInstance.patch(`/appointments/${a.id}/approve`, { timezone: tz })));
    const ids = new Set(invs.map(a => a.id));
    setPending(prev => prev.filter(a => !ids.has(a.id)));
  };

  const handleApprove = (id: number) => {
    const inv = pending.find(a => a.id === id);
    if (!inv) return;
    const clashes = detectClashes([inv], existingAppts);
    if (clashes.length > 0) {
      setClashDialog({ clashes, onConfirm: () => doApprove(id) });
    } else {
      doApprove(id);
    }
  };

  const handleDecline = async (id: number) => {
    await axiosInstance.patch(`/appointments/${id}/decline`, { timezone: tz });
    setPending(prev => prev.filter(a => a.id !== id));
  };

  const handleApproveAll = (invs: Invitation[]) => {
    const clashes = detectClashes(invs, existingAppts);
    if (clashes.length > 0) {
      setClashDialog({ clashes, onConfirm: () => doApproveAll(invs) });
    } else {
      doApproveAll(invs);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#7B2FBE' }} /></Box>;

  const isClient = !!client;
  const isSupportWorker = !!supportWorker;
  const isEmpty = pending.length === 0 && accepted.length === 0;

  const pendingGroups: Invitation[][] = Object.values(
    pending.reduce<Record<string, Invitation[]>>((acc, inv) => {
      const key = inv.conversation_id
        ? `conv-${inv.conversation_id}`
        : `pair-${inv.client.id}-${inv.support_worker.id}`;
      (acc[key] = acc[key] ?? []).push(inv);
      return acc;
    }, {})
  );

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
                  Pending — Awaiting Response
                </Typography>
              </Box>
              <Divider />
              {pendingGroups.map((group, gi) => {
                const canRespondGroup = group.filter(inv =>
                  inv.initiated_by === 'support_worker' ? isClient : isSupportWorker
                );
                return (
                  <Box key={group[0].id}>
                    {canRespondGroup.length > 1 && (
                      <Box sx={{ px: 2.5, pt: 1.5, pb: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Check />}
                          onClick={() => handleApproveAll(canRespondGroup)}
                          sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}
                        >
                          Approve All ({canRespondGroup.length})
                        </Button>
                      </Box>
                    )}
                    {group.map((inv, i) => (
                      <Box key={inv.id}>
                        <InvitationCard
                          inv={inv} isClient={isClient} isSupportWorker={isSupportWorker}
                          onApprove={handleApprove} onDecline={handleDecline}
                          onChat={(convId) => navigate(`/messages/${convId}`)}
                        />
                        {(i < group.length - 1 || gi < pendingGroups.length - 1) && <Divider />}
                      </Box>
                    ))}
                  </Box>
                );
              })}
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
            {clashDialog.clashes.map(({ inv, clash }) => (
              <Box key={inv.id} sx={{ mb: 1.5, p: 1.5, bgcolor: '#fff8f0', borderRadius: 2, border: '1px solid #ffcc80' }}>
                <Typography variant="body2" fontWeight={600} mb={0.5}>
                  {new Date(inv.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                  {inv.duration ? ` · ${inv.duration} min` : ''}
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
    </Box>
  );
};

export default InvitationsPage;
