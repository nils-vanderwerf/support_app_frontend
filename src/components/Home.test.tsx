import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

jest.mock('../api/axiosConfig');
jest.mock('../context/AuthContext');
jest.mock('../utils/formatDuration', () => ({ formatDuration: (d: number) => `${d} min` }));

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const makeAppointment = (id: number, overrides = {}) => ({
  id,
  date: '2026-06-10T09:00:00Z',
  duration: 60,
  location: 'Sydney',
  notes: 'Test notes',
  client_id: 1,
  support_worker_id: 2,
  client: { id: 1, first_name: 'Jane', last_name: 'Doe' },
  support_worker: { id: 2, first_name: 'Olivia', last_name: 'Williams' },
  ...overrides,
});

const clientDashboard = {
  role: 'client',
  upcoming_appointments: [makeAppointment(1)],
  recent_appointments: [],
  days_since_last_appointment: 5,
  total_appointments: 3,
  health_info: { health_conditions: 'Hypertension', medication: 'Lisinopril', allergies: '' },
};

const workerDashboard = {
  role: 'support_worker',
  upcoming_appointments: [makeAppointment(2)],
  recent_appointments: [],
  today_appointments: [],
  hours_this_week: 12,
  total_clients: 4,
};

const renderComponent = () =>
  render(<MemoryRouter><Home /></MemoryRouter>);

describe('Home — client dashboard', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ user: { id: 1, first_name: 'Jane' }, client: { id: 1 }, supportWorker: null } as any);
  });
  afterEach(() => jest.clearAllMocks());

  it('shows loading spinner initially', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });

  it('renders the welcome heading with first name', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: clientDashboard });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Welcome back, Jane/i)).toBeInTheDocument());
  });

  it('shows stat cards for upcoming, days since last, and total appointments', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: clientDashboard });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Upcoming (7 days)')).toBeInTheDocument();
      expect(screen.getByText('Days since last appointment')).toBeInTheDocument();
      expect(screen.getByText('Total appointments')).toBeInTheDocument();
    });
  });

  it('renders health info when present', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: clientDashboard });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Lisinopril')).toBeInTheDocument();
    });
  });

  it('renders the support worker name in upcoming appointments', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: clientDashboard });
    renderComponent();
    await waitFor(() => expect(screen.getByText('Olivia Williams')).toBeInTheDocument());
  });

  it('opens edit BookingForm when edit icon is clicked', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: clientDashboard });
    renderComponent();
    await waitFor(() => screen.getByText('Olivia Williams'));
    await userEvent.click(screen.getByTitle ? document.querySelector('[data-testid="EditOutlinedIcon"]')?.closest('button')! : screen.getAllByRole('button')[0]);
    // BookingForm modal heading should appear
    await waitFor(() => expect(screen.getByText(/Book Appointment|Edit/i)).toBeInTheDocument());
  });

  it('opens delete dialog when delete icon is clicked', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: clientDashboard });
    renderComponent();
    await waitFor(() => screen.getByText('Olivia Williams'));
    const deleteBtn = document.querySelector('[data-testid="DeleteOutlinedIcon"]')?.closest('button') as HTMLElement;
    if (deleteBtn) await userEvent.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Delete Appointment/i)).toBeInTheDocument());
  });
});

describe('Home — support worker dashboard', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ user: { id: 2, first_name: 'Olivia' }, client: null, supportWorker: { id: 2 } } as any);
  });
  afterEach(() => jest.clearAllMocks());

  it('renders support worker stat cards', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: workerDashboard });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Today's appointments")).toBeInTheDocument();
      expect(screen.getByText('Hours this week')).toBeInTheDocument();
      expect(screen.getByText('Total clients')).toBeInTheDocument();
    });
  });

  it('renders client name in upcoming appointments', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: workerDashboard });
    renderComponent();
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
  });

  it('shows rebook button for past appointments', async () => {
    const dashboardWithPast = {
      ...workerDashboard,
      recent_appointments: [makeAppointment(3)],
    };
    mockedAxios.get.mockResolvedValueOnce({ data: dashboardWithPast });
    renderComponent();
    await waitFor(() => {
      expect(document.querySelector('[data-testid="EventRepeatOutlinedIcon"]')).toBeInTheDocument();
    });
  });
});
