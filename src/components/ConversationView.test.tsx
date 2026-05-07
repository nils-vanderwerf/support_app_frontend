import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ConversationView from './ConversationView';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

jest.mock('../api/axiosConfig');
jest.mock('../context/AuthContext');
jest.mock('./BookingForm', () => () => <div data-testid="booking-form" />);

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const baseConversation = {
  id: 1,
  client: { id: 1, first_name: 'Jane', last_name: 'Doe' },
  support_worker: { id: 2, first_name: 'Olivia', last_name: 'Williams' },
  messages: [
    { id: 10, content: 'Hello there!', sender_type: 'client', sender_id: 1, created_at: '2026-05-01T10:00:00Z' },
  ],
  appointments: [],
};

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={['/messages/1']}>
      <Routes>
        <Route path="/messages/:id" element={<ConversationView />} />
      </Routes>
    </MemoryRouter>
  );

describe('ConversationView', () => {
  afterEach(() => jest.clearAllMocks());

  describe('as a client', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ client: { id: 1 }, supportWorker: null } as any);
    });

    it('shows loading spinner before data loads', () => {
      mockedAxios.get.mockReturnValue(new Promise(() => {}));
      renderComponent();
      expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
    });

    it('renders the other party name in the header', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: baseConversation });
      renderComponent();
      await waitFor(() => expect(screen.getByText('Olivia Williams')).toBeInTheDocument());
    });

    it('renders existing messages', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: baseConversation });
      renderComponent();
      await waitFor(() => expect(screen.getByText('Hello there!')).toBeInTheDocument());
    });

    it('shows system messages as light text without a bubble', async () => {
      const conv = {
        ...baseConversation,
        messages: [{ id: 11, content: '[SYS]✓ Appointment confirmed', sender_type: 'client', sender_id: 1, created_at: '2026-05-01T10:05:00Z' }],
      };
      mockedAxios.get.mockResolvedValueOnce({ data: conv });
      renderComponent();
      await waitFor(() => expect(screen.getByText('✓ Appointment confirmed')).toBeInTheDocument());
    });

    it('shows "Send Invitation" button for clients', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: baseConversation });
      renderComponent();
      await waitFor(() => expect(screen.getByRole('button', { name: /Send Invitation/i })).toBeInTheDocument());
    });

    it('sends a message and triggers AI response', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: baseConversation });
      mockedAxios.post
        .mockResolvedValueOnce({ data: { id: 20, content: 'Hi!', sender_type: 'client', sender_id: 1, created_at: '2026-05-01T10:10:00Z' } })
        .mockResolvedValueOnce({ data: { message: { id: 21, content: 'Hello!', sender_type: 'support_worker', sender_id: 2, created_at: '2026-05-01T10:11:00Z' }, continue: false, appointment: null } });

      renderComponent();
      await waitFor(() => screen.getByText('Hello there!'));
      const input = screen.getByPlaceholderText(/Type a message/i);
      await userEvent.type(input, 'Hi!');
      // Submit via Enter key since the send IconButton has no accessible name
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(screen.getByText('Hello!')).toBeInTheDocument());
    });

    it('renders a pending appointment invitation', async () => {
      const conv = {
        ...baseConversation,
        appointments: [{ id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '', status: 'pending' }],
      };
      mockedAxios.get.mockResolvedValueOnce({ data: conv });
      renderComponent();
      await waitFor(() => expect(screen.getByText('Appointment Invitation')).toBeInTheDocument());
    });

    it('shows "Waiting for response…" text for clients on pending invitation', async () => {
      const conv = {
        ...baseConversation,
        appointments: [{ id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '', status: 'pending' }],
      };
      mockedAxios.get.mockResolvedValueOnce({ data: conv });
      renderComponent();
      await waitFor(() => expect(screen.getByText(/Waiting for response/i)).toBeInTheDocument());
    });

    it('opens BookingForm when Send Invitation is clicked', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: baseConversation })
        .mockResolvedValueOnce({ data: { date: '2026-06-10', time: '10:00' } });
      renderComponent();
      await waitFor(() => screen.getByRole('button', { name: /Send Invitation/i }));
      await userEvent.click(screen.getByRole('button', { name: /Send Invitation/i }));
      await waitFor(() => expect(screen.getByTestId('booking-form')).toBeInTheDocument());
    });
  });

  describe('as a support worker', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ client: null, supportWorker: { id: 2 } } as any);
    });

    it('shows the client name in the header', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: baseConversation });
      renderComponent();
      await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
    });

    it('shows Approve and Decline buttons for support workers on pending invitations', async () => {
      const conv = {
        ...baseConversation,
        appointments: [{ id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '', status: 'pending' }],
      };
      mockedAxios.get.mockResolvedValueOnce({ data: conv });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
      });
    });

    it('removes invitation card after approval', async () => {
      const conv = {
        ...baseConversation,
        appointments: [{ id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '', status: 'pending' }],
      };
      mockedAxios.get.mockResolvedValueOnce({ data: conv });
      mockedAxios.patch.mockResolvedValueOnce({ data: {} });
      renderComponent();
      await waitFor(() => screen.getByRole('button', { name: /Approve/i }));
      await userEvent.click(screen.getByRole('button', { name: /Approve/i }));
      await waitFor(() => expect(screen.queryByText('Appointment Invitation')).not.toBeInTheDocument());
    });

    it('hides "Send Invitation" button for support workers', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: baseConversation });
      renderComponent();
      await waitFor(() => screen.getByText('Jane Doe'));
      expect(screen.queryByRole('button', { name: /Send Invitation/i })).not.toBeInTheDocument();
    });
  });
});
