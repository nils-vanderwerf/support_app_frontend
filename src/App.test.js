import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Smoke test — verifies the app mounts without crashing and reaches the login screen
test('renders login page for unauthenticated users', async () => {
  render(<App />);
  // AuthContext checks /user on mount; the mock returns no user, so the
  // app should settle on the login page
  await waitFor(() => {
    expect(screen.getByText(/log in to your account/i)).toBeInTheDocument();
  });
});
