import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ReportsPage from './ReportsPage';
import axiosInstance from '../api/axiosConfig';

jest.mock('../api/axiosConfig');
jest.mock('./VisitReportDrawer', () => ({
  __esModule: true,
  default: ({ open, existingReport }: { open: boolean; existingReport?: { id: number } }) =>
    open ? <div data-testid="visit-report-drawer">{existingReport ? `edit-${existingReport.id}` : 'new'}</div> : null,
}));
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const makeReport = (overrides: Record<string, any> = {}) => ({
  id: 1,
  date: '2026-04-10T10:00:00Z',
  activities: 'Assisted with meal preparation and light exercises.',
  observations: 'Client appeared well and engaged throughout.',
  follow_up_actions: 'Schedule follow-up in two weeks.',
  appointment: {
    id: 10,
    date: '2026-04-10T10:00:00Z',
    location: 'Surry Hills Community Centre',
    duration: 90,
    client: { id: 1, first_name: 'Elena', last_name: 'Martinez', date_of_birth: '1980-03-15' },
  },
  ...overrides,
});

const renderPage = () =>
  render(<MemoryRouter><ReportsPage /></MemoryRouter>);

describe('ReportsPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows empty state when no reports exist', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/No reports submitted yet/i)).toBeInTheDocument();
    });
  });

  it('renders a report row with client name and location', async () => {
    mockedAxios.get.mockResolvedValue({ data: [makeReport()] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Elena Martinez')).toBeInTheDocument();
      expect(screen.getByText('Surry Hills Community Centre')).toBeInTheDocument();
    });
  });

  it('shows activities preview in the row', async () => {
    mockedAxios.get.mockResolvedValue({ data: [makeReport()] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Assisted with meal preparation/i)).toBeInTheDocument();
    });
  });

  it('shows report count summary', async () => {
    mockedAxios.get.mockResolvedValue({ data: [makeReport(), makeReport({ id: 2 })] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/2 reports submitted/i)).toBeInTheDocument();
    });
  });

  it('uses singular "report" when count is 1', async () => {
    mockedAxios.get.mockResolvedValue({ data: [makeReport()] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/1 report submitted/i)).toBeInTheDocument();
    });
  });

  it('expands row to show full report details on click', async () => {
    mockedAxios.get.mockResolvedValue({ data: [makeReport()] });
    renderPage();
    await waitFor(() => screen.getByText('Elena Martinez'));
    await userEvent.click(screen.getByRole('button', { name: '' }));
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Observations')).toBeInTheDocument();
    expect(screen.getByText('Follow-up actions')).toBeInTheDocument();
    expect(screen.getByText(/Client appeared well/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule follow-up/i)).toBeInTheDocument();
  });

  it('collapses row again on second click', async () => {
    mockedAxios.get.mockResolvedValue({ data: [makeReport()] });
    renderPage();
    await waitFor(() => screen.getByText('Elena Martinez'));
    const btn = screen.getByRole('button', { name: '' });
    await userEvent.click(btn);
    await userEvent.click(btn);
    await waitFor(() => {
      expect(screen.queryByText('Observations')).not.toBeInTheDocument();
    });
  });

  describe('New Report button', () => {
    const pastAppointment = {
      id: 20,
      date: new Date(Date.now() - 7 * 86400000).toISOString(),
      location: 'Bondi Health Centre',
      duration: 60,
      client_id: 1,
      client: { id: 1, first_name: 'Elena', last_name: 'Martinez' },
    };

    it('renders the New Report button', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });
      renderPage();
      await waitFor(() => screen.getByText(/No reports submitted yet/i));
      expect(screen.getByRole('button', { name: /New Report/i })).toBeInTheDocument();
    });

    it('opens the appointment picker dialog on click', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [] })          // visit_reports
        .mockResolvedValueOnce({ data: [pastAppointment] }); // appointments
      renderPage();
      await waitFor(() => screen.getByText(/No reports submitted yet/i));
      await userEvent.click(screen.getByRole('button', { name: /New Report/i }));
      await waitFor(() => expect(screen.getByText(/Select a past appointment/i)).toBeInTheDocument());
    });

    it('lists past appointments in the picker', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [pastAppointment] });
      renderPage();
      await waitFor(() => screen.getByText(/No reports submitted yet/i));
      await userEvent.click(screen.getByRole('button', { name: /New Report/i }));
      await waitFor(() => expect(screen.getByText('Elena Martinez')).toBeInTheDocument());
      expect(screen.getByText(/Bondi Health Centre/i)).toBeInTheDocument();
    });

    it('disables picker rows that already have a report', async () => {
      const reportWithAppt = makeReport({ appointment: { ...makeReport().appointment, id: 20 } });
      mockedAxios.get
        .mockResolvedValueOnce({ data: [reportWithAppt] })
        .mockResolvedValueOnce({ data: [pastAppointment] });
      renderPage();
      await waitFor(() => screen.getByText('Elena Martinez'));
      await userEvent.click(screen.getByRole('button', { name: /New Report/i }));
      await waitFor(() => screen.getByText(/Report submitted/i));
    });

    it('opens VisitReportDrawer after selecting an appointment', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [pastAppointment] });
      renderPage();
      await waitFor(() => screen.getByText(/No reports submitted yet/i));
      await userEvent.click(screen.getByRole('button', { name: /New Report/i }));
      await waitFor(() => screen.getByText('Elena Martinez'));
      await userEvent.click(screen.getByText('Elena Martinez'));
      expect(screen.getByTestId('visit-report-drawer')).toHaveTextContent('new');
    });
  });

  describe('edit report', () => {
    it('shows Edit report button in expanded row', async () => {
      mockedAxios.get.mockResolvedValue({ data: [makeReport()] });
      renderPage();
      await waitFor(() => screen.getByText('Elena Martinez'));
      await userEvent.click(screen.getByRole('button', { name: '' }));
      expect(screen.getByRole('button', { name: /Edit report/i })).toBeInTheDocument();
    });

    it('opens VisitReportDrawer in edit mode when Edit report is clicked', async () => {
      mockedAxios.get.mockResolvedValue({ data: [makeReport()] });
      renderPage();
      await waitFor(() => screen.getByText('Elena Martinez'));
      await userEvent.click(screen.getByRole('button', { name: '' }));
      await userEvent.click(screen.getByRole('button', { name: /Edit report/i }));
      expect(screen.getByTestId('visit-report-drawer')).toHaveTextContent('edit-1');
    });
  });

  describe('client filter', () => {
    const twoClientReports = [
      makeReport({ id: 1 }),
      makeReport({
        id: 2,
        appointment: {
          id: 11,
          date: '2026-04-17T10:00:00Z',
          location: 'Fitzroy Community Hub',
          duration: 60,
          client: { id: 2, first_name: 'Raj', last_name: 'Patel', date_of_birth: '1975-07-22' },
        },
      }),
    ];

    it('populates the filter dropdown with unique client names', async () => {
      mockedAxios.get.mockResolvedValue({ data: twoClientReports });
      renderPage();
      await waitFor(() => screen.getByText('Raj Patel'));
      await userEvent.click(screen.getByRole('combobox'));
      expect(screen.getByRole('option', { name: /Elena Martinez/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Raj Patel/ })).toBeInTheDocument();
    });

    it('filters rows by selected client', async () => {
      mockedAxios.get.mockResolvedValue({ data: twoClientReports });
      renderPage();
      await waitFor(() => screen.getByText('Raj Patel'));
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(screen.getByRole('option', { name: /Elena Martinez/ }));
      const table = screen.getByRole('table');
      expect(within(table).getByText('Elena Martinez')).toBeInTheDocument();
      expect(within(table).queryByText('Raj Patel')).not.toBeInTheDocument();
    });

    it('shows no "no match" message when all clients filter is active', async () => {
      mockedAxios.get.mockResolvedValue({ data: [makeReport()] });
      renderPage();
      await waitFor(() => screen.getByText('Elena Martinez'));
      expect(screen.queryByText(/No reports match/i)).not.toBeInTheDocument();
    });

    it('restores all rows when "All clients" is selected', async () => {
      mockedAxios.get.mockResolvedValue({ data: twoClientReports });
      renderPage();
      await waitFor(() => screen.getByText('Raj Patel'));
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(screen.getByRole('option', { name: /Elena Martinez/ }));
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(screen.getByRole('option', { name: 'All clients' }));
      const table = screen.getByRole('table');
      expect(within(table).getByText('Elena Martinez')).toBeInTheDocument();
      expect(within(table).getByText('Raj Patel')).toBeInTheDocument();
    });
  });
});
