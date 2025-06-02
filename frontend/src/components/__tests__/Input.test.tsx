import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../ui/input';
test('Input updates value on change', () => {
  render(<Input placeholder='Type here' />);
  const input = screen.getByPlaceholderText('Type here');
  fireEvent.change(input, { target: { value: 'Hello' } });
  expect(input.value).toBe('Hello');
});
