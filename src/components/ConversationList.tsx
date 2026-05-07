import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, Divider, CircularProgress,
  TextField, InputAdornment,
} from '@mui/material';
import { Search, ChatBubbleOutline } from '@mui/icons-material';
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

interface Person {
  id: number;
  first_name: string;
  last_name: string;
  location?: string;
}

const ConversationList = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const { client, supportWorker } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance.get('/conversations')
      .then(async res => {
        const convs: ConversationSummary[] = res.data;
        const decrypted = await Promise.all(
          convs.filter(conv => conv.messages.length > 0).map(async conv => {
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

    const endpoint = client ? '/support_workers' : '/clients';
    axiosInstance.get(endpoint)
      .then(res => setPeople(res.data))
      .catch(() => {});
  }, [client]);

  const otherName = (c: ConversationSummary) => client
    ? `${c.support_worker.first_name} ${c.support_worker.last_name}`
    : `${c.client.first_name} ${c.client.last_name}`;

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const lastMessage = (c: ConversationSummary) => c.messages[c.messages.length - 1];
  const preview = (c: ConversationSummary) => c.lastPreview ?? lastMessage(c)?.content;

  const filtered = query.trim()
    ? people.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(query.toLowerCase())
      )
    : people;

  const handleSelect = async (person: Person) => {
    if (starting) return;
    setStarting(true);
    setQuery('');
    setOpen(false);
    try {
      const payload = client
        ? { support_worker_id: person.id }
        : { client_id: person.id };
      const res = await axiosInstance.post('/conversations', payload);
      navigate(`/messages/${res.data.id}`);
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress sx={{ color: '#7B2FBE' }} /></Box>;

  const label = client ? 'Search support workers…' : 'Search clients…';

  return (
    <Box maxWidth={680} mx="auto" mt={5} px={2}>
      <Typography variant="h4" fontWeight={700} mb={3}>Messages</Typography>

      {/* Search to start a new conversation */}
      <Box position="relative" mb={3}>
        <TextField
          fullWidth
          size="small"
          placeholder={label}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&.Mui-focused fieldset': { borderColor: '#7B2FBE' },
            },
          }}
        />
        {open && filtered.length > 0 && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              borderRadius: 2,
              overflow: 'hidden',
              zIndex: 10,
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {filtered.map((person, i) => {
              const name = `${person.first_name} ${person.last_name}`;
              return (
                <Box key={person.id}>
                  <Box
                    onMouseDown={() => handleSelect(person)}
                    sx={{
                      px: 2, py: 1.5,
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f3e8ff' },
                    }}
                  >
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#7B2FBE', fontSize: 14 }}>
                      {initials(name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{name}</Typography>
                      {person.location && (
                        <Typography variant="caption" color="text.secondary">{person.location}</Typography>
                      )}
                    </Box>
                    <ChatBubbleOutline sx={{ ml: 'auto', fontSize: 16, color: '#7B2FBE', opacity: 0.6 }} />
                  </Box>
                  {i < filtered.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Paper>
        )}
        {open && query.trim() && filtered.length === 0 && (
          <Paper elevation={4} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, mt: 0.5, borderRadius: 2, zIndex: 10, px: 2, py: 2 }}>
            <Typography variant="body2" color="text.secondary" fontStyle="italic">No results for "{query}"</Typography>
          </Paper>
        )}
      </Box>

      {conversations.length === 0 ? (
        <Typography color="text.secondary" fontStyle="italic">
          No conversations yet. Search above to start one.
        </Typography>
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
