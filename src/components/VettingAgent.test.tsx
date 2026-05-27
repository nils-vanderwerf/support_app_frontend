import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VettingAgent from './VettingAgent';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../api/axiosConfig', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockAxiosGet = axiosInstance.get as jest.Mock;
const mockAxiosPost = axiosInstance.post as jest.Mock;

const mockSetSupportWorker = jest.fn();

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    supportWorker: { first_name: 'Alex', status: 'pending' },
    setSupportWorker: mockSetSupportWorker,
  });
  // First call: /vetting/status — no waiting period
  mockAxiosGet.mockResolvedValue({ data: {} });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('VettingAgent', () => {
  it('renders the compliance vetting header', async () => {
    render(<VettingAgent />);
    await waitFor(() => {
      expect(screen.getByText('Compliance Vetting')).toBeInTheDocument();
    });
  });

  it('renders Police Check and WWCC form sections', async () => {
    render(<VettingAgent />);
    await waitFor(() => {
      expect(screen.getByText('Police Check (ACIC)')).toBeInTheDocument();
      expect(screen.getByText('Working With Children Check (WWCC)')).toBeInTheDocument();
    });
  });

  it('greets the support worker by first name', async () => {
    render(<VettingAgent />);
    await waitFor(() => {
      expect(screen.getByText(/Hi Alex/)).toBeInTheDocument();
    });
  });

  it('shows a format error for an invalid police check number on blur', async () => {
    render(<VettingAgent />);
    await waitFor(() => screen.getByLabelText(/Reference Number/i));
    const input = screen.getByLabelText(/Reference Number/i);
    await userEvent.type(input, 'SHORT');
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.getByText(/Must be exactly 10 alphanumeric/i)).toBeInTheDocument();
    });
  });

  it('accepts a valid 10-character police check number without error', async () => {
    render(<VettingAgent />);
    await waitFor(() => screen.getByLabelText(/Reference Number/i));
    const input = screen.getByLabelText(/Reference Number/i);
    await userEvent.type(input, 'ABC1234567');
    fireEvent.blur(input);
    await waitFor(() => {
      expect(screen.queryByText(/Must be exactly/i)).not.toBeInTheDocument();
    });
  });

  it('shows state-specific format hint after selecting NSW', async () => {
    render(<VettingAgent />);
    await waitFor(() => screen.getByLabelText(/State \/ Territory/i));
    await userEvent.click(screen.getByLabelText(/State \/ Territory/i));
    await userEvent.click(screen.getByText('NSW'));
    expect(screen.getByText(/WWC1234567A/)).toBeInTheDocument();
  });

  it('shows a format error for an invalid NSW WWCC number', async () => {
    render(<VettingAgent />);
    await waitFor(() => screen.getByLabelText(/State \/ Territory/i));
    await userEvent.click(screen.getByLabelText(/State \/ Territory/i));
    await userEvent.click(screen.getByText('NSW'));
    const wwccInput = screen.getByLabelText(/WWCC Number/i);
    await userEvent.type(wwccInput, 'BADFORMAT');
    fireEvent.blur(wwccInput);
    await waitFor(() => {
      expect(screen.getByText(/Invalid format for NSW/i)).toBeInTheDocument();
    });
  });

  it('accepts a valid QLD WWCC number (numeric only)', async () => {
    render(<VettingAgent />);
    await waitFor(() => screen.getByLabelText(/State \/ Territory/i));
    await userEvent.click(screen.getByLabelText(/State \/ Territory/i));
    await userEvent.click(screen.getByText('QLD'));
    const wwccInput = screen.getByLabelText(/WWCC Number/i);
    await userEvent.type(wwccInput, '1234567');
    fireEvent.blur(wwccInput);
    await waitFor(() => {
      expect(screen.queryByText(/Invalid format/i)).not.toBeInTheDocument();
    });
  });

  it('shows Required errors when submitting an empty form', async () => {
    render(<VettingAgent />);
    await waitFor(() => screen.getByRole('button', { name: /Submit for Review/i }));
    await userEvent.click(screen.getByRole('button', { name: /Submit for Review/i }));
    const requiredErrors = await screen.findAllByText('Required');
    expect(requiredErrors.length).toBeGreaterThan(0);
  });

  it('refreshes auth state and navigates on auto-approval', async () => {
    mockAxiosPost.mockResolvedValueOnce({ data: { recommendation: 'approved' } });
    // Second get: /user refresh after submission
    mockAxiosGet
      .mockResolvedValueOnce({ data: {} }) // /vetting/status
      .mockResolvedValueOnce({ data: { support_worker: { status: 'approved' } } }); // /user refresh

    render(<VettingAgent />);
    await waitFor(() => screen.getByLabelText(/Reference Number/i));

    await userEvent.type(screen.getByLabelText(/Reference Number/i), 'ABC1234567');
    const expiryInputs = screen.getAllByLabelText(/Expiry Date/i);
    fireEvent.change(expiryInputs[0], { target: { value: '2099-12-31' } });

    await userEvent.click(screen.getByLabelText(/State \/ Territory/i));
    await userEvent.click(screen.getByText('NSW'));
    await userEvent.type(screen.getByLabelText(/WWCC Number/i), 'WWC1234567A');
    fireEvent.change(expiryInputs[1], { target: { value: '2099-12-31' } });

    await userEvent.click(screen.getByRole('button', { name: /Submit for Review/i }));

    await waitFor(() => {
      expect(mockSetSupportWorker).toHaveBeenCalledWith({ status: 'approved' });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows manual review fallback when status stays pending', async () => {
    mockAxiosPost.mockResolvedValueOnce({ data: { recommendation: 'needs_review' } });
    mockAxiosGet
      .mockResolvedValueOnce({ data: {} }) // /vetting/status
      .mockResolvedValueOnce({ data: { support_worker: { status: 'pending' } } }); // /user refresh

    render(<VettingAgent />);
    await waitFor(() => screen.getByLabelText(/Reference Number/i));

    await userEvent.type(screen.getByLabelText(/Reference Number/i), 'ABC1234567');
    const expiryInputs = screen.getAllByLabelText(/Expiry Date/i);
    fireEvent.change(expiryInputs[0], { target: { value: '2099-12-31' } });
    await userEvent.click(screen.getByLabelText(/State \/ Territory/i));
    await userEvent.click(screen.getByText('NSW'));
    await userEvent.type(screen.getByLabelText(/WWCC Number/i), 'WWC1234567A');
    fireEvent.change(expiryInputs[1], { target: { value: '2099-12-31' } });

    await userEvent.click(screen.getByRole('button', { name: /Submit for Review/i }));

    await waitFor(() => {
      expect(screen.getByText(/manual review/i)).toBeInTheDocument();
    });
  });
});
