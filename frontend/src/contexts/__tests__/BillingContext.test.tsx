import { render, screen } from '@testing-library/react';
import { BillingProvider } from '../BillingContext';
test('BillingProvider renders children', () => {
  render(<BillingProvider><div>Billing Child</div></BillingProvider>);
  expect(screen.getByText('Billing Child')).toBeInTheDocument();
});
