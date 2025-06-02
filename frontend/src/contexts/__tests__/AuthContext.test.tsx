import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../AuthContext';
test('AuthProvider renders children', () => {
  render(<AuthProvider><div>Auth Child</div></AuthProvider>);
  expect(screen.getByText('Auth Child')).toBeInTheDocument();
});
