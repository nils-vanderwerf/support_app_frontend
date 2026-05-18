import React, { useState, useRef, useEffect } from 'react';
import { renderMarkdown } from '../utils/renderMarkdown';
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
  onBooked: (conversationId: number) => void;
  isClient?: boolean;
}

const BookingAgent = ({ open, onClose, onBooked, isClient = true }: BookingAgentProps) => {
  const welcome: Message = {
    role: 'assistant',
    content: isClient
      ? "Hi! I'm your AI booking assistant. Tell me what kind of support you're looking for and I'll find the right worker and send them an invitation on your behalf."
      : "Hi! I'm your AI booking assistant. Tell me what kind of client you'd like to work with — whether that's a particular health condition, specific needs, or tasks you'd like to help with — and I'll find the right match.",
  };
  const [messages, setMessages] = useState<Message[]>([welcome]);
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
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data } = await axiosInstance.post('/ai_booking/chat', { messages: next, timezone });
      const reply = data.message as string;
      setMessages([...next, { role: 'assistant', content: reply }]);
      if (data.conversation_id) {
        onBooked(data.conversation_id);
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
              {isClient ? "Describe what you need and I'll find the right support worker" : "Tell me what kind of client you're looking for and I'll find the right match"}
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
                <Typography variant="body2">
                  {renderMarkdown(msg.content)}
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
