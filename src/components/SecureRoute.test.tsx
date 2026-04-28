import { render, screen } from '@testing-library/react';
import SecureRoute from './SecureRoute';
import { useAuth } from '../context/AuthContext';

jest.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

describe('SecureRoute', () => {
  afterEach(() => { jest.clearAllMocks(); });

  it('renders null while loading', () => {
    mockUseAuth.mockReturnValue({ loading: true, user: null });
    const { container } = render(<SecureRoute><div>Protected</div></SecureRoute>);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders children when user is logged in', () => {
    mockUseAuth.mockReturnValue({ loading: false, user: { id: 1, email: 'test@test.com' } });
    render(<SecureRoute><div>Protected</div></SecureRoute>);
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });

  it('redirects to /login when not logged in', () => {
    mockUseAuth.mockReturnValue({ loading: false, user: null });
    render(<SecureRoute><div>Protected</div></SecureRoute>);
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
  });
});
