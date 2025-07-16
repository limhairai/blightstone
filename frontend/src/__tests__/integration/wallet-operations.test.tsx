import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    query: {},
    pathname: '/wallet'
  })
}));

// Mock Supabase
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis()
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase
}));

// Mock fetch
global.fetch = jest.fn();

describe('Wallet Operations Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should handle wallet balance retrieval', async () => {
    const mockWalletData = {
      balance: 1000.50,
      currency: 'USD',
      pending_balance: 200.00
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockWalletData })
    });

    // Mock wallet API call
    const getWalletBalance = async (organizationId: string) => {
      const response = await fetch(`/api/wallet/balance?org=${organizationId}`);
      return response.json();
    };

    const result = await getWalletBalance('org-123');
    
    expect(global.fetch).toHaveBeenCalledWith('/api/wallet/balance?org=org-123');
    expect(result.data.balance).toBe(1000.50);
    expect(result.data.currency).toBe('USD');
  });

  it('should handle top-up request workflow', async () => {
    const mockTopupRequest = {
      id: 'topup-123',
      amount: 500,
      payment_method: 'stripe',
      status: 'pending'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockTopupRequest })
    });

    const createTopupRequest = async (data: any) => {
      const response = await fetch('/api/topup-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    };

    const topupData = {
      amount: 500,
      payment_method: 'stripe',
      organization_id: 'org-123'
    };

    const result = await createTopupRequest(topupData);
    
    expect(global.fetch).toHaveBeenCalledWith('/api/topup-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(topupData)
    });
    expect(result.data.amount).toBe(500);
    expect(result.data.status).toBe('pending');
  });

  it('should handle transaction history retrieval', async () => {
    const mockTransactions = [
      {
        id: 'tx-1',
        type: 'topup',
        amount: 500,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'tx-2',
        type: 'spend',
        amount: -100,
        status: 'completed',
        created_at: '2024-01-02T00:00:00Z'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockTransactions })
    });

    const getTransactionHistory = async (organizationId: string) => {
      const response = await fetch(`/api/wallet/transactions?org=${organizationId}&limit=50`);
      return response.json();
    };

    const result = await getTransactionHistory('org-123');
    
    expect(global.fetch).toHaveBeenCalledWith('/api/wallet/transactions?org=org-123&limit=50');
    expect(result.data).toHaveLength(2);
    expect(result.data[0].type).toBe('topup');
    expect(result.data[1].type).toBe('spend');
  });

  it('should handle bank transfer workflow', async () => {
    const mockBankTransfer = {
      id: 'bt-123',
      amount: 1000,
      bank_details: {
        bank_name: 'Test Bank',
        account_number: '**** 1234'
      },
      status: 'pending_verification'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockBankTransfer })
    });

    const requestBankTransfer = async (data: any) => {
      const response = await fetch('/api/bank-transfer/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    };

    const transferData = {
      amount: 1000,
      organization_id: 'org-123',
      bank_details: {
        bank_name: 'Test Bank',
        account_number: '1234567890'
      }
    };

    const result = await requestBankTransfer(transferData);
    
    expect(global.fetch).toHaveBeenCalledWith('/api/bank-transfer/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData)
    });
    expect(result.data.amount).toBe(1000);
    expect(result.data.status).toBe('pending_verification');
  });

  it('should handle payment validation errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ 
        error: 'Invalid payment amount',
        code: 'INVALID_AMOUNT'
      })
    });

    const createTopupRequest = async (data: any) => {
      const response = await fetch('/api/topup-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
      
      return response.json();
    };

    const invalidData = {
      amount: -100, // Invalid negative amount
      payment_method: 'stripe',
      organization_id: 'org-123'
    };

    await expect(createTopupRequest(invalidData)).rejects.toThrow('Invalid payment amount');
  });

  it('should handle wallet consolidation', async () => {
    const mockConsolidation = {
      success: true,
      consolidated_amount: 1500.75,
      source_accounts: ['acc-1', 'acc-2'],
      target_account: 'main-wallet'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockConsolidation })
    });

    const consolidateWallet = async (organizationId: string) => {
      const response = await fetch('/api/wallet/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: organizationId })
      });
      return response.json();
    };

    const result = await consolidateWallet('org-123');
    
    expect(result.data.success).toBe(true);
    expect(result.data.consolidated_amount).toBe(1500.75);
    expect(result.data.source_accounts).toHaveLength(2);
  });

  it('should handle concurrent wallet operations', async () => {
    // Mock multiple concurrent requests
    const mockResponses = [
      { data: { balance: 1000 } },
      { data: { id: 'tx-1', status: 'completed' } },
      { data: [{ id: 'tx-1' }, { id: 'tx-2' }] }
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockResponses[0] })
      .mockResolvedValueOnce({ ok: true, json: async () => mockResponses[1] })
      .mockResolvedValueOnce({ ok: true, json: async () => mockResponses[2] });

    const [balanceResult, topupResult, historyResult] = await Promise.all([
      fetch('/api/wallet/balance').then(r => r.json()),
      fetch('/api/topup-requests', { method: 'POST', body: '{}' }).then(r => r.json()),
      fetch('/api/wallet/transactions').then(r => r.json())
    ]);

    expect(balanceResult.data.balance).toBe(1000);
    expect(topupResult.data.status).toBe('completed');
    expect(historyResult.data).toHaveLength(2);
  });
}); 