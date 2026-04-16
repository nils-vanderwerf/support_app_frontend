import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppointmentList from './AppointmentList';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

jest.mock('../api/axiosConfig');
jest.mock('../context/AuthContext');
jest.mock('./BookingForm', () => () => <div data-testid="booking-form" />);
jest.mock('./BookingAgent', () => () => <div data-testid="booking-agent" />);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

import { useNavigate } from 'react-router-dom';

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
const mockNavigate = jest.fn();

const FUTURE_DATE = '2030-06-01T10:00:00Z';
const PAST_DATE = '2020-01-01T10:00:00Z';

const makeAppointment = (overrides = {}) => ({
  id: 1,
  date: FUTURE_DATE,
  location: 'Sydney CBD',
  duration: 60,
  notes: 'Bring ID',
  support_worker: { id: 2, first_name: 'Olivia', last_name: 'Williams' },
  client: { id: 3, first_name: 'Jane', last_name: 'Doe' },
  ...overrides,
});

const renderComponent = () =>
  render(
    <MemoryRouter>
      <AppointmentList />
    </MemoryRouter>
  );

describe('AppointmentList', () => {
  beforeEach(() => {
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => jest.clearAllMocks());

  describe('as a client', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ client: { id: 3 }, supportWorker: null } as any);
    });

    it('fetches and renders appointments', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [makeAppointment()] });
      renderComponent();
      await waitFor(() => expect(screen.getByText('Sydney CBD')).toBeInTheDocument());
      expect(screen.getByText('Bring ID')).toBeInTheDocument();
    });

    it('shows "No appointments found" when list is empty', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => expect(screen.getByText(/no appointments found/i)).toBeInTheDocument());
    });

    it('shows Edit and Delete buttons for future appointments', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [makeAppointment({ date: FUTURE_DATE })] });
      renderComponent();
      await waitFor(() => expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument());
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('shows Rebook button for past appointments', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [makeAppointment({ date: PAST_DATE })] });
      renderComponent();
      await waitFor(() => expect(screen.getByRole('button', { name: /rebook/i })).toBeInTheDocument());
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    it('shows the support worker name column header', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => expect(screen.getByText('Support Worker')).toBeInTheDocument());
    });

    it('clicking a name navigates to support worker profile', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [makeAppointment()] });
      renderComponent();
      await waitFor(() => screen.getByText('Olivia Williams'));
      await userEvent.click(screen.getByText('Olivia Williams'));
      expect(mockNavigate).toHaveBeenCalledWith('/support-workers/2');
    });

    it('opens delete confirmation dialog', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [makeAppointment()] });
      renderComponent();
      await waitFor(() => screen.getByRole('button', { name: /delete/i }));
      await userEvent.click(screen.getByRole('button', { name: /delete/i }));
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    });

    it('cancelling the delete dialog closes it', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [makeAppointment()] });
      renderComponent();
      await waitFor(() => screen.getByRole('button', { name: /delete/i }));
      await userEvent.click(screen.getByRole('button', { name: /delete/i }));
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument();
    });

    it('confirming delete calls API and removes the row', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [makeAppointment()] });
      mockedAxios.delete.mockResolvedValueOnce({});
      renderComponent();
      await waitFor(() => screen.getByRole('button', { name: /delete/i }));
      await userEvent.click(screen.getByRole('button', { name: /delete/i }));
      await userEvent.click(screen.getByRole('button', { name: /confirm/i }));
      await waitFor(() => expect(screen.queryByText('Sydney CBD')).not.toBeInTheDocument());
      expect(mockedAxios.delete).toHaveBeenCalledWith('/appointments/1');
    });
  });

  describe('as a support worker', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({ client: null, supportWorker: { id: 2 } } as any);
    });

    it('shows the Client column header', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => expect(screen.getByText('Client')).toBeInTheDocument());
    });

    it('clicking a name navigates to client profile', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [makeAppointment()] });
      renderComponent();
      await waitFor(() => screen.getByText('Jane Doe'));
      await userEvent.click(screen.getByText('Jane Doe'));
      expect(mockNavigate).toHaveBeenCalledWith('/clients/3');
    });

    it('shows "Book with AI" button', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });
      renderComponent();
      await waitFor(() => expect(screen.getByRole('button', { name: /book with ai/i })).toBeInTheDocument());
    });
  });
});
