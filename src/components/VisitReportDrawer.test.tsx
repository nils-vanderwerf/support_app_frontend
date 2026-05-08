import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VisitReportDrawer from './VisitReportDrawer';
import axiosInstance from '../api/axiosConfig';

jest.mock('../api/axiosConfig');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const appointment = {
  id: 42,
  date: '2026-05-01T10:00:00Z',
  client_id: 7,
  client: { first_name: 'Jane', last_name: 'Doe' },
};

const renderDrawer = (open = true) =>
  render(
    <VisitReportDrawer appointment={appointment} open={open} onClose={jest.fn()} />
  );

afterEach(() => jest.clearAllMocks());

it('renders the drawer with client name and date when open', () => {
  renderDrawer();
  expect(screen.getByText('Visit Report')).toBeInTheDocument();
  expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
});

it('renders three text fields for activities, observations, and follow-up actions', () => {
  renderDrawer();
  expect(screen.getByLabelText('Activities')).toBeInTheDocument();
  expect(screen.getByLabelText('Observations')).toBeInTheDocument();
  expect(screen.getByLabelText('Follow-up actions')).toBeInTheDocument();
});

it('save button is disabled when all fields are empty', () => {
  renderDrawer();
  const saveBtn = screen.getByRole('button', { name: /Save Report/i });
  expect(saveBtn).toBeDisabled();
});

it('save button is enabled once a field has content', async () => {
  renderDrawer();
  await userEvent.type(screen.getByLabelText('Activities'), 'Assisted with mobility');
  const saveBtn = screen.getByRole('button', { name: /Save Report/i });
  expect(saveBtn).toBeEnabled();
});

it('populates fields with AI draft on "Generate draft" click', async () => {
  mockedAxios.post.mockResolvedValueOnce({
    data: {
      activities: 'Helped with cooking',
      observations: 'Client seemed well',
      follow_up_actions: 'Follow up next week',
    },
  });
  renderDrawer();
  await userEvent.click(screen.getByRole('button', { name: /Generate draft/i }));
  await waitFor(() => {
    expect(screen.getByLabelText('Activities')).toHaveValue('Helped with cooking');
    expect(screen.getByLabelText('Observations')).toHaveValue('Client seemed well');
    expect(screen.getByLabelText('Follow-up actions')).toHaveValue('Follow up next week');
  });
  expect(mockedAxios.post).toHaveBeenCalledWith('/visit_reports/draft', { appointment_id: 42 });
});

it('shows error alert when draft generation fails', async () => {
  mockedAxios.post.mockRejectedValueOnce(new Error('Server error'));
  renderDrawer();
  await userEvent.click(screen.getByRole('button', { name: /Generate draft/i }));
  await waitFor(() => expect(screen.getByText(/Could not generate draft/i)).toBeInTheDocument());
});

it('shows success message after saving the report', async () => {
  mockedAxios.post
    .mockResolvedValueOnce({ data: {} }); // save
  renderDrawer();
  await userEvent.type(screen.getByLabelText('Activities'), 'Assisted with exercises');
  await userEvent.click(screen.getByRole('button', { name: /Save Report/i }));
  await waitFor(() => expect(screen.getByText(/Report saved successfully/i)).toBeInTheDocument());
  expect(mockedAxios.post).toHaveBeenCalledWith(
    '/visit_reports',
    expect.objectContaining({ appointment_id: 42, client_id: 7 }),
  );
});

it('shows error alert when save fails', async () => {
  mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
  renderDrawer();
  await userEvent.type(screen.getByLabelText('Activities'), 'Some activity');
  await userEvent.click(screen.getByRole('button', { name: /Save Report/i }));
  await waitFor(() => expect(screen.getByText(/Could not save report/i)).toBeInTheDocument());
});

it('does not render content when closed', () => {
  renderDrawer(false);
  expect(screen.queryByText('Activities')).not.toBeInTheDocument();
});
