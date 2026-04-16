import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ClientList from './ClientList';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import * as geoDistance from '../utils/geoDistance';

jest.mock('../api/axiosConfig');
jest.mock('../context/AuthContext');
jest.mock('../utils/geoDistance');
jest.mock('./BookingAgent', () => () => <div data-testid="booking-agent" />);
// Mock LocationAutocomplete so we can trigger onCoordinates directly
jest.mock('./LocationAutocomplete', () => ({
  __esModule: true,
  default: ({ onChange, onCoordinates, value, label }: any) => (
    <div>
      <input
        aria-label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <button
        data-testid="mock-coords-trigger"
        onClick={() => onCoordinates && onCoordinates({ lat: -33.87, lng: 151.21 })}
      >
        set coords
      </button>
      <button
        data-testid="mock-coords-null"
        onClick={() => onCoordinates && onCoordinates(null)}
      >
        clear coords
      </button>
    </div>
  ),
}));

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedGeocode = geoDistance.geocodeAddress as jest.MockedFunction<typeof geoDistance.geocodeAddress>;
const mockedHaversine = geoDistance.haversineDistance as jest.MockedFunction<typeof geoDistance.haversineDistance>;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));
import { useNavigate } from 'react-router-dom';
const mockedUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;
const mockNavigate = jest.fn();

const clients = [
  { id: 1, first_name: 'Jane', last_name: 'Doe', location: 'Sydney', phone: '0400000001', health_conditions: 'autism' },
  { id: 2, first_name: 'Tom', last_name: 'Smith', location: 'Melbourne', phone: '0400000002', health_conditions: 'dementia' },
  { id: 3, first_name: 'Alice', last_name: 'Brown', location: 'Brisbane', phone: '0400000003', health_conditions: '' },
];

const renderComponent = () =>
  render(
    <MemoryRouter>
      <ClientList />
    </MemoryRouter>
  );

describe('ClientList', () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({ supportWorker: { id: 10 }, client: null } as any);
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockedAxios.get.mockResolvedValue({ data: clients });
    mockedGeocode.mockResolvedValue({ lat: -33.87, lng: 151.21 });
    mockedHaversine.mockReturnValue(10);
  });

  afterEach(() => jest.clearAllMocks());

  it('fetches and renders all clients', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
    expect(screen.getByText('Tom Smith')).toBeInTheDocument();
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
  });

  it('shows client count', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/3 of 3 clients/i)).toBeInTheDocument());
  });

  it('filters by name', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.type(screen.getByLabelText(/search by name/i), 'Jane');
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.queryByText('Tom Smith')).not.toBeInTheDocument();
  });

  it('filters by health condition', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.type(screen.getByLabelText(/care needs/i), 'autism');
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.queryByText('Tom Smith')).not.toBeInTheDocument();
  });

  it('shows filter count badge when filters are active', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.type(screen.getByLabelText(/search by name/i), 'Jane');
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows "Clear all" button when filters are active', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.type(screen.getByLabelText(/search by name/i), 'Jane');
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  it('"Clear all" resets filters and shows all clients', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.type(screen.getByLabelText(/search by name/i), 'Jane');
    await userEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(screen.getByText('Tom Smith')).toBeInTheDocument();
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
  });

  it('shows "No clients match your filters" when nothing matches', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.type(screen.getByLabelText(/search by name/i), 'zzznomatch');
    expect(screen.getByText(/no clients match your filters/i)).toBeInTheDocument();
  });

  it('navigates to client profile on row click', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.click(screen.getByText('Jane Doe'));
    expect(mockNavigate).toHaveBeenCalledWith('/clients/1');
  });

  it('filters by location using onCoordinates callback', async () => {
    mockedHaversine
      .mockReturnValueOnce(5)   // Jane is within radius
      .mockReturnValueOnce(200) // Tom is outside radius
      .mockReturnValueOnce(5);  // Alice is within radius
    mockedGeocode.mockResolvedValue({ lat: -33.87, lng: 151.21 });

    renderComponent();
    await waitFor(() => screen.getByText('Jane Doe'));

    // Trigger location input to start geocoding client positions
    await userEvent.type(screen.getByLabelText(/near location/i), 'Sydney');

    // Trigger onCoordinates from the mocked LocationAutocomplete
    await act(async () => {
      screen.getByTestId('mock-coords-trigger').click();
    });

    // Give geocoding of client positions time to settle
    await waitFor(() => {
      expect(mockedGeocode).toHaveBeenCalled();
    });
  });
});
