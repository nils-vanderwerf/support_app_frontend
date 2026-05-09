import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, Divider, CircularProgress, Chip,
} from '@mui/material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { decryptMessage } from '../utils/encryption';

interface Message {
  content: string;
  created_at: string;
}

interface ConversationSummary {
  id: number;
  client: { id: number; first_name: string; last_name: string };
  support_worker: { id: number; first_name: string; last_name: string };
  messages: Message[];
  lastPreview?: string;
}

const ConversationList = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { client } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get('/conversations')
      .then(async res => {
        const convs: ConversationSummary[] = res.data;
        const decrypted = await Promise.all(
          convs.map(async conv => {
            const last = conv.messages[conv.messages.length - 1];
            if (!last) return conv;
            let preview = await decryptMessage(last.content, conv.id);
            if (preview.startsWith('[SYS]')) preview = preview.replace('[SYS]', '').trim();
            return { ...conv, lastPreview: preview };
          })
        );
        setConversations(decrypted);
      })
      .catch(err => console.error('Error fetching conversations:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#7B2FBE' }} /></Box>;

  const otherName = (c: ConversationSummary) => client
    ? `${c.support_worker.first_name} ${c.support_worker.last_name}`
    : `${c.client.first_name} ${c.client.last_name}`;

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const lastMessage = (c: ConversationSummary) => c.messages[c.messages.length - 1];
  const preview = (c: ConversationSummary) => c.lastPreview ?? lastMessage(c)?.content;

  return (
    <Box maxWidth={680} mx="auto" mt={5} px={2}>
      <Typography variant="h4" fontWeight={700} mb={3}>Messages</Typography>
      {conversations.length === 0 ? (
        <Typography color="text.secondary" fontStyle="italic">No conversations yet. Start a chat from a support worker or client profile.</Typography>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {conversations.map((conv, i) => {
            const name = otherName(conv);
            const last = lastMessage(conv);
            return (
              <Box key={conv.id}>
                <Box
                  sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', '&:hover': { bgcolor: '#f3e8ff' } }}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                >
                  <Avatar sx={{ bgcolor: '#7B2FBE', width: 48, height: 48 }}>{initials(name)}</Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography fontWeight={600}>{name}</Typography>
                    {last ? (
                      <Typography variant="body2" color="text.secondary" noWrap>{preview(conv)}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">No messages yet</Typography>
                    )}
                  </Box>
                  {last && (
                    <Typography variant="caption" color="text.secondary" flexShrink={0}>
                      {new Date(last.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Typography>
                  )}
                </Box>
                {i < conversations.length - 1 && <Divider />}
              </Box>
            );
          })}
        </Paper>
      )}
    </Box>
  );
};

export default ConversationList;
