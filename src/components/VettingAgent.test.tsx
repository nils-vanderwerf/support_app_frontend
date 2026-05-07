import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VettingAgent from './VettingAgent';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../api/axiosConfig', () => ({
  post: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockAxiosPost = axiosInstance.post as jest.Mock;

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('VettingAgent', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      supportWorker: { first_name: 'Alex', status: 'pending' },
    });
  });

  it('renders the compliance vetting header', () => {
    render(<VettingAgent />);
    expect(screen.getByText('Compliance Vetting')).toBeInTheDocument();
  });

  it('opens with a greeting that asks for the police check number', () => {
    render(<VettingAgent />);
    expect(screen.getByText(/Police Check reference number/i)).toBeInTheDocument();
  });

  it('sends user message and displays reply', async () => {
    mockAxiosPost.mockResolvedValueOnce({
      data: { reply: 'Thanks! Now your WWCC number.', complete: false },
    });
    render(<VettingAgent />);

    const input = screen.getByPlaceholderText(/Type your response/i);
    await userEvent.type(input, 'ABC123456');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('ABC123456')).toBeInTheDocument();
      expect(screen.getByText('Thanks! Now your WWCC number.')).toBeInTheDocument();
    });
  });

  it('shows completion state and hides input when vetting is complete', async () => {
    mockAxiosPost.mockResolvedValueOnce({
      data: { reply: 'All done!', complete: true, recommendation: 'approved' },
    });
    render(<VettingAgent />);

    const input = screen.getByPlaceholderText(/Type your response/i);
    await userEvent.type(input, 'WWC7654321');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/details have been submitted and look great/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText(/Type your response/i)).not.toBeInTheDocument();
  });

  it('shows needs_review message when recommendation is needs_review', async () => {
    mockAxiosPost.mockResolvedValueOnce({
      data: { reply: 'Submitted.', complete: true, recommendation: 'needs_review' },
    });
    render(<VettingAgent />);

    await userEvent.type(screen.getByPlaceholderText(/Type your response/i), 'abc');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/submitted for manual review/i)).toBeInTheDocument();
    });
  });
});
