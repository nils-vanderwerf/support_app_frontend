import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, TextField, Button, CircularProgress,
  Alert, MenuItem,
} from '@mui/material';
import { AdminPanelSettings, CheckCircle, HourglassTop } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

// Mirrors PoliceCheckValidator: ACIC 10-char alphanumeric
const POLICE_CHECK_PATTERN = /^[A-Z0-9]{10}$/;

// Mirrors WwccValidator state patterns
const WWCC_PATTERNS: Record<string, RegExp> = {
  nsw: /^WWC\d{7}[A-Z]$/,
  act: /^WWC\d{7}[A-Z]$/,
  vic: /^WWW\d{7}$/,
  qld: /^\d{7,10}$/,
  wa:  /^WA[A-Z0-9]{6,10}$/,
  sa:  /^[A-Z0-9]{7,12}$/,
  tas: /^[A-Z0-9]{7,12}$/,
  nt:  /^[A-Z0-9]{7,12}$/,
};

const WWCC_PLACEHOLDERS: Record<string, string> = {
  nsw: 'WWC1234567A',
  act: 'WWC1234567A',
  vic: 'WWW1234567',
  qld: '1234567',
  wa:  'WAAB123456',
  sa:  'ABC12345',
  tas: 'ABC12345',
  nt:  'ABC12345',
};

const STATE_OPTIONS = [
  { value: 'nsw', label: 'NSW' },
  { value: 'act', label: 'ACT' },
  { value: 'vic', label: 'VIC' },
  { value: 'qld', label: 'QLD' },
  { value: 'wa',  label: 'WA' },
  { value: 'sa',  label: 'SA' },
  { value: 'tas', label: 'TAS' },
  { value: 'nt',  label: 'NT' },
];

const countdownText = (reapplyAt: Date): string => {
  const msLeft = reapplyAt.getTime() - Date.now();
  if (msLeft <= 0) return '';
  const hoursLeft = msLeft / 3600000;
  if (hoursLeft < 24) {
    const h = Math.ceil(hoursLeft);
    return `${h} ${h === 1 ? 'hour' : 'hours'}`;
  }
  const d = Math.ceil(hoursLeft / 24);
  return `${d} ${d === 1 ? 'day' : 'days'}`;
};

const VettingAgent = () => {
  const { supportWorker, setSupportWorker } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [waitingPeriod, setWaitingPeriod] = useState<{ reapplyAt: Date } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const [policeNumber, setPoliceNumber] = useState('');
  const [policeExpiry, setPoliceExpiry] = useState('');
  const [wwccState, setWwccState] = useState('');
  const [wwccNumber, setWwccNumber] = useState('');
  const [wwccExpiry, setWwccExpiry] = useState('');

  const [touched, setTouched] = useState({
    policeNumber: false,
    policeExpiry: false,
    wwccState: false,
    wwccNumber: false,
    wwccExpiry: false,
  });

  useEffect(() => {
    axiosInstance.get('/vetting/status').then(res => {
      if (res.data.waiting_period) {
        setWaitingPeriod({ reapplyAt: new Date(res.data.reapply_at) });
      }
    }).catch(() => {}).finally(() => setCheckingStatus(false));
  }, []);

  const touch = (field: keyof typeof touched) =>
    setTouched(t => ({ ...t, [field]: true }));

  const policeNumberError = (): string | null => {
    if (!policeNumber) return 'Required';
    if (!POLICE_CHECK_PATTERN.test(policeNumber.toUpperCase()))
      return 'Must be exactly 10 alphanumeric characters (A–Z, 0–9)';
    return null;
  };

  const policeExpiryError = (): string | null => {
    if (!policeExpiry) return 'Required';
    if (policeExpiry < today) return 'Must be a future date';
    return null;
  };

  const wwccStateError = (): string | null => (!wwccState ? 'Required' : null);

  const wwccNumberError = (): string | null => {
    if (!wwccNumber) return 'Required';
    if (!wwccState) return null;
    const pattern = WWCC_PATTERNS[wwccState];
    if (pattern && !pattern.test(wwccNumber.toUpperCase()))
      return `Invalid format for ${wwccState.toUpperCase()} — expected e.g. ${WWCC_PLACEHOLDERS[wwccState]}`;
    return null;
  };

  const wwccExpiryError = (): string | null => {
    if (!wwccExpiry) return 'Required';
    if (wwccExpiry < today) return 'Must be a future date';
    return null;
  };

  const isValid =
    !policeNumberError() && !policeExpiryError() &&
    !wwccStateError() && !wwccNumberError() && !wwccExpiryError();

  const handleSubmit = async () => {
    setTouched({ policeNumber: true, policeExpiry: true, wwccState: true, wwccNumber: true, wwccExpiry: true });
    if (!isValid) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const { data } = await axiosInstance.post('/vetting/submit', {
        police_check_number: policeNumber.toUpperCase(),
        police_check_expiry: policeExpiry,
        wwcc_state: wwccState,
        wwcc_number: wwccNumber.toUpperCase(),
        wwcc_expiry: wwccExpiry,
      });
      // Refresh auth state — backend auto-approves after vetting
      const userRes = await axiosInstance.get('/user');
      setSupportWorker(userRes.data.support_worker);
      if (userRes.data.support_worker?.status === 'approved') {
        navigate('/');
        return;
      }
      // Fallback: manual review still required
      setComplete(true);
      setRecommendation(data.recommendation);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.error === 'waiting_period') {
        setWaitingPeriod({ reapplyAt: new Date(err.response.data.reapply_at) });
      } else if (err.response?.status === 422) {
        setServerError(err.response.data?.error || 'Validation failed. Please check your details.');
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingStatus) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress sx={{ color: '#7B2FBE' }} />
      </Box>
    );
  }

  if (waitingPeriod) {
    const timeLeft = countdownText(waitingPeriod.reapplyAt);
    const canReapply = !timeLeft;
    return (
      <Box maxWidth={520} mx="auto" mt={8} px={2}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <HourglassTop sx={{ fontSize: 56, color: canReapply ? '#7B2FBE' : '#e65100', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} mb={1}>
            {canReapply ? 'Ready to Reapply' : 'Application Under Review Period'}
          </Typography>
          {canReapply ? (
            <>
              <Typography color="text.secondary" mb={3}>
                The waiting period has ended. You can now reapply.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setWaitingPeriod(null)}
                sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}
              >
                Start Vetting
              </Button>
            </>
          ) : (
            <>
              <Typography color="text.secondary" mb={1}>
                Your previous application was not approved. You can reapply in:
              </Typography>
              <Typography variant="h4" fontWeight={700} color="#e65100" mb={2}>
                {timeLeft}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                In the meantime, you can message the Suppova team if you have questions.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/messages/admin')}
                sx={{ borderColor: '#7B2FBE', color: '#7B2FBE', mr: 1 }}
              >
                Message Suppova
              </Button>
              <Button variant="text" onClick={() => navigate('/')} sx={{ color: 'text.secondary' }}>
                Go Home
              </Button>
            </>
          )}
        </Paper>
      </Box>
    );
  }

  if (complete) {
    return (
      <Box maxWidth={520} mx="auto" mt={8} px={2}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 56, color: '#7B2FBE', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} mb={2}>Details Submitted</Typography>
          <Typography color="text.secondary" mb={3}>
            Your details have been submitted for manual review. An admin will be in touch before your profile is activated.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/messages/admin')}
            sx={{ borderColor: '#7B2FBE', color: '#7B2FBE', mr: 1 }}
          >
            Message Suppova
          </Button>
          <Button variant="text" onClick={() => navigate('/')} sx={{ color: 'text.secondary' }}>
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box maxWidth={600} mx="auto" mt={5} px={2}>
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f3e8ff' }}>
        <AdminPanelSettings sx={{ color: '#7B2FBE', fontSize: 32 }} />
        <Box>
          <Typography variant="h6" fontWeight={700} color="#7B2FBE">Compliance Vetting</Typography>
          <Typography variant="body2" color="text.secondary">
            Hi {supportWorker?.first_name ?? 'there'} — enter your Police Check and WWCC details below to be listed on the platform.
          </Typography>
        </Box>
      </Paper>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{serverError}</Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>
          Police Check (ACIC)
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            label="Reference Number"
            value={policeNumber}
            onChange={e => setPoliceNumber(e.target.value)}
            onBlur={() => touch('policeNumber')}
            error={touched.policeNumber && !!policeNumberError()}
            helperText={
              touched.policeNumber && policeNumberError()
                ? policeNumberError()!
                : '10-character alphanumeric code (e.g. ABC1234567)'
            }
            inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }}
            sx={{ flex: '1 1 200px' }}
          />
          <TextField
            label="Expiry Date"
            type="date"
            value={policeExpiry}
            onChange={e => setPoliceExpiry(e.target.value)}
            onBlur={() => touch('policeExpiry')}
            error={touched.policeExpiry && !!policeExpiryError()}
            helperText={touched.policeExpiry ? (policeExpiryError() ?? undefined) : undefined}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: today }}
            sx={{ flex: '1 1 180px' }}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>
          Working With Children Check (WWCC)
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            select
            label="State / Territory"
            value={wwccState}
            onChange={e => { setWwccState(e.target.value); setWwccNumber(''); }}
            onBlur={() => touch('wwccState')}
            error={touched.wwccState && !!wwccStateError()}
            helperText={touched.wwccState ? (wwccStateError() ?? undefined) : undefined}
            sx={{ flex: '0 1 130px', minWidth: 110 }}
          >
            {STATE_OPTIONS.map(s => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="WWCC Number"
            value={wwccNumber}
            onChange={e => setWwccNumber(e.target.value)}
            onBlur={() => touch('wwccNumber')}
            error={touched.wwccNumber && !!wwccNumberError()}
            helperText={
              touched.wwccNumber && wwccNumberError()
                ? wwccNumberError()!
                : wwccState
                  ? `e.g. ${WWCC_PLACEHOLDERS[wwccState]}`
                  : 'Select a state first'
            }
            disabled={!wwccState}
            inputProps={{ style: { textTransform: 'uppercase' } }}
            sx={{ flex: '2 1 200px' }}
          />
          <TextField
            label="Expiry Date"
            type="date"
            value={wwccExpiry}
            onChange={e => setWwccExpiry(e.target.value)}
            onBlur={() => touch('wwccExpiry')}
            error={touched.wwccExpiry && !!wwccExpiryError()}
            helperText={touched.wwccExpiry ? (wwccExpiryError() ?? undefined) : undefined}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: today }}
            sx={{ flex: '1 1 180px' }}
          />
        </Box>
      </Paper>

      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' }, px: 4 }}
        >
          {submitting
            ? <CircularProgress size={20} sx={{ color: 'white' }} />
            : 'Submit for Review'}
        </Button>
      </Box>
    </Box>
  );
};

export default VettingAgent;
