import { render, screen } from '@testing-library/react';
import { Button } from '../ui/button';
test('Button renders with text', () => {
  render(<Button>Click Me</Button>);
  expect(screen.getByText('Click Me')).toBeInTheDocument();
});
