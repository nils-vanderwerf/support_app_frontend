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

const makeInvitation = (id: number, status = 'pending', initiated_by = 'client') => ({
  id,
  date: '2026-06-01T10:00:00Z',
  duration: 60,
  location: 'Sydney',
  notes: 'Bring medication list',
  status,
  initiated_by,
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

    it('shows "Pending — Awaiting Response" label for support workers', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [makeInvitation(1)] })
        .mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => expect(screen.getByText(/Pending — Awaiting Response/i)).toBeInTheDocument());
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

    describe('Approve All', () => {
      it('shows "Approve All" button when multiple respondable invitations share a conversation', async () => {
        mockedAxios.get
          .mockResolvedValueOnce({ data: [makeInvitation(1), makeInvitation(2)] })
          .mockResolvedValueOnce({ data: [] });
        renderComponent();
        await waitFor(() => expect(screen.getByRole('button', { name: /Approve All/i })).toBeInTheDocument());
      });

      it('does not show "Approve All" for a single invitation', async () => {
        mockedAxios.get
          .mockResolvedValueOnce({ data: [makeInvitation(1)] })
          .mockResolvedValueOnce({ data: [] });
        renderComponent();
        await waitFor(() => screen.getByRole('button', { name: /^Approve$/i }));
        expect(screen.queryByRole('button', { name: /Approve All/i })).not.toBeInTheDocument();
      });

      it('patches all invitations in the group when "Approve All" is clicked', async () => {
        mockedAxios.get
          .mockResolvedValueOnce({ data: [makeInvitation(1), makeInvitation(2)] })
          .mockResolvedValueOnce({ data: [] });
        mockedAxios.patch.mockResolvedValue({ data: {} });
        renderComponent();
        await waitFor(() => screen.getByRole('button', { name: /Approve All/i }));
        await userEvent.click(screen.getByRole('button', { name: /Approve All/i }));
        await waitFor(() => {
          expect(mockedAxios.patch).toHaveBeenCalledWith('/appointments/1/approve', { timezone: expect.any(String) });
          expect(mockedAxios.patch).toHaveBeenCalledWith('/appointments/2/approve', { timezone: expect.any(String) });
          expect(mockedAxios.patch).toHaveBeenCalledTimes(2);
        });
      });

      it('removes all invitations from the list after "Approve All"', async () => {
        mockedAxios.get
          .mockResolvedValueOnce({ data: [makeInvitation(1), makeInvitation(2)] })
          .mockResolvedValueOnce({ data: [] });
        mockedAxios.patch.mockResolvedValue({ data: {} });
        renderComponent();
        await waitFor(() => screen.getByRole('button', { name: /Approve All/i }));
        await userEvent.click(screen.getByRole('button', { name: /Approve All/i }));
        await waitFor(() => expect(screen.queryByText('Olivia Williams')).not.toBeInTheDocument());
      });
    });
  });

  describe('as a client', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ client: { id: 1 }, supportWorker: null } as any);
    });

    it('shows "Pending — Awaiting Response" label', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [makeInvitation(1)] })
        .mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => expect(screen.getByText(/Pending — Awaiting Response/i)).toBeInTheDocument());
    });

    it('shows "Waiting for response…" when invitation was client-initiated', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [makeInvitation(1, 'pending', 'client')] })
        .mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText(/Waiting for response/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Approve/i })).not.toBeInTheDocument();
      });
    });

    it('shows Approve/Decline when invitation was support_worker-initiated', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [makeInvitation(1, 'pending', 'support_worker')] })
        .mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
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
