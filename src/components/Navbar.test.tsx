import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) =>
    <a href={to} onClick={onClick}>{children}</a>,
  useNavigate: () => jest.fn(),
}));

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../api/axiosConfig');

const mockUseAuth = useAuth as jest.Mock;
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const clientAuth = {
  user: { id: 1, first_name: 'Jane', last_name: 'Doe' },
  client: { id: 1, first_name: 'Jane', last_name: 'Doe' },
  supportWorker: null,
  setUser: jest.fn(),
};

describe('Navbar', () => {
  afterEach(() => { jest.clearAllMocks(); });

  it('hides the Clients link for client users', () => {
    mockedAxios.get.mockResolvedValue({ data: { pending_invitations: 0, recently_accepted: 0, unread_messages: 0 } });
    mockUseAuth.mockReturnValue(clientAuth);
    render(<Navbar />);
    expect(screen.queryByRole('link', { name: /clients/i })).not.toBeInTheDocument();
  });

  it('shows the Clients link for support worker users', () => {
    mockedAxios.get.mockResolvedValue({ data: { pending_invitations: 0, recently_accepted: 0, unread_messages: 0 } });
    mockUseAuth.mockReturnValue({
      user: { id: 2, first_name: 'Bob' },
      client: null,
      supportWorker: { id: 1, first_name: 'Bob', last_name: 'Brown' },
      setUser: jest.fn(),
    });
    render(<Navbar />);
    expect(screen.getByRole('link', { name: /clients/i })).toBeInTheDocument();
  });

  describe('notification badges', () => {
    it('shows pending invitation count on the Invitations badge', async () => {
      mockedAxios.get.mockResolvedValue({ data: { pending_invitations: 3, recently_accepted: 2, unread_messages: 0 } });
      mockUseAuth.mockReturnValue(clientAuth);
      render(<Navbar />);
      await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    });

    it('does not include recently_accepted in the Invitations badge', async () => {
      mockedAxios.get.mockResolvedValue({ data: { pending_invitations: 3, recently_accepted: 2, unread_messages: 0 } });
      mockUseAuth.mockReturnValue(clientAuth);
      render(<Navbar />);
      await waitFor(() => screen.getByText('3'));
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('hides Invitations badge when there are no pending invitations', async () => {
      mockedAxios.get.mockResolvedValue({ data: { pending_invitations: 0, recently_accepted: 4, unread_messages: 0 } });
      mockUseAuth.mockReturnValue(clientAuth);
      render(<Navbar />);
      // Wait for notifications fetch to complete, then verify no number badge appears
      await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledWith('/notifications'));
      expect(screen.queryByText('4')).not.toBeInTheDocument();
    });

    it('shows unread message count on the Messages badge', async () => {
      mockedAxios.get.mockResolvedValue({ data: { pending_invitations: 0, recently_accepted: 0, unread_messages: 7 } });
      mockUseAuth.mockReturnValue(clientAuth);
      render(<Navbar />);
      await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument());
    });

    it('clears Messages badge immediately when Messages is clicked', async () => {
      mockedAxios.get.mockResolvedValue({ data: { pending_invitations: 0, recently_accepted: 0, unread_messages: 7 } });
      mockUseAuth.mockReturnValue(clientAuth);
      render(<Navbar />);
      const badge = await waitFor(() => screen.getByText('7'));
      await userEvent.click(screen.getByRole('link', { name: /messages/i }));
      expect(badge).toHaveClass('MuiBadge-invisible');
    });

    it('clears Invitations badge immediately when Invitations is clicked', async () => {
      mockedAxios.get.mockResolvedValue({ data: { pending_invitations: 2, recently_accepted: 0, unread_messages: 0 } });
      mockUseAuth.mockReturnValue(clientAuth);
      render(<Navbar />);
      const badge = await waitFor(() => screen.getByText('2'));
      await userEvent.click(screen.getByRole('link', { name: /invitations/i }));
      expect(badge).toHaveClass('MuiBadge-invisible');
    });
  });
});
