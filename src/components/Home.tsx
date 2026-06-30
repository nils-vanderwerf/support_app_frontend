import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, Divider, Avatar,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  CalendarToday, AccessTime, People, LocalHospital, MedicalServices, Warning,
  EditOutlined, DeleteOutlined, EventRepeatOutlined, Star,
} from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDuration } from '../utils/formatDuration';
import { SupportWorker, Client } from '../context/AuthContext';
import BookingForm from './BookingForm';
import VisitReportDrawer from './VisitReportDrawer';
import StarRating from './StarRating';
import { NoteAdd } from '@mui/icons-material';

const NOTES_LIMIT = 100;

interface Appointment {
  id: number;
  date: string;
  duration: number;
  location: string;
  notes: string;
  client_id: number;
  support_worker_id: number;
  support_worker?: SupportWorker;
  client?: Client;
}

interface RebookTarget {
  clientId: number;
  supportWorkerId: number;
}

interface GivenReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  support_worker: { id: number; first_name: string; last_name: string };
}

interface ClientDashboard {
  role: 'client';
  upcoming_appointments: Appointment[];
  recent_appointments: Appointment[];
  days_since_last_appointment: number | null;
  total_appointments: number;
  health_info: {
    health_conditions: string;
    medication: string;
    allergies: string;
  };
  given_reviews: GivenReview[];
}

interface RecentReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  client: { first_name: string; last_name: string };
}

interface WorkerDashboard {
  role: 'support_worker';
  upcoming_appointments: Appointment[];
  recent_appointments: Appointment[];
  today_appointments: Appointment[];
  hours_this_week: number;
  total_clients: number;
  average_rating: number | null;
  review_count: number;
  recent_reviews: RecentReview[];
}

type DashboardData = ClientDashboard | WorkerDashboard;

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{ color: '#7B2FBE' }}>{icon}</Box>
    <Box>
      <Typography variant="h5" fontWeight={700}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Box>
  </Paper>
);

interface AppointmentRowProps {
  appt: Appointment;
  nameOf: string;
  isPast?: boolean;
  onNavigate: (appt: Appointment) => void;
  onEdit: (appt: Appointment) => void;
  onDelete: (appt: Appointment) => void;
  onRebook: (appt: Appointment) => void;
  onReport?: (appt: Appointment) => void;
}

const AppointmentRow = ({ appt, nameOf, isPast = false, onNavigate, onEdit, onDelete, onRebook, onReport }: AppointmentRowProps) => {
  const date = new Date(appt.date);
  const isToday = !isPast && new Date().toDateString() === date.toDateString();
  const truncatedNotes = appt.notes && appt.notes.length > NOTES_LIMIT
    ? `${appt.notes.slice(0, NOTES_LIMIT)}…`
    : appt.notes;

  const dateLabel = isToday ? 'Today' : date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${formatDuration(appt.duration)}`;

  return (
    <Box sx={{ py: 1.5, opacity: isPast ? 0.75 : 1 }}>
      {/* Row 1: avatar · name · date chip · action icons */}
      <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
        <Avatar
          sx={{ width: 36, height: 36, bgcolor: isPast ? 'grey.400' : '#7B2FBE', fontSize: 14, flexShrink: 0, cursor: 'pointer' }}
          onClick={() => onNavigate(appt)}
        >
          {nameOf.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </Avatar>
        <Typography
          variant="body2"
          fontWeight={600}
          noWrap
          flex={1}
          onClick={() => onNavigate(appt)}
          sx={{ cursor: 'pointer', color: '#7B2FBE', '&:hover': { textDecoration: 'underline' }, minWidth: 0 }}
        >
          {nameOf}
        </Typography>
        <Chip
          label={dateLabel}
          size="small"
          sx={{ bgcolor: isToday ? '#7B2FBE' : isPast ? 'grey.200' : '#f3e8ff', color: isToday ? 'white' : isPast ? 'text.secondary' : '#7B2FBE', fontWeight: 600, flexShrink: 0 }}
        />
        <Box display="flex" flexShrink={0}>
          {isPast ? (
            <>
              <IconButton size="small" onClick={() => onRebook(appt)} sx={{ color: '#7B2FBE' }} title="Rebook">
                <EventRepeatOutlined fontSize="small" />
              </IconButton>
              {onReport && (
                <IconButton size="small" onClick={() => onReport(appt)} sx={{ color: '#7B2FBE' }} title="Write report">
                  <NoteAdd fontSize="small" />
                </IconButton>
              )}
            </>
          ) : (
            <>
              <IconButton size="small" onClick={() => onEdit(appt)} sx={{ color: '#7B2FBE' }}>
                <EditOutlined fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => onDelete(appt)} sx={{ color: 'error.main' }}>
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      </Box>
      {/* Row 2: time · location · notes — indented to sit under the name */}
      <Box ml="52px">
        <Typography variant="caption" color="text.secondary" display="block" noWrap>
          {timeLabel} · {appt.location || 'No location'}
        </Typography>
        {truncatedNotes && (
          <Typography variant="caption" display="block" color="text.secondary" noWrap sx={{ fontStyle: 'italic' }}>
            {truncatedNotes}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

interface AppointmentSectionProps {
  title: string;
  appointments: Appointment[];
  nameOf: (appt: Appointment) => string;
  isPast?: boolean;
  emptyText: string;
  bordered?: boolean;
  onNavigate: (appt: Appointment) => void;
  onEdit: (appt: Appointment) => void;
  onDelete: (appt: Appointment) => void;
  onRebook: (appt: Appointment) => void;
  onReport?: (appt: Appointment) => void;
}

const AppointmentSection = ({ title, appointments, nameOf, isPast, emptyText, bordered, onNavigate, onEdit, onDelete, onRebook, onReport }: AppointmentSectionProps) => (
  <Paper sx={{ p: 3, borderRadius: 3, ...(bordered ? { border: '2px solid #7B2FBE' } : {}) }}>
    <Typography variant="h6" fontWeight={600} mb={1} color={bordered ? '#7B2FBE' : 'inherit'}>{title}</Typography>
    <Divider sx={{ mb: 1 }} />
    {appointments.length === 0 ? (
      <Typography variant="body2" color="text.secondary" fontStyle="italic" py={2}>{emptyText}</Typography>
    ) : (
      appointments.map((appt, i) => (
        <Box key={appt.id}>
          <AppointmentRow appt={appt} nameOf={nameOf(appt)} isPast={isPast} onNavigate={onNavigate} onEdit={onEdit} onDelete={onDelete} onRebook={onRebook} onReport={onReport} />
          {i < appointments.length - 1 && <Divider />}
        </Box>
      ))
    )}
  </Paper>
);

const DeleteDialog = ({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) => (
  <Dialog open={open}>
    <DialogTitle>Delete Appointment</DialogTitle>
    <DialogContent>Are you sure you want to delete this appointment?</DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm} color="error">Delete</Button>
    </DialogActions>
  </Dialog>
);

const Home = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [rebookTarget, setRebookTarget] = useState<RebookTarget | null>(null);
  const [reportTarget, setReportTarget] = useState<Appointment | null>(null);
  const { showToast } = useToast();
  const { user, client, supportWorker } = useAuth();
  const navigate = useNavigate();

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    axiosInstance.get('/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/appointments/${deleteTarget.id}`);
      showToast('Appointment deleted');
      fetchDashboard();
    } catch {
      showToast('Could not delete appointment', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#7B2FBE' }} /></Box>;

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  const firstName = supportWorker?.first_name ?? client?.first_name ?? user?.first_name ?? user?.email ?? '';

  if (!data) return (
    <Box mt={8} textAlign="center">
      <Typography variant="h5" color="text.secondary">Welcome back, {firstName}!</Typography>
    </Box>
  );

  const clientName = (appt: Appointment) => `${appt.client?.first_name} ${appt.client?.last_name}`;
  const workerName = (appt: Appointment) => `${appt.support_worker?.first_name} ${appt.support_worker?.last_name}`;

  const handleNavigateClient = (appt: Appointment) => navigate(`/support-workers/${appt.support_worker_id}`);
  const handleNavigateWorker = (appt: Appointment) => navigate(`/clients/${appt.client_id}`);
  const handleRebook = (appt: Appointment) => setRebookTarget({ clientId: appt.client_id, supportWorkerId: appt.support_worker_id });

  const sharedProps = (onNavigate: (appt: Appointment) => void) => ({
    onNavigate,
    onEdit: setEditTarget,
    onDelete: setDeleteTarget,
    onRebook: handleRebook,
  });

  const modals = (
    <>
      {editTarget && (
        <BookingForm
          appointment={editTarget as any}
          clientId={editTarget.client_id}
          supportWorkerId={editTarget.support_worker_id}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { showToast('Appointment updated'); fetchDashboard(); }}
        />
      )}
      {rebookTarget && (
        <BookingForm
          clientId={rebookTarget.clientId}
          supportWorkerId={rebookTarget.supportWorkerId}
          onClose={() => setRebookTarget(null)}
          onSuccess={() => { showToast('Appointment booked'); fetchDashboard(); }}
        />
      )}
      <DeleteDialog open={!!deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </>
  );

  if (data.role === 'client') {
    const { upcoming_appointments, recent_appointments, days_since_last_appointment, total_appointments, health_info, given_reviews } = data;
    const hasHealthInfo = health_info.health_conditions || health_info.medication || health_info.allergies;
    const props = sharedProps(handleNavigateClient);

    return (
      <Box maxWidth={900} mx="auto" mt={5} px={2}>
        <Typography variant="h4" fontWeight={700} mb={0.5}>Welcome back, {firstName}</Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>Here's your care overview</Typography>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={4}>
            <StatCard icon={<CalendarToday />} label="Upcoming (7 days)" value={upcoming_appointments.length} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard icon={<AccessTime />} label="Days since last appointment" value={days_since_last_appointment ?? '—'} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard icon={<People />} label="Total appointments" value={total_appointments} />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={hasHealthInfo ? 7 : 12}>
            <Box display="flex" flexDirection="column" gap={3}>
              <AppointmentSection title="Upcoming Appointments" appointments={upcoming_appointments} nameOf={workerName} emptyText="No appointments in the next 7 days" {...props} />
              <AppointmentSection title="Recent Appointments" appointments={recent_appointments} nameOf={workerName} isPast emptyText="No appointments in the past 7 days" {...props} />
            </Box>
          </Grid>
          {(hasHealthInfo || given_reviews.length > 0) && (
            <Grid item xs={12} md={5}>
              <Box display="flex" flexDirection="column" gap={3}>
                {hasHealthInfo && (
                  <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={600} mb={1}>Health Reminders</Typography>
                    <Divider sx={{ mb: 2 }} />
                    {health_info.health_conditions && (
                      <Box display="flex" gap={1} mb={2}>
                        <LocalHospital sx={{ color: '#7B2FBE', fontSize: 20, flexShrink: 0, mt: 0.15 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>CONDITIONS</Typography>
                          <Typography variant="body2">{health_info.health_conditions}</Typography>
                        </Box>
                      </Box>
                    )}
                    {health_info.medication && (
                      <Box display="flex" gap={1} mb={2}>
                        <MedicalServices sx={{ color: '#7B2FBE', fontSize: 20, flexShrink: 0, mt: 0.15 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>MEDICATION</Typography>
                          <Typography variant="body2">{health_info.medication}</Typography>
                        </Box>
                      </Box>
                    )}
                    {health_info.allergies && (
                      <Box display="flex" gap={1}>
                        <Warning sx={{ color: '#e67e22', fontSize: 20, flexShrink: 0, mt: 0.15 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>ALLERGIES</Typography>
                          <Typography variant="body2">{health_info.allergies}</Typography>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                )}
                {given_reviews.length > 0 && (
                  <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={600} mb={1}>Reviews You've Given</Typography>
                    <Divider sx={{ mb: 1 }} />
                    {given_reviews.map((review, i) => (
                      <Box key={review.id}>
                        <Box py={1.5}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ color: '#7B2FBE', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                              onClick={() => navigate(`/support-workers/${review.support_worker.id}`)}
                            >
                              {review.support_worker.first_name} {review.support_worker.last_name}
                            </Typography>
                            <StarRating value={review.rating} readOnly size="small" />
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" mb={review.comment ? 0.5 : 0}>
                            {new Date(review.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Typography>
                          {review.comment && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              "{review.comment}"
                            </Typography>
                          )}
                        </Box>
                        {i < given_reviews.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </Paper>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
        {modals}
      </Box>
    );
  }

  // Support worker dashboard
  const { upcoming_appointments, recent_appointments, today_appointments, hours_this_week, total_clients, average_rating, review_count, recent_reviews } = data;
  const props = sharedProps(handleNavigateWorker);

  return (
    <Box maxWidth={1100} mx="auto" mt={5} px={2}>
      <Typography variant="h4" fontWeight={700} mb={0.5}>Welcome back, {firstName}</Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>Here's your schedule overview</Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<CalendarToday />} label="Today's appointments" value={today_appointments.length} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<AccessTime />} label="Hours this week" value={hours_this_week} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<People />} label="Total clients" value={total_clients} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Star />}
            label={`Rating${review_count > 0 ? ` (${review_count} review${review_count === 1 ? '' : 's'})` : ''}`}
            value={average_rating != null ? `${average_rating}/5` : '—'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {today_appointments.length > 0 && (
          <Grid item xs={12}>
            <AppointmentSection title="Today's Schedule" appointments={today_appointments} nameOf={clientName} emptyText="" bordered {...props} />
          </Grid>
        )}
        <Grid item xs={12} md={recent_reviews.length > 0 ? 8 : 12}>
          <Box display="flex" flexDirection="column" gap={3}>
            <AppointmentSection title="Upcoming (Next 7 Days)" appointments={upcoming_appointments} nameOf={clientName} emptyText="No upcoming appointments in the next 7 days" {...props} />
            <AppointmentSection title="Recent Appointments" appointments={recent_appointments} nameOf={clientName} isPast emptyText="No appointments in the past 7 days" onReport={setReportTarget} {...props} />
          </Box>
        </Grid>
        {recent_reviews.length > 0 && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" fontWeight={600}>Recent Reviews</Typography>
                {average_rating != null && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <StarRating value={Math.round(average_rating)} readOnly size="small" />
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      {average_rating}/5
                    </Typography>
                  </Box>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              {recent_reviews.map((review, i) => (
                <Box key={review.id}>
                  <Box py={1.5}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" fontWeight={600}>
                        {review.client.first_name} {review.client.last_name}
                      </Typography>
                      <StarRating value={review.rating} readOnly size="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      {new Date(review.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Typography>
                    {review.comment && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        "{review.comment}"
                      </Typography>
                    )}
                  </Box>
                  {i < recent_reviews.length - 1 && <Divider />}
                </Box>
              ))}
            </Paper>
          </Grid>
        )}
      </Grid>
      {modals}
      {reportTarget && (
        <VisitReportDrawer appointment={reportTarget} open={!!reportTarget} onClose={() => setReportTarget(null)} />
      )}
    </Box>
  );
};

export default Home;
