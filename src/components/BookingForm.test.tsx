import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import BookingForm from './BookingForm';
import axiosInstance from '../api/axiosConfig';

const mockWorker = {
  id: 1,
  first_name: 'John',
  last_name: 'Smith',
  middle_name: null,
  age: 30,
  availability: 'Weekdays',
  bio: 'Test bio',
  email: 'john@test.com',
  experience: '5 years',
  location: 'Melbourne',
  gender: 'Male',
  phone: '0400000000'
};

jest.mock('../api/axiosConfig');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

const renderForm = (props: Record<string, any> = {}) =>
  render(
    <MemoryRouter>
      <BookingForm
        clientId={1}
        supportWorkerId={1}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        suggested={{ duration: 60 }}
        {...props}
      />
    </MemoryRouter>
  );

describe('BookingForm', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  beforeEach(() => {
    render(<BookingForm worker={mockWorker} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    mockedAxios.post.mockResolvedValue({ data: {}});
  })
  afterEach(() => { jest.clearAllMocks(); })
  it('renders the title', () => {
    expect(screen.getByText(/Book a Support Worker/i)).toBeInTheDocument();
  });

  it('renders the date field', () => {
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
  });

  it('renders the notes field', () => {
    expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
  });

  it('renders the Book button', () => {
    expect(screen.getByRole('button', { name: /Book/i })).toBeInTheDocument();
  });
  it('submits the form with the correct data', async () => {
  userEvent.type(screen.getByLabelText(/Duration/i), '30');
  userEvent.type(screen.getByLabelText(/Location/i), 'Melbourne');
  userEvent.type(screen.getByLabelText(/Notes/i), 'Some test notes');
  userEvent.click(screen.getByRole('button', { name: /Book/i }));
  await waitFor(() => {
  expect(mockedAxios.post).toHaveBeenCalledWith('/appointments', {
    appointment: {
      date: expect.any(String),
      duration: 30,
      location: 'Melbourne',
      notes: 'Some test notes',
      client_id: 1,
      support_worker_id: 1
    }
  });
  });
  })
  it('closes the modal after submission', async () => {
    userEvent.click(screen.getByRole('button', { name: /Book/i }));
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows an error and does not submit when duration is 0', async () => {
    renderForm({ suggested: { duration: 0 } });
    await userEvent.click(screen.getByRole('button', { name: /^Book$/i }));
    expect(screen.getByText(/duration greater than 0/i)).toBeInTheDocument();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  describe('recurring bookings', () => {
    it('shows the recurring toggle on new bookings', () => {
      renderForm();
      expect(screen.getByLabelText(/Recurring booking/i)).toBeInTheDocument();
    });
  })
})
