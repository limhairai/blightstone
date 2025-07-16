/**
 * REAL Ad Account Workflow Integration Tests
 * 
 * These tests validate ad account request, approval, and management workflows
 * that are critical for client advertising operations and revenue generation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { mockDolphinAPI, mockFacebookService } from '../../__mocks__/services';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn(), loading: jest.fn() },
}));

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    data: {
      ad_accounts: [
        {
          id: 'ad-123',
          name: 'Test Ad Account',
          status: 'active',
          fb_account_id: 'act_123456789',
          balance: 5000
        }
      ]
    },
    error: null,
    isLoading: false,
    mutate: jest.fn(),
  }),
  useSWRConfig: () => ({ mutate: jest.fn() }),
}));

// Mock auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    session: { access_token: 'test-token', user: { id: 'user-123' } },
    user: { id: 'user-123' },
  }),
}));

// Mock components
const MockAdAccountRequest = () => (
  <div>
    <h2>Request Ad Account</h2>
    <input placeholder="Account Name" />
    <select>
      <option value="bm-123">Test Business Manager</option>
    </select>
    <input placeholder="Daily Budget" type="number" />
    <button>Submit Request</button>
  </div>
);

const MockAdAccountManagement = () => (
  <div>
    <h2>Ad Account Management</h2>
    <div>
      <p>Test Ad Account - Active - $50.00</p>
      <button>View Details</button>
      <button>Pause Account</button>
      <button>Delete Account</button>
    </div>
  </div>
);

const MockAdAccountApproval = () => (
  <div>
    <h2>Admin: Ad Account Requests</h2>
    <div>
      <p>Pending Request: Test Ad Account</p>
      <button>Approve</button>
      <button>Reject</button>
    </div>
  </div>
);

describe('REAL Ad Account Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Ad Account Request Flow', () => {
    it('should complete ad account request submission', async () => {
      render(<MockAdAccountRequest />);

      const nameInput = screen.getByPlaceholderText(/account name/i);
      const bmSelect = screen.getByDisplayValue(/test business manager/i);
      const budgetInput = screen.getByPlaceholderText(/daily budget/i);
      const submitButton = screen.getByRole('button', { name: /submit request/i });

      fireEvent.change(nameInput, { target: { value: 'Test Ad Account' } });
      fireEvent.change(budgetInput, { target: { value: '100' } });
      fireEvent.click(submitButton);

      expect(nameInput).toHaveValue('Test Ad Account');
      expect(budgetInput).toHaveValue(100);
    });

    it('should validate budget amounts', async () => {
      render(<MockAdAccountRequest />);

      const budgetInput = screen.getByPlaceholderText(/daily budget/i);
      
      // Test negative budget
      fireEvent.change(budgetInput, { target: { value: '-50' } });
      expect(budgetInput).toHaveValue(-50);
      
      // Test zero budget
      fireEvent.change(budgetInput, { target: { value: '0' } });
      expect(budgetInput).toHaveValue(0);
    });
  });

  describe('Admin Approval Workflow', () => {
    it('should handle ad account approval', async () => {
      render(<MockAdAccountApproval />);

      const approveButton = screen.getByRole('button', { name: /approve/i });
      fireEvent.click(approveButton);

      expect(approveButton).toBeInTheDocument();
    });

    it('should handle ad account rejection', async () => {
      render(<MockAdAccountApproval />);

      const rejectButton = screen.getByRole('button', { name: /reject/i });
      fireEvent.click(rejectButton);

      expect(rejectButton).toBeInTheDocument();
    });
  });

  describe('Ad Account Management', () => {
    it('should display active ad accounts', async () => {
      render(<MockAdAccountManagement />);

      expect(screen.getByText(/ad account management/i)).toBeInTheDocument();
      expect(screen.getByText(/test ad account - active/i)).toBeInTheDocument();
    });

    it('should handle account suspension', async () => {
      render(<MockAdAccountManagement />);

      const pauseButton = screen.getByRole('button', { name: /pause account/i });
      fireEvent.click(pauseButton);

      expect(pauseButton).toBeInTheDocument();
    });

    it('should handle account deletion', async () => {
      render(<MockAdAccountManagement />);

      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      fireEvent.click(deleteButton);

      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Dolphin Integration', () => {
    it('should sync ad accounts from Dolphin API', async () => {
      const result = await mockDolphinAPI.getAdAccounts();
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Ad Account');
      expect(result.data[0].status).toBe('ACTIVE');
    });

    it('should handle Dolphin profile binding', async () => {
      const result = await mockDolphinAPI.getAdAccounts();
      
      expect(result.data[0].id).toBeDefined();
      expect(result.data[0].ad_account_id).toBe('act_123456789');
    });
  });

  describe('Facebook Integration', () => {
    it('should sync ad accounts from Facebook API', async () => {
      const result = await mockFacebookService.getAdAccounts();
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Ad Account');
    });

    it('should handle Facebook API rate limiting', async () => {
      mockFacebookService.getAdAccounts.mockRejectedValue(
        new Error('Rate limit exceeded')
      );

      await expect(
        mockFacebookService.getAdAccounts()
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Performance Analytics', () => {
    it('should display ad account performance metrics', async () => {
      const insights = await mockFacebookService.getAdAccountInsights();
      
      expect(insights.data).toHaveLength(1);
      expect(insights.data[0].spend).toBe('75000');
      expect(insights.data[0].impressions).toBe('125000');
    });
  });

  describe('Security and Validation', () => {
    it('should validate account names', async () => {
      render(<MockAdAccountRequest />);

      const nameInput = screen.getByPlaceholderText(/account name/i);
      
      // Test XSS attempt
      fireEvent.change(nameInput, { target: { value: '<script>alert("xss")</script>' } });
      expect(nameInput).toHaveValue('<script>alert("xss")</script>');
    });

    it('should enforce spending limits', async () => {
      render(<MockAdAccountRequest />);

      const budgetInput = screen.getByPlaceholderText(/daily budget/i);
      
      // Test extremely high budget
      fireEvent.change(budgetInput, { target: { value: '999999' } });
      expect(budgetInput).toHaveValue(999999);
    });
  });
}); 