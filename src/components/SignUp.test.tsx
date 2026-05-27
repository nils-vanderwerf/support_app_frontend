import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import SignUp from './SignUp';
import axiosInstance from '../api/axiosConfig';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../api/axiosConfig');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => ({
    setUser: jest.fn(),
    setClient: jest.fn(),
    setSupportWorker: jest.fn(),
  }),
}));

jest.mock('./LocationAutocomplete', () => ({
  __esModule: true,
  default: ({ onChange, label = 'Location' }: any) => (
    <input aria-label={label} onChange={e => onChange(e.target.value)} />
  ),
}));

jest.mock('./InstitutionAutocomplete', () => ({
  __esModule: true,
  default: ({ onChange }: any) => (
    <input aria-label="Institution" onChange={e => onChange(e.target.value)} />
  ),
}));

jest.mock('./DateOfBirthPicker', () => ({
  __esModule: true,
  default: ({ onChange }: any) => (
    <input aria-label="Date of Birth" type="date" onChange={e => onChange(e.target.value)} />
  ),
}));

jest.mock('./AvailabilitySelector', () => ({
  __esModule: true,
  default: () => <div>Available Days</div>,
}));

jest.mock('./ChipSelector', () => ({
  __esModule: true,
  default: ({ label }: any) => <input aria-label={label} />,
}));

describe('SignUp', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: { csrf_token: 'test-token' } });
    render(<SignUp />);
  });

  afterEach(() => { jest.clearAllMocks(); });

  it('renders step 1 account fields', () => {
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
  });

  describe('step 2 - role selection', () => {
    beforeEach(async () => {
      userEvent.click(screen.getByRole('button', { name: /Next/i }));
      await waitFor(() => { screen.getByRole('heading', { name: 'Client' }); });
    });

    it('shows role selection cards', () => {
      expect(screen.getByRole('heading', { name: 'Client' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Support Worker' })).toBeInTheDocument();
    });

    it('navigates back to step 1', async () => {
      userEvent.click(screen.getByRole('button', { name: /Back/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      });
    });
  });

  describe('step 3 - client form', () => {
    beforeEach(async () => {
      userEvent.click(screen.getByRole('button', { name: /Next/i }));
      await waitFor(() => { screen.getByRole('heading', { name: 'Client' }); });
      userEvent.click(screen.getByRole('heading', { name: 'Client' }));
      await waitFor(() => { screen.getByLabelText(/Health Conditions/i); });
    });

    it('shows client-specific fields', () => {
      expect(screen.getByLabelText(/Health Conditions/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Medication/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Allergies/i)).toBeInTheDocument();
    });

    it('submits successfully and navigates home', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: { user: { id: 1 }, client: { id: 1 }, support_worker: null } });

      userEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/users', expect.any(Object), expect.any(Object));
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('shows errors on failed submission', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { errors: 'Email has already been taken' } },
      });
      userEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
      await waitFor(() => {
        expect(screen.getByText(/Email has already been taken/i)).toBeInTheDocument();
      });
    });
  });

  describe('step 3 - support worker form', () => {
    beforeEach(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Next/i }));
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Support Worker' })).toBeInTheDocument());
      await userEvent.click(screen.getByRole('heading', { name: 'Support Worker' }));
      await waitFor(() => expect(screen.getByText(/Available Days/i)).toBeInTheDocument());
    });

    it('shows support worker-specific fields including compliance checks', () => {
      expect(screen.getByText(/Available Days/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Years of experience/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Police Check Reference Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Police Check Expiry/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/WWCC State/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/WWCC Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/WWCC Expiry/i)).toBeInTheDocument();
    });

    it('shows state-specific WWCC hint after selecting a state', async () => {
      await userEvent.click(screen.getByLabelText(/WWCC State/i));
      await userEvent.click(screen.getByText('NSW'));
      expect(screen.getByText(/WWC1234567A/)).toBeInTheDocument();
    });

    it('includes compliance check fields in the signup payload', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: { user: { id: 1 }, client: null, support_worker: { id: 1 } } });

      await userEvent.type(screen.getByLabelText(/Police Check Reference Number/i), 'ABC1234567');
      await userEvent.click(screen.getByLabelText(/WWCC State/i));
      await userEvent.click(screen.getByText('NSW'));
      await userEvent.type(screen.getByLabelText(/WWCC Number/i), 'WWC1234567A');

      userEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/users',
          expect.objectContaining({
            support_worker: expect.objectContaining({
              police_check_number: 'ABC1234567',
              wwcc_state: 'nsw',
              wwcc_number: 'WWC1234567A',
            }),
          }),
          expect.any(Object),
        );
      });
    });

    it('submits successfully and navigates home', async () => {
      mockedAxios.post
        .mockResolvedValueOnce({ data: {} })
        .mockResolvedValueOnce({ data: { user: { id: 1 }, client: null, support_worker: { id: 1 } } });

      userEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/users', expect.any(Object), expect.any(Object));
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });
});
