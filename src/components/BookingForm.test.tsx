import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BookingForm from './BookingForm';
import axiosInstance from '../api/axiosConfig';

jest.mock('../api/axiosConfig');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

const renderForm = (props = {}) =>
  render(
    <MemoryRouter>
      <BookingForm clientId={1} supportWorkerId={1} onClose={mockOnClose} onSuccess={mockOnSuccess} {...props} />
    </MemoryRouter>
  );

describe('BookingForm', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValue({ data: {} });
    mockedAxios.patch.mockResolvedValue({ data: {} });
  });
  afterEach(() => jest.clearAllMocks());

  it('renders "Book Appointment" title by default', () => {
    renderForm();
    expect(screen.getByText(/Book Appointment/i)).toBeInTheDocument();
  });

  it('renders "Send Appointment Invitation" title when isPending', () => {
    renderForm({ isPending: true });
    expect(screen.getByText(/Send Appointment Invitation/i)).toBeInTheDocument();
  });

  it('renders "Edit Appointment" title when appointment is provided', () => {
    const appt = { id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: 'Test' };
    renderForm({ appointment: appt as any });
    expect(screen.getByText(/Edit Appointment/i)).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderForm();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
  });

  it('pre-fills fields from suggested prop', () => {
    renderForm({ suggested: { date: '2026-06-10', time: '11:00', duration: 90, location: 'Brisbane', notes: 'Bring ID' } });
    expect((screen.getByLabelText(/Location/i) as HTMLInputElement).value).toBe('Brisbane');
    expect((screen.getByLabelText(/Notes/i) as HTMLInputElement).value).toBe('Bring ID');
  });

  it('pre-fills fields from appointment prop when editing', () => {
    const appt = { id: 5, date: '2026-06-01T10:00:00Z', duration: 45, location: 'Melbourne', notes: 'Edited notes' };
    renderForm({ appointment: appt as any });
    expect((screen.getByLabelText(/Location/i) as HTMLInputElement).value).toBe('Melbourne');
    expect((screen.getByLabelText(/Notes/i) as HTMLInputElement).value).toBe('Edited notes');
  });

  it('shows "Book" button by default', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /^Book$/i })).toBeInTheDocument();
  });

  it('shows "Send Invitation" button when isPending', () => {
    renderForm({ isPending: true });
    expect(screen.getByRole('button', { name: /Send Invitation/i })).toBeInTheDocument();
  });

  it('hides "Send Message" button when isPending', () => {
    renderForm({ isPending: true });
    expect(screen.queryByRole('button', { name: /Send Message/i })).not.toBeInTheDocument();
  });

  it('shows "Send Message" button when not isPending', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
  });

  it('submits with status "pending" when isPending', async () => {
    renderForm({ isPending: true });
    await userEvent.click(screen.getByRole('button', { name: /Send Invitation/i }));
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/appointments',
        expect.objectContaining({ appointment: expect.objectContaining({ status: 'pending' }) })
      );
    });
  });

  it('submits with status "approved" by default', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /^Book$/i }));
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/appointments',
        expect.objectContaining({ appointment: expect.objectContaining({ status: 'approved' }) })
      );
    });
  });

  it('calls patch when editing an existing appointment', async () => {
    const appt = { id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '' };
    renderForm({ appointment: appt as any });
    await userEvent.click(screen.getByRole('button', { name: /^Save$/i }));
    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith('/appointments/5', expect.any(Object));
    });
  });

  it('calls onClose and onSuccess after successful submission', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /^Book$/i }));
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe('recurring bookings', () => {
    it('shows the recurring toggle on new bookings', () => {
      renderForm();
      expect(screen.getByLabelText(/Recurring booking/i)).toBeInTheDocument();
    });

    it('shows the recurring toggle on invitation forms', () => {
      renderForm({ isPending: true });
      expect(screen.getByLabelText(/Recurring booking/i)).toBeInTheDocument();
    });

    it('shows the recurring toggle on edit forms', () => {
      const appt = { id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '' };
      renderForm({ appointment: appt as any });
      expect(screen.getByLabelText(/Recurring booking/i)).toBeInTheDocument();
    });

    it('shows frequency and session count controls after toggling on', async () => {
      renderForm();
      await userEvent.click(screen.getByLabelText(/Recurring booking/i));
      expect(screen.getByRole('button', { name: /weekly/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fortnightly/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /monthly/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Number of sessions/i)).toBeInTheDocument();
    });

    it('shows a date preview when recurring is on', async () => {
      renderForm();
      await userEvent.click(screen.getByLabelText(/Recurring booking/i));
      expect(screen.getByText(/appointments will be created/i)).toBeInTheDocument();
    });

    it('updates button label to reflect session count', async () => {
      renderForm();
      await userEvent.click(screen.getByLabelText(/Recurring booking/i));
      expect(screen.getByRole('button', { name: /Book 4 Sessions/i })).toBeInTheDocument();
    });

    it('updates button label for recurring invitations', async () => {
      renderForm({ isPending: true });
      await userEvent.click(screen.getByLabelText(/Recurring booking/i));
      expect(screen.getByRole('button', { name: /Send 4 Invitations/i })).toBeInTheDocument();
    });

    it('posts N appointments when recurring new booking is submitted', async () => {
      renderForm();
      await userEvent.click(screen.getByLabelText(/Recurring booking/i));
      await userEvent.click(screen.getByRole('button', { name: /Book 4 Sessions/i }));
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledTimes(4);
      });
    });

    it('posts N pending appointments for recurring invitation', async () => {
      renderForm({ isPending: true });
      await userEvent.click(screen.getByLabelText(/Recurring booking/i));
      await userEvent.click(screen.getByRole('button', { name: /Send 4 Invitations/i }));
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledTimes(4);
        mockedAxios.post.mock.calls.forEach(call =>
          expect((call[1] as any).appointment.status).toBe('pending')
        );
      });
    });

    it('patches existing + posts follow-ons when editing with recurring', async () => {
      const appt = { id: 5, date: '2026-06-01T10:00:00Z', duration: 60, location: 'Sydney', notes: '' };
      renderForm({ appointment: appt as any });
      await userEvent.click(screen.getByLabelText(/Recurring booking/i));
      await userEvent.click(screen.getByRole('button', { name: /Save \+ Add 3 More/i }));
      await waitFor(() => {
        expect(mockedAxios.patch).toHaveBeenCalledWith('/appointments/5', expect.any(Object));
        expect(mockedAxios.post).toHaveBeenCalledTimes(3);
      });
    });

    it('shows "invitations will be sent" preview text for recurring invitations', async () => {
      renderForm({ isPending: true });
      await userEvent.click(screen.getByLabelText(/Recurring booking/i));
      expect(screen.getByText(/invitations will be sent/i)).toBeInTheDocument();
    });
  });
});
