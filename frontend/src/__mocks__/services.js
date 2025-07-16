/**
 * External Services Mock for Jest Tests
 * 
 * This mock simulates all external API calls with realistic data
 * to enable comprehensive testing without hitting real APIs
 */

// Mock Dolphin API responses
const mockDolphinProfiles = [
  {
    id: 'dolphin-profile-1',
    name: 'Test Profile 1',
    status: 'active',
    browser: 'chrome',
    os: 'windows',
    proxy: {
      type: 'residential',
      host: '192.168.1.100',
      port: 8080
    },
    business_managers: [
      {
        id: 'dolphin-bm-1',
        business_id: 'fb-bm-123456',
        name: 'Test Business Manager',
        status: 'ACTIVE',
        account_id: 'dolphin-profile-1',
        spend: 1500.00,
        impressions: 250000,
        ad_accounts: [
          {
            id: 'dolphin-ad-1',
            ad_account_id: 'act_123456789',
            name: 'Test Ad Account',
            status: 'ACTIVE',
            balance: 500.00,
            currency: 'USD',
            spend: 750.00,
            impressions: 125000
          }
        ]
      }
    ]
  }
]

const mockFacebookBusinessManagers = [
  {
    id: 'fb-bm-123456',
    name: 'Test Business Manager',
    status: 'ACTIVE',
    verification_status: 'verified',
    created_time: '2024-01-01T00:00:00Z',
    primary_page: 'test-page-123',
    ad_accounts: ['act_123456789', 'act_987654321']
  }
]

const mockFacebookAdAccounts = [
  {
    id: 'act_123456789',
    name: 'Test Ad Account',
    account_status: 'ACTIVE',
    balance: '50000', // in cents
    currency: 'USD',
    spend_cap: '100000', // in cents
    business: {
      id: 'fb-bm-123456',
      name: 'Test Business Manager'
    },
    insights: {
      spend: '75000', // in cents
      impressions: '125000',
      clicks: '2500',
      cpm: '6.00',
      ctr: '2.00'
    }
  }
]

const mockStripePaymentMethods = [
  {
    id: 'pm_test_card',
    type: 'card',
    card: {
      brand: 'visa',
      last4: '4242',
      exp_month: 12,
      exp_year: 2025
    }
  }
]

const mockStripePaymentIntents = [
  {
    id: 'pi_test_payment',
    amount: 10000, // $100.00
    currency: 'usd',
    status: 'succeeded',
    payment_method: 'pm_test_card',
    created: Math.floor(Date.now() / 1000)
  }
]

// Mock Dolphin API Service
export const mockDolphinAPI = {
  getBusinessManagers: jest.fn().mockResolvedValue({
    data: mockDolphinProfiles[0].business_managers,
    total: 1
  }),
  
  getAdAccounts: jest.fn().mockResolvedValue({
    data: mockDolphinProfiles[0].business_managers[0].ad_accounts,
    total: 1
  }),
  
  getBusinessManagerStats: jest.fn().mockResolvedValue({
    total_spend: 1500.00,
    total_impressions: 250000,
    total_clicks: 5000,
    average_cpm: 6.00
  }),
  
  getAdAccountStats: jest.fn().mockResolvedValue({
    total_spend: 750.00,
    total_impressions: 125000,
    total_clicks: 2500,
    average_cpm: 6.00
  }),
  
  syncAllAssets: jest.fn().mockResolvedValue({
    success: true,
    timestamp: new Date().toISOString(),
    profiles_scanned: 1,
    business_managers_found: 1,
    ad_accounts_found: 1,
    new_assets: 2,
    errors: []
  }),
  
  createAdAccounts: jest.fn().mockResolvedValue({
    success: true,
    created_accounts: 1,
    errors: []
  }),
  
  moveAdAccountToBM: jest.fn().mockResolvedValue({
    success: true,
    moved_accounts: 1,
    errors: []
  }),
  
  testConnection: jest.fn().mockResolvedValue({
    success: true,
    message: 'Successfully connected to Dolphin API'
  })
}

// Mock Facebook API Service
export const mockFacebookService = {
  authenticate: jest.fn().mockResolvedValue({
    access_token: 'mock-fb-token',
    expires_in: 3600
  }),
  
  getBusinessManagers: jest.fn().mockResolvedValue({
    data: mockFacebookBusinessManagers
  }),
  
  getAdAccounts: jest.fn().mockResolvedValue({
    data: mockFacebookAdAccounts
  }),
  
  createAdAccount: jest.fn().mockResolvedValue({
    id: 'act_new_account',
    name: 'New Test Ad Account',
    account_status: 'ACTIVE'
  }),
  
  getAdAccountInsights: jest.fn().mockResolvedValue({
    data: [{
      spend: '75000',
      impressions: '125000',
      clicks: '2500',
      cpm: '6.00',
      ctr: '2.00',
      date_start: '2024-01-01',
      date_stop: '2024-01-31'
    }]
  }),
  
  getCampaigns: jest.fn().mockResolvedValue({
    data: [{
      id: 'campaign-123',
      name: 'Test Campaign',
      status: 'ACTIVE',
      objective: 'LINK_CLICKS',
      daily_budget: '5000' // in cents
    }]
  }),
  
  createCampaign: jest.fn().mockResolvedValue({
    id: 'campaign-new',
    name: 'New Test Campaign',
    status: 'PAUSED'
  }),
  
  getPixels: jest.fn().mockResolvedValue({
    data: [{
      id: 'pixel-123',
      name: 'Test Pixel',
      code: 'fbq(\'track\', \'PageView\');'
    }]
  }),
  
  createPixel: jest.fn().mockResolvedValue({
    id: 'pixel-new',
    name: 'New Test Pixel',
    code: 'fbq(\'track\', \'PageView\');'
  }),
  
  validateAccessToken: jest.fn().mockResolvedValue({
    is_valid: true,
    expires_at: Date.now() + 3600000
  }),
  
  refreshAccessToken: jest.fn().mockResolvedValue({
    access_token: 'new-mock-fb-token',
    expires_in: 3600
  }),
  
  testConnection: jest.fn().mockResolvedValue({
    success: true,
    message: 'Successfully connected to Facebook API'
  })
}

// Mock Stripe Service
export const mockStripeService = {
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_payment',
    client_secret: 'pi_test_payment_secret',
    amount: 10000,
    currency: 'usd',
    status: 'requires_payment_method'
  }),
  
  confirmPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_payment',
    status: 'succeeded',
    amount: 10000,
    currency: 'usd'
  }),
  
  createSetupIntent: jest.fn().mockResolvedValue({
    id: 'seti_test_setup',
    client_secret: 'seti_test_setup_secret',
    status: 'requires_payment_method'
  }),
  
  getPaymentMethods: jest.fn().mockResolvedValue({
    data: mockStripePaymentMethods
  }),
  
  createCustomer: jest.fn().mockResolvedValue({
    id: 'cus_test_customer',
    email: 'test@example.com',
    created: Math.floor(Date.now() / 1000)
  }),
  
  createSubscription: jest.fn().mockResolvedValue({
    id: 'sub_test_subscription',
    status: 'active',
    current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
    items: {
      data: [{
        price: {
          id: 'price_test_pro',
          unit_amount: 9900, // $99.00
          currency: 'usd'
        }
      }]
    }
  }),
  
  cancelSubscription: jest.fn().mockResolvedValue({
    id: 'sub_test_subscription',
    status: 'canceled',
    canceled_at: Math.floor(Date.now() / 1000)
  }),
  
  processWebhook: jest.fn().mockResolvedValue({
    processed: true,
    event_type: 'payment_intent.succeeded'
  })
}

// Mock Binance Pay Service
export const mockBinancePayService = {
  createOrder: jest.fn().mockResolvedValue({
    prepayId: 'binance_order_123',
    terminalType: 'WEB',
    expireTime: Date.now() + 900000, // 15 minutes
    qrcodeLink: 'https://qr.binance.com/test-qr-code',
    deeplink: 'bnc://pay/test-deeplink',
    checkoutUrl: 'https://pay.binance.com/checkout/test-checkout',
    universalUrl: 'https://app.binance.com/pay/test-universal'
  }),
  
  queryOrder: jest.fn().mockResolvedValue({
    status: 'SUCCESS',
    transactionId: 'binance_tx_123',
    amount: '100.00',
    currency: 'USDT'
  }),
  
  getPaymentHistory: jest.fn().mockResolvedValue({
    data: [{
      orderId: 'binance_order_123',
      amount: '100.00',
      currency: 'USDT',
      status: 'SUCCESS',
      createTime: Date.now()
    }]
  })
}

// Mock Wallet Service
export const mockWalletService = {
  getBalance: jest.fn().mockResolvedValue({
    balance_cents: 10000, // $100.00
    currency: 'USD',
    last_updated: new Date().toISOString()
  }),
  
  processTopUp: jest.fn().mockResolvedValue({
    success: true,
    transaction_id: 'txn_test_topup',
    amount_cents: 10000,
    new_balance_cents: 20000
  }),
  
  processPayment: jest.fn().mockResolvedValue({
    success: true,
    transaction_id: 'txn_test_payment',
    amount_cents: 5000,
    new_balance_cents: 15000
  }),
  
  getTransactionHistory: jest.fn().mockResolvedValue({
    data: [{
      id: 'txn_test_topup',
      amount_cents: 10000,
      type: 'credit',
      status: 'completed',
      description: 'Wallet top-up via Stripe',
      created_at: new Date().toISOString()
    }]
  }),
  
  validatePaymentMethod: jest.fn().mockResolvedValue({
    valid: true,
    method_type: 'card',
    last4: '4242'
  })
}

// Mock Email Service
export const mockEmailService = {
  sendWelcomeEmail: jest.fn().mockResolvedValue({
    success: true,
    message_id: 'email_welcome_123'
  }),
  
  sendPasswordResetEmail: jest.fn().mockResolvedValue({
    success: true,
    message_id: 'email_reset_123'
  }),
  
  sendPaymentConfirmation: jest.fn().mockResolvedValue({
    success: true,
    message_id: 'email_payment_123'
  }),
  
  sendAdAccountNotification: jest.fn().mockResolvedValue({
    success: true,
    message_id: 'email_ad_account_123'
  })
}

// Mock Analytics Service
export const mockAnalyticsService = {
  trackEvent: jest.fn().mockResolvedValue({
    success: true,
    event_id: 'analytics_event_123'
  }),
  
  getMetrics: jest.fn().mockResolvedValue({
    page_views: 1500,
    unique_visitors: 750,
    conversion_rate: 0.025,
    revenue: 15000.00
  }),
  
  getUserJourney: jest.fn().mockResolvedValue({
    steps: [
      { step: 'registration', timestamp: Date.now() - 86400000 },
      { step: 'first_login', timestamp: Date.now() - 82800000 },
      { step: 'wallet_topup', timestamp: Date.now() - 3600000 },
      { step: 'ad_account_request', timestamp: Date.now() - 1800000 }
    ]
  })
}

// Export all mocks
export {
  mockDolphinProfiles,
  mockFacebookBusinessManagers,
  mockFacebookAdAccounts,
  mockStripePaymentMethods,
  mockStripePaymentIntents
} 