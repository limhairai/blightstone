import { render, screen } from '@testing-library/react';
import { UserProvider } from '../user-context';
test('UserProvider renders children', () => {
  render(<UserProvider><div>User Child</div></UserProvider>);
  expect(screen.getByText('User Child')).toBeInTheDocument();
});
