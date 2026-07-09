import React, { useState, useRef, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { renderMarkdown } from '../utils/renderMarkdown';
import {
  Drawer, Box, Typography, TextField, IconButton, CircularProgress, Paper, Link,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import axiosInstance from '../api/axiosConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ToolCall {
  name: string;
  input: Record<string, string | number>;
}

type DisplayMessage =
  | { type: 'chat'; role: 'user' | 'assistant'; content: string }
  | { type: 'tool_steps'; toolCalls: ToolCall[] }
  | { type: 'error_link'; message: string; to: string; linkLabel: string };

interface BookingAgentProps {
  open: boolean;
  onClose: () => void;
  onBooked: (conversationId: number) => void;
  isClient?: boolean;
}

// ─── Tool step helpers ────────────────────────────────────────────────────────

function describeToolCall(tc: ToolCall): { icon: React.ReactNode; label: string } {
  const keyword = tc.input?.keyword as string | undefined;
  switch (tc.name) {
    case 'get_support_workers':
      return {
        icon: <SearchIcon sx={{ fontSize: 14, color: '#7B2FBE' }} />,
        label: keyword ? `Searched support workers · "${keyword}"` : 'Fetched support workers',
      };
    case 'get_clients':
      return {
        icon: <PeopleIcon sx={{ fontSize: 14, color: '#7B2FBE' }} />,
        label: keyword ? `Searched clients · "${keyword}"` : 'Fetched clients',
      };
    case 'open_conversation':
      return {
        icon: <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: '#7B2FBE' }} />,
        label: 'Opening conversation…',
      };
    default:
      return { icon: <SearchIcon sx={{ fontSize: 14, color: '#7B2FBE' }} />, label: tc.name };
  }
}

const ToolSteps = ({ toolCalls }: { toolCalls: ToolCall[] }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    {toolCalls.map((tc, i) => {
      const { icon, label } = describeToolCall(tc);
      return (
        <Box
          key={i}
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.75,
            py: 0.4, px: 1, bgcolor: '#f5f0fe',
            border: '1px solid #e0d4f5', borderRadius: 2,
            width: 'fit-content',
          }}
        >
          {icon}
          <Typography variant="caption" sx={{ color: '#7B2FBE', fontWeight: 500 }}>
            {label}
          </Typography>
        </Box>
      );
    })}
  </Box>
);

// ─── Component ────────────────────────────────────────────────────────────────

const BookingAgent = ({ open, onClose, onBooked, isClient = true }: BookingAgentProps) => {
  const welcomeContent = isClient
    ? "Hi! I'm your AI booking assistant. Tell me what kind of support you're looking for and I'll find the right worker and send them an invitation on your behalf."
    : "Hi! I'm your AI booking assistant. Tell me what kind of client you'd like to work with — whether that's a particular health condition, specific needs, or tasks you'd like to help with — and I'll find the right match.";

  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([
    { type: 'chat', role: 'assistant', content: welcomeContent },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userApiMsg: ApiMessage = { role: 'user', content: text };
    const newApiMessages = [...apiMessages, userApiMsg];
    setApiMessages(newApiMessages);
    setDisplayMessages(prev => [...prev, { type: 'chat', role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data } = await axiosInstance.post('/ai_booking/chat', { messages: newApiMessages, timezone });

      const reply = data.message as string;
      const toolCalls: ToolCall[] = data.tool_calls ?? [];

      setApiMessages([...newApiMessages, { role: 'assistant', content: reply }]);
      setDisplayMessages(prev => [
        ...prev,
        ...(toolCalls.length > 0 ? [{ type: 'tool_steps' as const, toolCalls }] : []),
        { type: 'chat' as const, role: 'assistant' as const, content: reply },
      ]);

      if (data.conversation_id) {
        onBooked(data.conversation_id);
      }
    } catch {
      // Any failure here — a typed ai_unavailable response, a timeout during a Render
      // cold start, or anything else — leaves the user stuck with no error detail worth
      // parsing. Always offer the direct-browse fallback rather than a dead-end message.
      setDisplayMessages(prev => [...prev, {
        type: 'error_link',
        message: "Having trouble reaching the booking assistant right now — please try again shortly.",
        to: isClient ? '/support-workers' : '/clients',
        linkLabel: isClient ? 'Browse support workers directly' : 'Browse clients directly',
      }]);
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
          {displayMessages.map((msg, i) => {
            if (msg.type === 'tool_steps') {
              return <ToolSteps key={i} toolCalls={msg.toolCalls} />;
            }
            if (msg.type === 'error_link') {
              return (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Paper elevation={0} sx={{ p: 1.5, maxWidth: '82%', bgcolor: '#f3e8ff', borderRadius: '16px 16px 16px 4px' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>{msg.message}</Typography>
                    <Link component={RouterLink} to={msg.to} onClick={onClose} sx={{ color: '#7B2FBE', fontWeight: 600 }}>
                      {msg.linkLabel}
                    </Link>
                  </Paper>
                </Box>
              );
            }
            return (
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
                  <Typography variant="body2" component="div">
                    {renderMarkdown(msg.content)}
                  </Typography>
                </Paper>
              </Box>
            );
          })}
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
            onChange={e => setInput(e.target.value)}
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
