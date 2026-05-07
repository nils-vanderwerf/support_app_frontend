import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingAgent from './BookingAgent';
import axiosInstance from '../api/axiosConfig';

jest.mock('../api/axiosConfig');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

const mockOnClose = jest.fn();
const mockOnBooked = jest.fn();

const renderComponent = (isClient = true) =>
  render(<BookingAgent open onClose={mockOnClose} onBooked={mockOnBooked} isClient={isClient} />);

describe('BookingAgent', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows client welcome message when isClient is true', () => {
    renderComponent(true);
    expect(screen.getByText(/kind of support you're looking for/i)).toBeInTheDocument();
  });

  it('shows support worker welcome message when isClient is false', () => {
    renderComponent(false);
    expect(screen.getByText(/what kind of client you'd like to work with/i)).toBeInTheDocument();
  });

  it('renders the text input field', () => {
    renderComponent();
    expect(screen.getByPlaceholderText(/Describe what you need/i)).toBeInTheDocument();
  });

  const getSendButton = () => screen.getByTestId('SendIcon').closest('button') as HTMLElement;

  it('sends a message and shows agent reply', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'I found Olivia Williams for you!', conversation_id: null } });
    renderComponent();
    await userEvent.type(screen.getByPlaceholderText(/Describe what you need/i), 'I need elderly care support');
    await userEvent.click(getSendButton());
    await waitFor(() => expect(screen.getByText('I found Olivia Williams for you!')).toBeInTheDocument());
  });

  it('posts message history and timezone to /ai_booking/chat', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Great!', conversation_id: null } });
    renderComponent();
    await userEvent.type(screen.getByPlaceholderText(/Describe what you need/i), 'Hello');
    await userEvent.click(getSendButton());
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/ai_booking/chat',
        expect.objectContaining({
          messages: expect.any(Array),
          timezone: expect.any(String),
        })
      );
    });
  });

  it('calls onBooked with conversation_id when agent returns one', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Booking created!', conversation_id: 42 } });
    renderComponent();
    await userEvent.type(screen.getByPlaceholderText(/Describe what you need/i), 'Book Olivia');
    await userEvent.click(getSendButton());
    await waitFor(() => expect(mockOnBooked).toHaveBeenCalledWith(42));
  });

  it('shows error message when API call fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
    renderComponent();
    await userEvent.type(screen.getByPlaceholderText(/Describe what you need/i), 'Hello');
    await userEvent.click(getSendButton());
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
  });

  it('disables send button when input is empty', () => {
    renderComponent();
    expect(getSendButton()).toBeDisabled();
  });

  it('calls onClose when the close button is clicked', async () => {
    renderComponent();
    await userEvent.click(screen.getByTestId('CloseIcon').closest('button')!);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
