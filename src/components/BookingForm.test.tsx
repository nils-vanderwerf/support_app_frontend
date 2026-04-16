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

jest.mock('../context/AuthContext', () => ({
...jest.requireActual('../context/AuthContext'),
  useAuth: () => ({ client: { id: 1 } })
}));

describe('BookingForm', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  beforeEach(() => {
    render(<BookingForm worker={mockWorker} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    mockedAxios.post.mockResolvedValue({ data: {}});
  })
  it('renders the title', () => {
    expect(screen.getByText(/Book a Support Worker/i)).toBeInTheDocument();
  });

  it('renders the date field', () => {
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
  });

  it('renders the duration field', () => {
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
  });

  it('renders the location field', () => {
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
  })
  it('closes the modal after submission', async () => {
    userEvent.click(screen.getByRole('button', { name: /Book/i }));
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    });
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  })
})