import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, TextField, IconButton, CircularProgress, Avatar,
} from '@mui/material';
import { Send, AdminPanelSettings } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';

interface AdminMsg {
  id: number;
  sender: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

const SupportWorkerAdminThread = () => {
  const [messages, setMessages] = useState<AdminMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axiosInstance.get('/admin_messages').then(res => {
      setMessages(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      const { data } = await axiosInstance.post('/admin_messages', { content: text });
      setMessages(prev => [...prev, data]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box maxWidth={680} mx="auto" mt={5} px={2} display="flex" flexDirection="column" height="calc(100vh - 140px)">
      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f3e8ff' }}>
        <Avatar sx={{ bgcolor: '#7B2FBE', width: 44, height: 44 }}>
          <AdminPanelSettings />
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={700} color="#7B2FBE">Suppova Support</Typography>
          <Typography variant="body2" color="text.secondary">
            Application updates and messages from the Suppova team.
          </Typography>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: '#7B2FBE' }} />
        </Box>
      ) : (
        <Paper sx={{ flex: 1, overflowY: 'auto', p: 2, borderRadius: 3, mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {messages.length === 0 && (
            <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
              <Typography color="text.secondary" fontStyle="italic">
                No messages yet. Reach out if you have any questions about your application.
              </Typography>
            </Box>
          )}
          {messages.map(msg => (
            <Box key={msg.id} display="flex" justifyContent={msg.sender === 'support_worker' ? 'flex-end' : 'flex-start'}>
              <Box sx={{
                maxWidth: '75%', p: 1.5,
                borderRadius: msg.sender === 'support_worker' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                bgcolor: msg.sender === 'support_worker' ? '#7B2FBE' : '#f3e8ff',
                color: msg.sender === 'support_worker' ? 'white' : 'text.primary',
              }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.25, textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </Typography>
              </Box>
            </Box>
          ))}
          <div ref={bottomRef} />
        </Paper>
      )}

      <Paper sx={{ p: 1.5, borderRadius: 3, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField
          fullWidth size="small" placeholder="Message Suppova Support…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          multiline maxRows={3} disabled={sending || loading}
        />
        <IconButton
          onClick={handleSend}
          disabled={!input.trim() || sending || loading}
          sx={{ color: '#7B2FBE', mb: 0.25 }}
        >
          {sending ? <CircularProgress size={20} sx={{ color: '#7B2FBE' }} /> : <Send />}
        </IconButton>
      </Paper>
    </Box>
  );
};

export default SupportWorkerAdminThread;
