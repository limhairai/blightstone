import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginView } from '../../auth/login-view';

// Mock the useAuth hook
const mockUseAuth = {
  signIn: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithMagicLink: jest.fn(),
  loading: false,
  error: null,
  user: null,
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('LoginView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.signIn.mockClear();
    mockUseAuth.loading = false;
    mockUseAuth.error = null;
  });

  it('renders login view correctly', () => {
    render(<LoginView />);
    
    // Check for the heading text instead of the button
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    
    // Check for the form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    
    // Check for the submit button specifically
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({ success: true });
    mockUseAuth.signIn = mockSignIn;
    
    render(<LoginView />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state', () => {
    mockUseAuth.loading = true;
    
    render(<LoginView />);
    
    const allButtons = screen.getAllByRole('button', { name: /signing in/i });
    
    // Check that all buttons are disabled when loading
    allButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('displays error message when login fails', async () => {
    const errorMessage = 'Invalid credentials';
    
    // Mock the signIn function to throw an error
    mockUseAuth.signIn.mockRejectedValue(new Error(errorMessage));
    
    render(<LoginView />);
    
    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText(/you@company.com/i), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form to trigger the error
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Wait for the error to appear in the DOM
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
}); 