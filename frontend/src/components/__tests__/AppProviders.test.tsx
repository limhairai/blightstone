import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppProviders from '@/app/AppProviders';
test('AppProviders renders children', () => {
  render(<AppProviders><div>Test Child</div></AppProviders>);
  expect(screen.getByText('Test Child')).toBeInTheDocument();
});
