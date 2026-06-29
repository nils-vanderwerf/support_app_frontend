import { useState } from 'react';
import {
  Drawer, Box, Typography, Button, CircularProgress,
  Alert, Divider, IconButton,
} from '@mui/material';
import { Close, AutoAwesome, Refresh, Save, Delete } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { renderMarkdown } from '../utils/renderMarkdown';

interface Props {
  clientId: number;
  clientName: string;
  open: boolean;
  onClose: () => void;
}

const ClientProgressReportDrawer = ({ clientId, clientName, open, onClose }: Props) => {
  const [summary, setSummary] = useState('');
  const [reportCount, setReportCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSavedId(null);
    try {
      const { data } = await axiosInstance.post('/client_progress_reports', { client_id: clientId });
      setSummary(data.summary);
      setReportCount(data.report_count);
    } catch {
      setError('Could not generate report. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await axiosInstance.post('/progress_reports', {
        client_id: clientId,
        summary,
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
            startIcon={loading ? <CircularProgress size={16} /> : summary ? <Refresh /> : <AutoAwesome />}
            onClick={handleGenerate}
            disabled={loading || saving}
            sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}
          >
            {loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate Progress Report'}
          </Button>

          {summary && !savedId && (
            <>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Save />}
                onClick={handleSave}
                disabled={saving || loading}
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

        {reportCount !== null && !loading && (
          <Typography variant="caption" color="text.secondary">
            Based on {reportCount} visit report{reportCount !== 1 ? 's' : ''}
          </Typography>
        )}

        {summary && (
          <Typography variant="body2" component="div" sx={{ lineHeight: 1.7 }}>
            {renderMarkdown(summary)}
          </Typography>
        )}
      </Box>
    </Drawer>
  );
};

export default ClientProgressReportDrawer;
