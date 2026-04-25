import React from 'react';

const Home = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [rebookTarget, setRebookTarget] = useState<RebookTarget | null>(null);
  const [reportTarget, setReportTarget] = useState<Appointment | null>(null);
  const [snackMessage, setSnackMessage] = useState('');
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
      setSnackMessage('Appointment deleted');
      fetchDashboard();
    } catch {
      setSnackMessage('Could not delete appointment');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#7B2FBE' }} /></Box>;


  const firstName = supportWorker?.first_name ?? client?.first_name ?? '';

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
          onSuccess={() => { setSnackMessage('Appointment updated'); fetchDashboard(); }}
        />
      )}
      {rebookTarget && (
        <BookingForm
          clientId={rebookTarget.clientId}
          supportWorkerId={rebookTarget.supportWorkerId}
          onClose={() => setRebookTarget(null)}
          onSuccess={() => { setSnackMessage('Appointment booked'); fetchDashboard(); }}
        />
      )}
      <DeleteDialog open={!!deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <Snackbar open={!!snackMessage} message={snackMessage} autoHideDuration={4000} onClose={() => setSnackMessage('')} />
    </>
  );

  if (data.role === 'client') {
    const { upcoming_appointments, recent_appointments, days_since_last_appointment, total_appointments, health_info } = data;
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
          {hasHealthInfo && (
            <Grid item xs={12} md={5}>
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
            </Grid>
          )}
        </Grid>
        {modals}
      </Box>
    );
  }

  // Support worker dashboard
  const { upcoming_appointments, recent_appointments, today_appointments, hours_this_week, total_clients } = data;
  const props = sharedProps(handleNavigateWorker);

  return (
    <div>
      <h2>Home Page</h2>
      <p>Welcome to the Home page!</p>
    </div>
  );
};

export default Home;
