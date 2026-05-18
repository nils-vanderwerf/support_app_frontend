import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, Divider, TextField, IconButton,
  CircularProgress, Chip,
} from '@mui/material';
import { Send, Message } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';

interface AdminMsg {
  id: number;
  sender: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface MessageThread {
  support_worker: { id: number; first_name: string; last_name: string; email: string };
  messages: AdminMsg[];
  unread_count: number;
}

const AdminMessagesPage = () => {
  const { workerId } = useParams<{ workerId?: string }>();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axiosInstance.get('/admin/messages')
      .then(r => {
        setThreads(r.data);
        if (!workerId && r.data.length > 0) {
          navigate(`/admin/messages/${r.data[0].support_worker.id}`, { replace: true });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedThread = threads.find(t => String(t.support_worker.id) === workerId) ?? null;

  useEffect(() => {
    if (!selectedThread) return;
    setThreads(prev => prev.map(t =>
      t.support_worker.id === selectedThread.support_worker.id ? { ...t, unread_count: 0 } : t
    ));
  }, [workerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages.length]);

  const handleReply = async () => {
    if (!selectedThread || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      const { data } = await axiosInstance.post(
        `/admin/messages/${selectedThread.support_worker.id}/reply`,
        { content: replyText }
      );
      setReplyText('');
      setThreads(prev => prev.map(t =>
        t.support_worker.id === selectedThread.support_worker.id
          ? { ...t, messages: [...t.messages, data] }
          : t
      ));
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" mt={10}>
      <CircularProgress sx={{ color: '#7B2FBE' }} />
    </Box>
  );

  return (
    <Box maxWidth={960} mx="auto" mt={5} px={2}>
      <Typography variant="h4" fontWeight={700} mb={3}>Messages</Typography>

      {threads.length === 0 ? (
        <Paper sx={{ p: 6, borderRadius: 3, textAlign: 'center' }}>
          <Message sx={{ fontSize: 48, color: '#d0b0f0', mb: 1 }} />
          <Typography color="text.secondary">No messages yet.</Typography>
        </Paper>
      ) : (
        <Box display="flex" gap={2} sx={{ height: 'calc(100vh - 200px)', minHeight: 480 }}>
          {/* Thread list */}
          <Paper sx={{ width: 280, borderRadius: 3, overflowY: 'auto', flexShrink: 0 }}>
            {threads.map((thread, i) => {
              const active = String(thread.support_worker.id) === workerId;
              const lastMsg = thread.messages[thread.messages.length - 1];
              return (
                <Box key={thread.support_worker.id}>
                  <Box
                    onClick={() => navigate(`/admin/messages/${thread.support_worker.id}`)}
                    sx={{
                      p: 2, cursor: 'pointer',
                      bgcolor: active ? '#f3e8ff' : 'transparent',
                      '&:hover': { bgcolor: active ? '#f3e8ff' : '#f9f0ff' },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ bgcolor: '#7B2FBE', width: 38, height: 38, fontSize: 14, flexShrink: 0 }}>
                        {thread.support_worker.first_name[0]}{thread.support_worker.last_name[0]}
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography fontWeight={600} fontSize={14} noWrap>
                            {thread.support_worker.first_name} {thread.support_worker.last_name}
                          </Typography>
                          {thread.unread_count > 0 && (
                            <Chip
                              label={thread.unread_count}
                              size="small"
                              sx={{ bgcolor: '#7B2FBE', color: 'white', height: 20, minWidth: 20, fontSize: 11, ml: 0.5 }}
                            />
                          )}
                        </Box>
                        {lastMsg && (
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {lastMsg.sender === 'admin' ? 'You: ' : ''}{lastMsg.content}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  {i < threads.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Paper>

          {/* Thread view */}
          {selectedThread ? (
            <Box flex={1} display="flex" flexDirection="column" minWidth={0}>
              {/* Header */}
              <Paper sx={{ p: 1.5, mb: 1.5, borderRadius: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#7B2FBE', width: 38, height: 38, fontSize: 14 }}>
                  {selectedThread.support_worker.first_name[0]}{selectedThread.support_worker.last_name[0]}
                </Avatar>
                <Box>
                  <Typography fontWeight={700} fontSize={15}>
                    {selectedThread.support_worker.first_name} {selectedThread.support_worker.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedThread.support_worker.email}
                  </Typography>
                </Box>
              </Paper>

              {/* Messages */}
              <Paper sx={{ flex: 1, overflowY: 'auto', p: 2, borderRadius: 3, mb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedThread.messages.map(msg => (
                  <Box key={msg.id} display="flex" justifyContent={msg.sender === 'admin' ? 'flex-end' : 'flex-start'}>
                    <Box sx={{
                      maxWidth: '72%', p: 1.5,
                      borderRadius: msg.sender === 'admin' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      bgcolor: msg.sender === 'admin' ? '#7B2FBE' : '#f3e8ff',
                      color: msg.sender === 'admin' ? 'white' : 'text.primary',
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

              {/* Input */}
              <Paper sx={{ p: 1.5, borderRadius: 3, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth size="small" placeholder="Reply…"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  multiline maxRows={3} disabled={replyLoading}
                />
                <IconButton
                  onClick={handleReply}
                  disabled={!replyText.trim() || replyLoading}
                  sx={{ color: '#7B2FBE', mb: 0.25 }}
                >
                  {replyLoading ? <CircularProgress size={20} sx={{ color: '#7B2FBE' }} /> : <Send />}
                </IconButton>
              </Paper>
            </Box>
          ) : (
            <Box flex={1} display="flex" alignItems="center" justifyContent="center">
              <Typography color="text.secondary">Select a conversation to view messages.</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AdminMessagesPage;
