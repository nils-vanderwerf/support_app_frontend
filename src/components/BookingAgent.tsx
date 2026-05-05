import React, { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '../api/axiosConfig';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BookingAgentProps {
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
}

const WELCOME: Message = {
  role: 'assistant',
  content: "Hi! I'm your AI booking assistant. Tell me what kind of support you're looking for and I'll find the right worker for you.",
};

const BookingAgent = ({ open, onClose, onBooked }: BookingAgentProps) => {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axiosInstance.post('/ai_booking/chat', { messages: next });
      const reply = data.message as string;
      setMessages([...next, { role: 'assistant', content: reply }]);
      if (reply.toLowerCase().includes('confirmed') || reply.toLowerCase().includes('booked')) {
        onBooked();
      }
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 380, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, bgcolor: '#7B2FBE', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6">AI Booking Assistant</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Describe what you need and I'll find the right support worker
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white', mt: -0.5, mr: -1 }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {messages.map((msg, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  maxWidth: '82%',
                  bgcolor: msg.role === 'user' ? '#7B2FBE' : '#f3e8ff',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
              </Paper>
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', pl: 0.5 }}>
              <CircularProgress size={20} sx={{ color: '#7B2FBE' }} />
            </Box>
          )}
          <div ref={bottomRef} />
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Describe what you need…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            multiline
            maxRows={3}
          />
          <IconButton
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            sx={{ color: '#7B2FBE', mb: 0.25 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
};

export default BookingAgent;
