import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ConversationList from './ConversationList';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

jest.mock('../api/axiosConfig');
jest.mock('../context/AuthContext');

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockClient = { id: 1, first_name: 'Jane', last_name: 'Doe' } as any;

const makeConversation = (id: number, lastContent?: string) => ({
  id,
  client: { id: 1, first_name: 'Jane', last_name: 'Doe' },
  support_worker: { id: 2, first_name: 'Olivia', last_name: 'Williams' },
  messages: lastContent
    ? [{ content: lastContent, created_at: '2026-05-01T10:00:00Z' }]
    : [],
});

const renderComponent = () =>
  render(
    <MemoryRouter>
      <ConversationList />
    </MemoryRouter>
  );

// Each render triggers two GET calls: /conversations then /support_workers (or /clients).
// mockConversations mocks both in order so tests don't crash on the second call.
const mockConversations = (conversations: ReturnType<typeof makeConversation>[]) => {
  mockedAxios.get
    .mockResolvedValueOnce({ data: conversations } as any)
    .mockResolvedValueOnce({ data: [] } as any);
};

describe('ConversationList', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ client: mockClient, supportWorker: null } as any);
  });
  afterEach(() => jest.clearAllMocks());

  it('shows loading spinner initially', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });

  it('shows empty state when there are no conversations', async () => {
    mockConversations([]);
    renderComponent();
    await waitFor(() => expect(screen.getByText(/No conversations yet/i)).toBeInTheDocument());
  });

  it('renders a conversation with the other party name', async () => {
    mockConversations([makeConversation(1, 'Hello!')]);
    renderComponent();
    await waitFor(() => expect(screen.getByText('Olivia Williams')).toBeInTheDocument());
  });

  it('shows last message preview', async () => {
    mockConversations([makeConversation(1, 'See you tomorrow')]);
    renderComponent();
    await waitFor(() => expect(screen.getByText('See you tomorrow')).toBeInTheDocument());
  });

  it('does not render empty conversations returned from the API', async () => {
    mockConversations([makeConversation(1)]);
    renderComponent();
    await waitFor(() => expect(screen.getByText(/No conversations yet/i)).toBeInTheDocument());
    expect(screen.queryByText('Olivia Williams')).not.toBeInTheDocument();
  });

  it('renders multiple conversations', async () => {
    mockConversations([makeConversation(1, 'Hi'), makeConversation(2, 'Hey')]);
    renderComponent();
    await waitFor(() => {
      // Both show same worker name (same mock data) — just check count
      expect(screen.getAllByText('Olivia Williams')).toHaveLength(2);
    });
  });

  it('shows client name when user is a support worker', async () => {
    mockedUseAuth.mockReturnValue({ client: null, supportWorker: { id: 2 } } as any);
    mockedAxios.get
      .mockResolvedValueOnce({ data: [] } as any) // admin_messages
      .mockResolvedValueOnce({ data: [makeConversation(1, 'Hello')] } as any) // conversations
      .mockResolvedValueOnce({ data: [] } as any); // clients
    renderComponent();
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
  });
});
