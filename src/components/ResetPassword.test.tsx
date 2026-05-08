import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResetPassword from './ResetPassword';
import axiosInstance from '../api/axiosConfig';

jest.mock('../api/axiosConfig');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={['/reset-password/abc123']}>
      <Routes>
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </MemoryRouter>
  );

describe('ResetPassword', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders password fields and submit button', () => {
    renderComponent();
    expect(screen.getAllByLabelText(/password/i)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(/password/i)[1]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update password/i })).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    renderComponent();
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await userEvent.type(screen.getAllByLabelText(/password/i)[1], 'different');
    await userEvent.click(screen.getByRole('button', { name: /Update password/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i);
  });

  it('shows error when password is too short', async () => {
    renderComponent();
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'abc');
    await userEvent.type(screen.getAllByLabelText(/password/i)[1], 'abc');
    await userEvent.click(screen.getByRole('button', { name: /Update password/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 6 characters/i);
  });

  it('navigates to login with notice on success', async () => {
    mockedAxios.patch.mockResolvedValueOnce({ data: {} });
    renderComponent();
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'newpassword99');
    await userEvent.type(screen.getAllByLabelText(/password/i)[1], 'newpassword99');
    await userEvent.click(screen.getByRole('button', { name: /Update password/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ state: { notice: expect.stringContaining('Password updated') } })));
  });

  it('shows error on invalid or expired token', async () => {
    mockedAxios.patch.mockRejectedValueOnce({ response: { data: { error: 'Reset link is invalid or has expired.' } } });
    renderComponent();
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'newpassword99');
    await userEvent.type(screen.getAllByLabelText(/password/i)[1], 'newpassword99');
    await userEvent.click(screen.getByRole('button', { name: /Update password/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/invalid or has expired/i));
  });
});
