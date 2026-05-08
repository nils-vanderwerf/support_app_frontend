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

const mockSupportWorkerUser = {
  role: "support_worker",
  support_worker: {
    first_name: "John",
    middle_name: "William",
    last_name: "Smith",
    age: '30',
    gender: 'Male',
    phone: '0418200000',
    location: "Sydney",
    emergency_contact_first_name: "Bob",
    emergency_contact_last_name: "Brown",
    emergency_contact_phone: "0411111111",
    availability: "Tuesday, Wednesday, Thursday",
    bio: "Test Bio",
  },
  user: {
    email: "john.william.smith@gmail.com",
    password: "password123",
    first_name: "John",
    last_name: "Smith",
    middle_name: "William"
  }
};

const mockClientUser = {
  client: {
    age: "23",
    gender: "Male",
    phone: "",
    location: "Glebe",
    bio: "some more test",
    health_conditions: "Asthma",
    medication: "Asthma Puffer",
    allergies: "Pollen",
    emergency_contact_first_name: "Lyon",
    emergency_contact_last_name: "Jones",
    emergency_contact_phone: "0412345678",
    first_name: "William",
    last_name: "Brown",
    middle_name: "Liam",
    email: "william.brown@gmail.com"
  },
  role: "client",
  user: {
    email: "william.brown@gmail.com",
    password: "password123",
    first_name: "William",
    last_name: "Brown",
    middle_name: "Liam"
  }
};

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

    it('shows support worker-specific fields', () => {
      expect(screen.getByText(/Available Days/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Experience/i)).toBeInTheDocument();
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
