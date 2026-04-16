import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

jest.mock('../api/axiosConfig');
jest.mock('../context/AuthContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

import { useNavigate } from 'react-router-dom';

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;

const mockSetUser = jest.fn();
const mockSetClient = jest.fn();
const mockSetSupportWorker = jest.fn();
const mockNavigate = jest.fn();

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      setUser: mockSetUser,
      setClient: mockSetClient,
      setSupportWorker: mockSetSupportWorker,
    } as any);
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => jest.clearAllMocks());

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByText(/log in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('navigates to /admin for admin users', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { user: { is_admin: true }, client: null, support_worker: null },
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
  });

  it('navigates to /vetting for pending support workers', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { user: { is_admin: false }, client: null, support_worker: { status: 'pending' } },
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'worker@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/vetting'));
  });

  it('navigates to / for regular authenticated users', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { user: { is_admin: false }, client: { id: 1 }, support_worker: null },
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'client@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('calls setUser, setClient, setSupportWorker on success', async () => {
    const user = { is_admin: false };
    const client = { id: 1 };
    const support_worker = null;
    mockedAxios.post.mockResolvedValueOnce({ data: { user, client, support_worker } });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'client@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(user);
      expect(mockSetClient).toHaveBeenCalledWith(client);
      expect(mockSetSupportWorker).toHaveBeenCalledWith(support_worker);
    });
  });

  it('shows an error message on failed login', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('401'));
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument());
  });

  it('does not navigate on failed login', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('401'));
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => screen.getByText(/invalid email or password/i));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('posts the entered credentials to /login', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { user: { is_admin: false }, client: { id: 1 }, support_worker: null },
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'hunter2');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledWith('/login', { email: 'jane@example.com', password: 'hunter2' }));
  });
});
