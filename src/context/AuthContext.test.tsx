import { waitFor, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import axiosInstance from '../api/axiosConfig';

jest.mock('../api/axiosConfig');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const mockUser = {
  id: 1, email: 'test@test.com', first_name: 'Jane',
  last_name: 'Doe', middle_name: null, role: null
};
const mockClient = {
  id: 1, first_name: 'Jane', last_name: 'Doe', middle_name: null,
  age: 30, gender: 'Female', phone: '0400000000', location: 'Sydney',
  bio: 'Test', health_conditions: '', medication: '', allergies: '',
  emergency_contact_first_name: '', emergency_contact_last_name: '',
  emergency_contact_phone: '', email: 'test@test.com'
};
const mockSupportWorker = {
  id: 1, first_name: 'John', last_name: 'Smith', middle_name: null,
  age: 30, availability: 'Weekdays', bio: 'Test', email: 'john@test.com',
  experience: '5 years', location: 'Melbourne', gender: 'Male', phone: '0400000000'
};

describe('AuthProvider', () => {
  afterEach(() => { jest.clearAllMocks(); });

  it('sets user and client when session returns a client', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { user: mockUser, client: mockClient, support_worker: null }
    });

     const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => {
      expect(result.current.user?.email).toBe('test@test.com')
      expect(result.current.client).not.toBeNull()
      expect(result.current.supportWorker).toBeNull()
      expect(result.current.loading).toBe(false)
    });
  });

  it('sets user and support worker when session returns a support worker', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { user: mockUser, client: null, support_worker: mockSupportWorker }
    });

     const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => {
      expect(result.current.user?.email).toBe('test@test.com')
      expect(result.current.client).toBeNull()
      expect(result.current.supportWorker).not.toBeNull()
      expect(result.current.loading).toBe(false)
    });
  });

  it('sets loading to false and leaves user null when fetch fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => {
      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
    });
  });
});
