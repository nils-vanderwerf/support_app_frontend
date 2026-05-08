import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import axiosInstance from '../api/axiosConfig';

jest.mock('../api/axiosConfig');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const renderComponent = () => render(<MemoryRouter><ForgotPassword /></MemoryRouter>);

describe('ForgotPassword', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the email field and submit button', () => {
    renderComponent();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send reset link/i })).toBeInTheDocument();
  });

  it('shows a success message after submission', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: {} });
    renderComponent();
    await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Send reset link/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/check your inbox/i));
  });

  it('shows an error if the request fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
    renderComponent();
    await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Send reset link/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i));
  });

  it('has a back to login link', () => {
    renderComponent();
    expect(screen.getByRole('link', { name: /Back to login/i })).toBeInTheDocument();
  });
});
