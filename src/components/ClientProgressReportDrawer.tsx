import { useState } from 'react';
import {
  Drawer, Box, Typography, Button, CircularProgress,
  Alert, Divider, IconButton, TextField,
} from '@mui/material';
import { Close, AutoAwesome, Refresh, Save, Delete } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';

interface Props {
  clientId: number;
  clientName: string;
  open: boolean;
  onClose: () => void;
}

const MIN_SUMMARY_LENGTH = 10;

const ClientProgressReportDrawer = ({ clientId, clientName, open, onClose }: Props) => {
  const [summary, setSummary] = useState('');
  const [reportCount, setReportCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Whether there's enough visit data to write a report on — independent of
  // whether the AI draft actually succeeded, so a worker can still write one by hand.
  const canCompose = reportCount !== null && reportCount > 0;
  const summaryTooShort = summary.trim().length > 0 && summary.trim().length < MIN_SUMMARY_LENGTH;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSavedId(null);
    try {
      const { data } = await axiosInstance.post('/client_progress_reports', { client_id: clientId });
      setSummary(data.summary ?? '');
      setReportCount(data.report_count);
    } catch (err: any) {
      if (err.response?.status === 503 && err.response?.data?.error === 'ai_unavailable') {
        setReportCount(err.response.data.report_count ?? null);
        setError('AI is currently unavailable — you can write the summary yourself below.');
      } else {
        setError('Could not generate report. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const trimmed = summary.trim();
    if (trimmed.length < MIN_SUMMARY_LENGTH) {
      setError(`Summary must be at least ${MIN_SUMMARY_LENGTH} characters.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await axiosInstance.post('/progress_reports', {
        client_id: clientId,
        summary: trimmed,
        report_count: reportCount ?? 0,
      });
      setSavedId(data.id);
    } catch {
      setError('Could not save report. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setSummary('');
    setReportCount(null);
    setSavedId(null);
    setError('');
  };

  const handleClose = () => {
    setSummary('');
    setReportCount(null);
    setSavedId(null);
    setError('');
    onClose();
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose} PaperProps={{ sx: { width: { xs: '100%', sm: 520 }, p: 3 } }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Progress Report</Typography>
          <Typography variant="caption" color="text.secondary">{clientName}</Typography>
        </Box>
        <IconButton onClick={handleClose}><Close /></IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box display="flex" flexDirection="column" gap={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {savedId && <Alert severity="success">Report saved to your Reports page.</Alert>}

        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : reportCount !== null ? <Refresh /> : <AutoAwesome />}
            onClick={handleGenerate}
            disabled={loading || saving}
            sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}
          >
            {loading ? 'Generating…' : reportCount !== null ? 'Regenerate' : 'Generate Progress Report'}
          </Button>

          {canCompose && !savedId && (
            <>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Save />}
                onClick={handleSave}
                disabled={saving || loading || summary.trim().length < MIN_SUMMARY_LENGTH}
                sx={{ bgcolor: '#7B2FBE', '&:hover': { bgcolor: '#6a27a3' } }}
              >
                {saving ? 'Saving…' : 'Save Report'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Delete />}
                onClick={handleDiscard}
                disabled={saving || loading}
                color="error"
              >
                Discard
              </Button>
            </>
          )}
        </Box>

        {reportCount === 0 && !loading && (
          <Typography variant="body2" color="text.secondary">
            No visit reports have been recorded for {clientName} yet. Reports will appear here once visits are logged.
          </Typography>
        )}

        {canCompose && !loading && (
          <Typography variant="caption" color="text.secondary">
            Based on {reportCount} visit report{reportCount !== 1 ? 's' : ''}
            {reportCount === 1 && ' — consider gathering more visits for a fuller picture'}
          </Typography>
        )}

        {canCompose && (
          <TextField
            multiline
            minRows={8}
            fullWidth
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={saving || loading || !!savedId}
            placeholder="Write the progress summary here…"
            error={summaryTooShort}
            helperText={summaryTooShort ? `At least ${MIN_SUMMARY_LENGTH} characters needed` : ' '}
          />
        )}
      </Box>
    </Drawer>
  );
};

export default ClientProgressReportDrawer;
