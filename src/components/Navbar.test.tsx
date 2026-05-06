import React from 'react';
import { render, screen } from '@testing-library/react';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

jest.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  useNavigate: () => jest.fn(),
}));

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));

const mockUseAuth = useAuth as jest.Mock;

describe('Navbar', () => {
  afterEach(() => { jest.clearAllMocks(); });

  it('hides the Clients link for client users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, first_name: 'Jane' },
      client: { id: 1, first_name: 'Jane', last_name: 'Doe' },
      supportWorker: null,
      setUser: jest.fn(),
    });
    render(<Navbar />);
    expect(screen.queryByRole('link', { name: /clients/i })).not.toBeInTheDocument();
  });

  it('shows the Clients link for support worker users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, first_name: 'Bob' },
      client: null,
      supportWorker: { id: 1, first_name: 'Bob', last_name: 'Brown' },
      setUser: jest.fn(),
    });
    render(<Navbar />);
    expect(screen.getByRole('link', { name: /clients/i })).toBeInTheDocument();
  });
});
