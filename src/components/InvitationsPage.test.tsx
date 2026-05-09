import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import InvitationsPage from './InvitationsPage';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

jest.mock('../api/axiosConfig');
jest.mock('../context/AuthContext');

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeInvitation = (id: number, status = 'pending') => ({
  id,
  date: '2026-06-01T10:00:00Z',
  duration: 60,
  location: 'Sydney',
  notes: 'Bring medication list',
  status,
  conversation_id: 5,
  client: { id: 1, first_name: 'Jane', last_name: 'Doe' },
  support_worker: { id: 2, first_name: 'Olivia', last_name: 'Williams' },
});

const renderComponent = () =>
  render(
    <MemoryRouter>
      <InvitationsPage />
    </MemoryRouter>
  );

describe('InvitationsPage', () => {
  afterEach(() => jest.clearAllMocks());

  describe('as a support worker', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ client: null, supportWorker: { id: 2 } } as any);
    });

    it('shows loading spinner initially', () => {
      mockedAxios.get.mockReturnValue(new Promise(() => {}));
      renderComponent();
      expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
    });

    it('shows empty state when no invitations exist', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });
      renderComponent();
      await waitFor(() => expect(screen.getByText(/No invitations yet/i)).toBeInTheDocument());
    });

    it('shows "Incoming — Awaiting Your Response" label for support workers', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [makeInvitation(1)] })
        .mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => expect(screen.getByText(/Incoming — Awaiting Your Response/i)).toBeInTheDocument());
    });

    it('renders Approve and Decline buttons for pending invitations', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [makeInvitation(1)] })
        .mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
      });
    });

    it('removes invitation from list after approval', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [makeInvitation(1)] })
        .mockResolvedValueOnce({ data: [] });
      mockedAxios.patch.mockResolvedValueOnce({ data: {} });
      renderComponent();
      await waitFor(() => screen.getByRole('button', { name: /Approve/i }));
      await userEvent.click(screen.getByRole('button', { name: /Approve/i }));
      expect(mockedAxios.patch).toHaveBeenCalledWith('/appointments/1/approve', { timezone: expect.any(String) });
      await waitFor(() => expect(screen.queryByText('Olivia Williams')).not.toBeInTheDocument());
    });

    it('removes invitation from list after decline', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [makeInvitation(1)] })
        .mockResolvedValueOnce({ data: [] });
      mockedAxios.patch.mockResolvedValueOnce({ data: {} });
      renderComponent();
      await waitFor(() => screen.getByRole('button', { name: /Decline/i }));
      await userEvent.click(screen.getByRole('button', { name: /Decline/i }));
      expect(mockedAxios.patch).toHaveBeenCalledWith('/appointments/1/decline', { timezone: expect.any(String) });
      await waitFor(() => expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument());
    });
  });

  describe('as a client', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ client: { id: 1 }, supportWorker: null } as any);
    });

    it('shows "Outgoing — Awaiting Response" label for clients', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [makeInvitation(1)] })
        .mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => expect(screen.getByText(/Outgoing — Awaiting Response/i)).toBeInTheDocument());
    });

    it('shows "Waiting for response…" text instead of Approve/Decline buttons', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [makeInvitation(1)] })
        .mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText(/Waiting for response/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Approve/i })).not.toBeInTheDocument();
      });
    });

    it('shows "Recently Accepted" section with Accepted chip', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [makeInvitation(2, 'approved')] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText(/Recently Accepted/i)).toBeInTheDocument();
        expect(screen.getByText('Accepted')).toBeInTheDocument();
      });
    });

    it('renders View Chat button when conversation_id is present', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [makeInvitation(1)] })
        .mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => expect(screen.getByRole('button', { name: /View Chat/i })).toBeInTheDocument());
    });
  });
});
