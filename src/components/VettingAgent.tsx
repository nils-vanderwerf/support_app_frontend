import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, TextField, IconButton, CircularProgress,
  Alert, Button,
} from '@mui/material';
import { Send, CheckCircle, AdminPanelSettings } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const VettingAgent = () => {
  const { supportWorker } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${supportWorker?.first_name ?? 'there'}! Welcome to the vetting process. Before you can be listed on the platform, I need to collect a few details for compliance. This won't take long — I'll walk you through it step by step.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/vetting/chat', {
        message: text,
        history: messages,
      });
      setMessages([...next, { role: 'assistant', content: data.reply }]);
      if (data.complete) {
        setComplete(true);
        setRecommendation(data.recommendation);
      }
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={680} mx="auto" mt={5} px={2} display="flex" flexDirection="column" height="calc(100vh - 140px)">
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f3e8ff' }}>
        <AdminPanelSettings sx={{ color: '#7B2FBE', fontSize: 32 }} />
        <Box>
          <Typography variant="h6" fontWeight={700} color="#7B2FBE">Compliance Vetting</Typography>
          <Typography variant="body2" color="text.secondary">
            Complete your police check and WWCC verification to be listed on the platform.
          </Typography>
        </Box>
      </Paper>

      {complete && (
        <Alert
          severity={recommendation === 'approved' ? 'success' : 'info'}
          icon={<CheckCircle />}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {recommendation === 'approved'
            ? 'Your details have been submitted and look great! An admin will review and approve your profile shortly.'
            : 'Your details have been submitted for manual review. An admin will be in touch.'}
        </Alert>
      )}

      <Paper sx={{ flex: 1, overflowY: 'auto', p: 2, borderRadius: 3, mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messages.map((msg, i) => (
          <Box key={i} display="flex" justifyContent={msg.role === 'user' ? 'flex-end' : 'flex-start'}>
            <Box sx={{
              maxWidth: '75%',
              p: 1.5,
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              bgcolor: msg.role === 'user' ? '#7B2FBE' : '#f3e8ff',
              color: msg.role === 'user' ? 'white' : 'text.primary',
            }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
            </Box>
          </Box>
        ))}
        {loading && (
          <Box display="flex" justifyContent="flex-start" pl={0.5}>
            <Box sx={{ bgcolor: '#f3e8ff', borderRadius: '16px 16px 16px 4px', px: 1.5, py: 1 }}>
              <CircularProgress size={14} sx={{ color: '#7B2FBE' }} />
            </Box>
          </Box>
        )}
        <div ref={bottomRef} />
      </Paper>

      {complete ? (
        <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            You're all done! We'll notify you once your profile is approved.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ borderColor: '#7B2FBE', color: '#7B2FBE' }}
          >
            Go to Dashboard
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 1.5, borderRadius: 3, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth size="small" placeholder="Type your response…"
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            multiline maxRows={3} disabled={loading}
          />
          <IconButton onClick={sendMessage} disabled={!input.trim() || loading} sx={{ color: '#7B2FBE', mb: 0.25 }}>
            <Send />
          </IconButton>
        </Paper>
      )}
    </Box>
  );
};

export default VettingAgent;
