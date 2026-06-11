import { render, screen } from '@testing-library/react';
import AdminRoute from './AdminRoute';
import { useAuth } from '../context/AuthContext';

jest.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

describe('AdminRoute', () => {
  afterEach(() => { jest.clearAllMocks(); });

  it('renders null while loading', () => {
    mockUseAuth.mockReturnValue({ loading: true, user: null });
    const { container } = render(<AdminRoute><div>Admin Content</div></AdminRoute>);
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to /login when not logged in', () => {
    mockUseAuth.mockReturnValue({ loading: false, user: null });
    render(<AdminRoute><div>Admin Content</div></AdminRoute>);
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
  });

  it('redirects to / when logged in but not admin', () => {
    mockUseAuth.mockReturnValue({ loading: false, user: { id: 1, email: 'user@test.com', role: 'support_worker' } });
    render(<AdminRoute><div>Admin Content</div></AdminRoute>);
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
  });

  it('renders children when user is admin', () => {
    mockUseAuth.mockReturnValue({ loading: false, user: { id: 1, email: 'admin@test.com', role: 'admin' } });
    render(<AdminRoute><div>Admin Content</div></AdminRoute>);
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
