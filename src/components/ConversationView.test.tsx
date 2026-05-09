import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ConversationView from './ConversationView';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

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

const emptyConversation = { ...baseConversation, messages: [] };

const renderComponent = () =>
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/messages/1']}>
        <Routes>
          <Route path="/messages/:id" element={<ConversationView />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );

describe('ConversationView', () => {
  afterEach(() => jest.clearAllMocks());

  describe('as a client', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ client: { id: 1, first_name: 'Jane' }, supportWorker: null } as any);
      mockedAxios.get.mockResolvedValue({ data: [] });
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

    it('shows "Waiting for response…" text for clients on pending invitation initiated by client', async () => {
      const conv = {
        ...baseConversation,
        appointments: [{ id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '', status: 'pending', initiated_by: 'client' }],
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

    describe('conversation starters (client)', () => {
      it('shows client starter chips when there are no messages', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: emptyConversation });
        renderComponent();
        await waitFor(() =>
          expect(screen.getByText(/I came across your profile/i)).toBeInTheDocument()
        );
      });

      it('does not show starter chips when messages exist', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: baseConversation });
        renderComponent();
        await waitFor(() => screen.getByText('Hello there!'));
        expect(screen.queryByText(/I came across your profile/i)).not.toBeInTheDocument();
      });

      it('clicking a client starter populates the input', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: emptyConversation });
        renderComponent();
        await waitFor(() => screen.getByText(/I came across your profile/i));
        await userEvent.click(screen.getByText(/I came across your profile/i));
        const input = screen.getByPlaceholderText(/Type a message/i);
        expect((input as HTMLTextAreaElement).value).toMatch(/I came across your profile/i);
      });
    });
  });

  describe('as a support worker', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ client: null, supportWorker: { id: 2, first_name: 'Olivia' } } as any);
      mockedAxios.get.mockResolvedValue({ data: [] });
    });

    it('shows the client name in the header', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: baseConversation });
      renderComponent();
      await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
    });

    it('shows Approve and Decline buttons for support workers on client-initiated pending invitations', async () => {
      const conv = {
        ...baseConversation,
        appointments: [{ id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '', status: 'pending', initiated_by: 'client' }],
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
        appointments: [{ id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '', status: 'pending', initiated_by: 'client' }],
      };
      mockedAxios.get
        .mockResolvedValueOnce({ data: conv })
        .mockResolvedValueOnce({ data: { ...conv, appointments: [] } });
      mockedAxios.patch.mockResolvedValueOnce({ data: {} });
      renderComponent();
      await waitFor(() => screen.getByRole('button', { name: /Approve/i }));
      await userEvent.click(screen.getByRole('button', { name: /Approve/i }));
      await waitFor(() => expect(screen.queryByText('Appointment Invitation')).not.toBeInTheDocument());
    });

    it('shows "Send Invitation" button for support workers', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: baseConversation });
      renderComponent();
      await waitFor(() => screen.getByText('Jane Doe'));
      expect(screen.getByRole('button', { name: /Send Invitation/i })).toBeInTheDocument();
    });

    describe('conversation starters (support worker)', () => {
      it('shows support worker starter chips when there are no messages', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: emptyConversation });
        renderComponent();
        await waitFor(() =>
          expect(screen.getByText(/what kind of support are you after/i)).toBeInTheDocument()
        );
      });

      it('does not show starter chips when messages exist', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: baseConversation });
        renderComponent();
        await waitFor(() => screen.getByText('Hello there!'));
        expect(screen.queryByText(/what kind of support are you after/i)).not.toBeInTheDocument();
      });

      it('clicking a support worker starter populates the input', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: emptyConversation });
        renderComponent();
        await waitFor(() => screen.getByText(/what kind of support are you after/i));
        await userEvent.click(screen.getByText(/what kind of support are you after/i));
        const input = screen.getByPlaceholderText(/Type a message/i);
        expect((input as HTMLTextAreaElement).value).toMatch(/what kind of support are you after/i);
      });

      it('support worker starters mention the support worker name', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: emptyConversation });
        renderComponent();
        await waitFor(() =>
          expect(screen.getByText(/I'm Olivia/i)).toBeInTheDocument()
        );
      });
    });

    describe('Approve All', () => {
      const twoAppointments = [
        { id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '', status: 'pending', initiated_by: 'client' },
        { id: 6, date: '2026-06-08T10:00:00Z', duration: 60, location: 'Sydney', notes: '', status: 'pending', initiated_by: 'client' },
      ];

      it('shows "Approve All" button when multiple pending invitations are respondable', async () => {
        const conv = { ...baseConversation, appointments: twoAppointments };
        mockedAxios.get.mockResolvedValueOnce({ data: conv });
        renderComponent();
        await waitFor(() => expect(screen.getByRole('button', { name: /Approve All/i })).toBeInTheDocument());
      });

      it('does not show "Approve All" for a single pending invitation', async () => {
        const conv = {
          ...baseConversation,
          appointments: [{ id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '', status: 'pending', initiated_by: 'client' }],
        };
        mockedAxios.get.mockResolvedValueOnce({ data: conv });
        renderComponent();
        await waitFor(() => screen.getByRole('button', { name: /^Approve$/i }));
        expect(screen.queryByRole('button', { name: /Approve All/i })).not.toBeInTheDocument();
      });

      it('calls bulk_approve with all appointment IDs when "Approve All" is clicked', async () => {
        const conv = { ...baseConversation, appointments: twoAppointments };
        mockedAxios.get
          .mockResolvedValueOnce({ data: conv })
          .mockResolvedValueOnce({ data: [] })
          .mockResolvedValueOnce({ data: { ...conv, appointments: [] } });
        mockedAxios.patch.mockResolvedValue({ data: {} });
        renderComponent();
        await waitFor(() => screen.getByRole('button', { name: /Approve All/i }));
        await userEvent.click(screen.getByRole('button', { name: /Approve All/i }));
        await waitFor(() => {
          expect(mockedAxios.patch).toHaveBeenCalledWith('/appointments/bulk_approve', {
            appointment_ids: [5, 6],
            timezone: expect.any(String),
          });
        });
      });

      it('clears pending invitation cards after "Approve All"', async () => {
        const conv = { ...baseConversation, appointments: twoAppointments };
        mockedAxios.get
          .mockResolvedValueOnce({ data: conv })
          .mockResolvedValueOnce({ data: [] })
          .mockResolvedValueOnce({ data: { ...conv, appointments: [] } });
        mockedAxios.patch.mockResolvedValue({ data: {} });
        renderComponent();
        await waitFor(() => screen.getByRole('button', { name: /Approve All/i }));
        await userEvent.click(screen.getByRole('button', { name: /Approve All/i }));
        await waitFor(() => expect(screen.queryByText('Appointment Invitation')).not.toBeInTheDocument());
      });
    });
  });
});
