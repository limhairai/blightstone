import { render, screen } from '@testing-library/react';
import { NotificationProvider } from '../NotificationContext';
test('NotificationProvider renders children', () => {
  render(<NotificationProvider><div>Notification Child</div></NotificationProvider>);
  expect(screen.getByText('Notification Child')).toBeInTheDocument();
});
