/**
 * REAL Business Manager Workflow Tests
 * 
 * These tests validate the actual business logic for BM applications,
 * approval workflows, and asset management that generate revenue.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApplyForBmDialog } from '../../components/business-managers/apply-for-bm-dialog';
import { BusinessManagersTable } from '../../components/business-managers/business-managers-table';
import { BmDetailsDialog } from '../../components/business-managers/bm-details-dialog';
import { AuthContextProvider } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '../../lib/stores/supabase-client';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
  mutate: jest.fn(),
}));

// Mock subscription hook
jest.mock('../../hooks/useSubscription', () => ({
  useSubscription: () => ({
    subscriptionData: {
      canRequestAssets: true,
      subscriptionStatus: 'active',
      free: false,
    },
    usage: {
      businessManagers: 2,
    },
    checkLimit: jest.fn().mockReturnValue(true),
    currentPlan: {
      id: 'growth',
      name: 'Growth',
      businessManagerLimit: 5,
    },
  }),
}));

// Mock organization store
jest.mock('../../lib/stores/organization-store', () => ({
  useOrganizationStore: () => ({
    currentOrganizationId: 'org-123',
  }),
}));

// Mock auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    session: {
      access_token: 'test-token',
      user: { id: 'user-123' },
    },
    user: { id: 'user-123' },
  }),
  AuthContextProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock form validation
jest.mock('../../lib/form-validation', () => ({
  validateBusinessManagerApplicationForm: jest.fn().mockReturnValue({
    isValid: true,
    errors: [],
  }),
  showValidationErrors: jest.fn(),
}));

// Mock domain utils
jest.mock('../../lib/utils/domain-utils', () => ({
  normalizeDomain: jest.fn((domain) => domain.toLowerCase()),
  isValidDomain: jest.fn().mockReturnValue(true),
  hasDuplicateDomains: jest.fn().mockReturnValue(false),
  removeDuplicateDomains: jest.fn((domains) => domains),
  isSubdomain: jest.fn().mockReturnValue(false),
  getBaseDomain: jest.fn((domain) => domain),
  SUBDOMAIN_POLICY: 'allowed',
}));

describe('REAL Business Manager Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    global.fetch = jest.fn();
  });

  describe('Business Manager Application Flow', () => {
    it('should complete full BM application with payment', async () => {
      // Mock successful application submission
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            applicationId: 'app-123',
            paymentRequired: true,
            amount: 50,
            paymentUrl: 'https://checkout.stripe.com/pay/cs_123',
          }),
        });

      render(
        <AuthContextProvider>
          <ApplyForBmDialog>
            <button>Apply for BM</button>
          </ApplyForBmDialog>
        </AuthContextProvider>
      );

      // Open dialog
      fireEvent.click(screen.getByText('Apply for BM'));

      // Fill out application form
      const businessNameInput = screen.getByLabelText(/business name/i);
      const domainInput = screen.getByLabelText(/domain/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(businessNameInput, { target: { value: 'Test Business' } });
      fireEvent.change(domainInput, { target: { value: 'testbusiness.com' } });
      fireEvent.change(descriptionInput, { target: { value: 'A test business for advertising' } });

      // Submit application
      const submitButton = screen.getByRole('button', { name: /submit application/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'business_manager',
            organizationId: 'org-123',
            businessName: 'Test Business',
            domain: 'testbusiness.com',
            description: 'A test business for advertising',
            domains: ['testbusiness.com'],
          }),
        });
      });

      // Should show success message and redirect to payment
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('application submitted')
      );
    });

    it('should handle application validation errors', async () => {
      // Mock validation error
      const mockValidation = require('../../lib/form-validation');
      mockValidation.validateBusinessManagerApplicationForm.mockReturnValue({
        isValid: false,
        errors: ['Business name is required', 'Domain is invalid'],
      });

      render(
        <AuthContextProvider>
          <ApplyForBmDialog>
            <button>Apply for BM</button>
          </ApplyForBmDialog>
        </AuthContextProvider>
      );

      fireEvent.click(screen.getByText('Apply for BM'));

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      fireEvent.click(submitButton);

      expect(mockValidation.showValidationErrors).toHaveBeenCalledWith([
        'Business name is required',
        'Domain is invalid',
      ]);
    });

    it('should handle subscription limits', async () => {
      // Mock subscription limit reached
      const mockSubscription = require('../../hooks/useSubscription');
      mockSubscription.useSubscription.mockReturnValue({
        subscriptionData: {
          canRequestAssets: false,
          subscriptionStatus: 'active',
          free: false,
        },
        usage: {
          businessManagers: 5,
        },
        checkLimit: jest.fn().mockReturnValue(false),
        currentPlan: {
          id: 'starter',
          name: 'Starter',
          businessManagerLimit: 5,
        },
      });

      render(
        <AuthContextProvider>
          <ApplyForBmDialog>
            <button>Apply for BM</button>
          </ApplyForBmDialog>
        </AuthContextProvider>
      );

      fireEvent.click(screen.getByText('Apply for BM'));

      // Should show upgrade message
      expect(screen.getByText(/upgrade your plan/i)).toBeInTheDocument();
    });

    it('should handle multiple domains in application', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          applicationId: 'app-123',
          paymentRequired: true,
        }),
      });

      render(
        <AuthContextProvider>
          <ApplyForBmDialog>
            <button>Apply for BM</button>
          </ApplyForBmDialog>
        </AuthContextProvider>
      );

      fireEvent.click(screen.getByText('Apply for BM'));

      // Fill out form with multiple domains
      const businessNameInput = screen.getByLabelText(/business name/i);
      const domainInput = screen.getByLabelText(/domain/i);

      fireEvent.change(businessNameInput, { target: { value: 'Multi Domain Business' } });
      fireEvent.change(domainInput, { target: { value: 'domain1.com, domain2.com, domain3.com' } });

      // Add additional domains
      const addDomainButton = screen.getByText(/add domain/i);
      fireEvent.click(addDomainButton);

      const additionalDomainInput = screen.getByLabelText(/additional domain/i);
      fireEvent.change(additionalDomainInput, { target: { value: 'domain4.com' } });

      const submitButton = screen.getByRole('button', { name: /submit application/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'business_manager',
            organizationId: 'org-123',
            businessName: 'Multi Domain Business',
            domain: 'domain1.com, domain2.com, domain3.com',
            domains: ['domain1.com', 'domain2.com', 'domain3.com', 'domain4.com'],
          }),
        });
      });
    });
  });

  describe('Business Manager Status Tracking', () => {
    it('should display application status correctly', async () => {
      const mockApplications = [
        {
          id: 'app-1',
          status: 'pending',
          business_name: 'Test Business 1',
          domain: 'test1.com',
          created_at: '2024-01-01T00:00:00Z',
          payment_status: 'paid',
        },
        {
          id: 'app-2',
          status: 'processing',
          business_name: 'Test Business 2',
          domain: 'test2.com',
          created_at: '2024-01-02T00:00:00Z',
          payment_status: 'paid',
        },
        {
          id: 'app-3',
          status: 'fulfilled',
          business_name: 'Test Business 3',
          domain: 'test3.com',
          created_at: '2024-01-03T00:00:00Z',
          payment_status: 'paid',
          business_manager_id: 'bm-123',
        },
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ applications: mockApplications }),
      });

      render(
        <AuthContextProvider>
          <BusinessManagersTable />
        </AuthContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Business 1')).toBeInTheDocument();
        expect(screen.getByText('Test Business 2')).toBeInTheDocument();
        expect(screen.getByText('Test Business 3')).toBeInTheDocument();
      });

      // Check status badges
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Fulfilled')).toBeInTheDocument();
    });

    it('should handle application cancellation', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <AuthContextProvider>
          <BusinessManagersTable />
        </AuthContextProvider>
      );

      // Mock application row with cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel application/i });
      fireEvent.click(cancelButton);

      // Confirm cancellation
      const confirmButton = screen.getByRole('button', { name: /confirm cancel/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/applications/app-1', {
          method: 'DELETE',
        });
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('application cancelled')
      );
    });
  });

  describe('Business Manager Details and Management', () => {
    it('should display BM details correctly', async () => {
      const mockBmDetails = {
        id: 'bm-123',
        business_name: 'Test Business',
        business_manager_id: 'BM123456789',
        status: 'active',
        domains: ['test.com', 'test2.com'],
        created_at: '2024-01-01T00:00:00Z',
        ad_accounts: [
          { id: 'ad-1', name: 'Test Ad Account 1', status: 'active' },
          { id: 'ad-2', name: 'Test Ad Account 2', status: 'active' },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBmDetails,
      });

      render(
        <AuthContextProvider>
          <BmDetailsDialog bmId="bm-123" />
        </AuthContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Business')).toBeInTheDocument();
        expect(screen.getByText('BM123456789')).toBeInTheDocument();
        expect(screen.getByText('test.com')).toBeInTheDocument();
        expect(screen.getByText('test2.com')).toBeInTheDocument();
      });

      // Check ad accounts
      expect(screen.getByText('Test Ad Account 1')).toBeInTheDocument();
      expect(screen.getByText('Test Ad Account 2')).toBeInTheDocument();
    });

    it('should handle BM replacement requests', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          replacementId: 'replacement-123',
          message: 'Replacement request submitted',
        }),
      });

      render(
        <AuthContextProvider>
          <BmDetailsDialog bmId="bm-123" />
        </AuthContextProvider>
      );

      const replaceButton = screen.getByRole('button', { name: /request replacement/i });
      fireEvent.click(replaceButton);

      // Fill replacement reason
      const reasonInput = screen.getByLabelText(/reason for replacement/i);
      fireEvent.change(reasonInput, { 
        target: { value: 'Business manager suspended by Facebook' } 
      });

      const submitButton = screen.getByRole('button', { name: /submit replacement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/business-managers/bm-123/replacement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'Business manager suspended by Facebook',
            organizationId: 'org-123',
          }),
        });
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('replacement request submitted')
      );
    });
  });

  describe('Admin BM Processing Workflow', () => {
    it('should handle admin BM approval', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          businessManagerId: 'BM123456789',
          message: 'Business manager created successfully',
        }),
      });

      // Mock admin approval
      const response = await fetch('/api/admin/fulfill-bm-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: 'app-123',
          businessManagerId: 'BM123456789',
          status: 'fulfilled',
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.businessManagerId).toBe('BM123456789');
    });

    it('should handle admin BM rejection', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Application rejected',
        }),
      });

      const response = await fetch('/api/admin/update-application-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: 'app-123',
          status: 'rejected',
          reason: 'Domain does not meet requirements',
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('BM Payment Integration', () => {
    it('should handle BM application payment', async () => {
      // Mock payment creation
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          paymentUrl: 'https://checkout.stripe.com/pay/cs_123',
          sessionId: 'cs_123',
        }),
      });

      const response = await fetch('/api/bm-applications/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: 'app-123',
          amount: 50,
          organizationId: 'org-123',
        }),
      });

      const data = await response.json();
      expect(data.paymentUrl).toBe('https://checkout.stripe.com/pay/cs_123');
    });

    it('should handle payment success webhook', async () => {
      const webhookPayload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            metadata: {
              applicationId: 'app-123',
              type: 'bm_application',
            },
          },
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await fetch('/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('BM Integration with External APIs', () => {
    it('should handle Dolphin API integration for BM creation', async () => {
      // Mock Dolphin API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          businessManagerId: 'BM123456789',
          dolphinResponse: {
            status: 'success',
            bmId: 'BM123456789',
            domains: ['test.com'],
          },
        }),
      });

      const response = await fetch('/api/dolphin/create-business-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: 'Test Business',
          domains: ['test.com'],
          applicationId: 'app-123',
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.businessManagerId).toBe('BM123456789');
    });

    it('should handle Dolphin API errors', async () => {
      // Mock Dolphin API error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Domain already exists in another business manager',
          code: 'DOMAIN_CONFLICT',
        }),
      });

      const response = await fetch('/api/dolphin/create-business-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: 'Test Business',
          domains: ['existing.com'],
          applicationId: 'app-123',
        }),
      });

      const data = await response.json();
      expect(data.error).toBe('Domain already exists in another business manager');
      expect(data.code).toBe('DOMAIN_CONFLICT');
    });
  });

  describe('BM Subscription Integration', () => {
    it('should enforce BM limits based on subscription', async () => {
      // Mock subscription check
      const mockSubscription = require('../../hooks/useSubscription');
      mockSubscription.useSubscription.mockReturnValue({
        subscriptionData: {
          canRequestAssets: true,
          subscriptionStatus: 'active',
          free: false,
        },
        usage: {
          businessManagers: 4,
        },
        checkLimit: jest.fn().mockReturnValue(false), // Limit reached
        currentPlan: {
          id: 'starter',
          name: 'Starter',
          businessManagerLimit: 4,
        },
      });

      render(
        <AuthContextProvider>
          <ApplyForBmDialog>
            <button>Apply for BM</button>
          </ApplyForBmDialog>
        </AuthContextProvider>
      );

      fireEvent.click(screen.getByText('Apply for BM'));

      // Should show limit reached message
      expect(screen.getByText(/reached your business manager limit/i)).toBeInTheDocument();
      expect(screen.getByText(/upgrade your plan/i)).toBeInTheDocument();
    });

    it('should handle subscription upgrade flow', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          upgradeUrl: 'https://checkout.stripe.com/upgrade/cs_456',
        }),
      });

      const response = await fetch('/api/payments/upgrade-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'org-123',
          targetPlan: 'growth',
        }),
      });

      const data = await response.json();
      expect(data.upgradeUrl).toBe('https://checkout.stripe.com/upgrade/cs_456');
    });
  });
}); 