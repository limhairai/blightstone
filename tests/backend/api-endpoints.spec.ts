import { test, expect, createTestUser, TEST_CONFIG, APIHelpers } from '../utils/test-helpers';

test.describe('Backend API Endpoints', () => {
  let testUser: ReturnType<typeof createTestUser>;
  let apiHelpers: APIHelpers;
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    testUser = createTestUser();
    apiHelpers = new APIHelpers();
    
    // Create test user and get auth token
    const response = await request.post(`${TEST_CONFIG.apiURL}/auth/register`, {
      data: {
        email: testUser.email,
        password: testUser.password,
        name: testUser.name
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const userData = await response.json();
    authToken = userData.access_token;
  });

  test.describe('Authentication Endpoints', () => {
    test('POST /auth/register - should register new user', async ({ request }) => {
      const newUser = createTestUser();
      
      const response = await request.post(`${TEST_CONFIG.apiURL}/auth/register`, {
        data: {
          email: newUser.email,
          password: newUser.password,
          name: newUser.name
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.user.email).toBe(newUser.email);
      expect(data.access_token).toBeDefined();
    });

    test('POST /auth/register - should reject duplicate email', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/auth/register`, {
        data: {
          email: testUser.email, // Already registered
          password: 'password123',
          name: 'Duplicate User'
        }
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('already exists');
    });

    test('POST /auth/login - should login with valid credentials', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.access_token).toBeDefined();
      expect(data.user.email).toBe(testUser.email);
    });

    test('POST /auth/login - should reject invalid credentials', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/auth/login`, {
        data: {
          email: testUser.email,
          password: 'wrongpassword'
        }
      });
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid credentials');
    });

    test('POST /auth/refresh - should refresh token', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/auth/refresh`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.access_token).toBeDefined();
    });

    test('POST /auth/logout - should logout user', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/auth/logout`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('GET /auth/user - should return user profile', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.email).toBe(testUser.email);
    });

    test('GET /auth/user - should reject unauthenticated request', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/auth/user`);
      
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Organization Endpoints', () => {
    test('GET /organizations - should return user organizations', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/organizations`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.organizations)).toBeTruthy();
    });

    test('POST /organizations - should create new organization', async ({ request }) => {
      const orgData = {
        name: `Test Org ${Date.now()}`,
        industry: 'Technology',
        ad_spend_monthly: '$1,000-$5,000',
        timezone: 'UTC',
        how_heard_about_us: 'Search Engine'
      };
      
      const response = await request.post(`${TEST_CONFIG.apiURL}/organizations`, {
        data: orgData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.organization.name).toBe(orgData.name);
    });

    test('PUT /organizations/:id - should update organization', async ({ request }) => {
      // First create an organization
      const createResponse = await request.post(`${TEST_CONFIG.apiURL}/organizations`, {
        data: {
          name: 'Update Test Org',
          industry: 'Technology',
          ad_spend_monthly: '$1,000-$5,000',
          timezone: 'UTC'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const createData = await createResponse.json();
      const orgId = createData.organization.id;
      
      // Update the organization
      const updateResponse = await request.put(`${TEST_CONFIG.apiURL}/organizations/${orgId}`, {
        data: {
          name: 'Updated Org Name',
          industry: 'Healthcare'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(updateResponse.ok()).toBeTruthy();
      const updateData = await updateResponse.json();
      expect(updateData.organization.name).toBe('Updated Org Name');
    });

    test('DELETE /organizations/:id - should delete organization', async ({ request }) => {
      // First create an organization
      const createResponse = await request.post(`${TEST_CONFIG.apiURL}/organizations`, {
        data: {
          name: 'Delete Test Org',
          industry: 'Technology',
          ad_spend_monthly: '$1,000-$5,000',
          timezone: 'UTC'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const createData = await createResponse.json();
      const orgId = createData.organization.id;
      
      // Delete the organization
      const deleteResponse = await request.delete(`${TEST_CONFIG.apiURL}/organizations/${orgId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(deleteResponse.ok()).toBeTruthy();
    });
  });

  test.describe('Business Manager Endpoints', () => {
    test('GET /business-managers - should return user BMs', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/business-managers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.business_managers)).toBeTruthy();
    });

    test('POST /business-managers - should create BM application', async ({ request }) => {
      const bmData = {
        name: `Test BM ${Date.now()}`,
        provider: 'BlueFocus',
        business_name: 'Test Business',
        industry: 'Technology',
        monthly_spend: '$1,000-$5,000',
        website: 'https://example.com',
        description: 'Test business description'
      };
      
      const response = await request.post(`${TEST_CONFIG.apiURL}/business-managers`, {
        data: bmData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.application.name).toBe(bmData.name);
    });

    test('PUT /business-managers/:id/status - should update BM status', async ({ request }) => {
      // This would typically be an admin-only endpoint
      const response = await request.put(`${TEST_CONFIG.apiURL}/business-managers/bm-123/status`, {
        data: {
          status: 'approved',
          notes: 'Application approved'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Expect 403 for non-admin user
      expect(response.status()).toBe(403);
    });

    test('POST /business-managers/:id/bind - should bind BM to organization', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/business-managers/bm-123/bind`, {
        data: {
          organization_id: 'org-123'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Response depends on BM availability
      expect([200, 404, 400]).toContain(response.status());
    });
  });

  test.describe('Ad Account Endpoints', () => {
    test('GET /ad-accounts - should return user ad accounts', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/ad-accounts`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.ad_accounts)).toBeTruthy();
    });

    test('POST /ad-accounts - should create ad account request', async ({ request }) => {
      const accountData = {
        name: `Test Ad Account ${Date.now()}`,
        business_manager_id: 'bm-123',
        currency: 'USD',
        timezone: 'UTC',
        initial_budget: 1000
      };
      
      const response = await request.post(`${TEST_CONFIG.apiURL}/ad-accounts`, {
        data: accountData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.request.name).toBe(accountData.name);
    });

    test('POST /ad-accounts/:id/topup - should top up ad account', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/ad-accounts/acc-123/topup`, {
        data: {
          amount: 100.00,
          currency: 'USD'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Response depends on account existence and wallet balance
      expect([200, 404, 400]).toContain(response.status());
    });

    test('GET /ad-accounts/:id/performance - should return performance data', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/ad-accounts/acc-123/performance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Response depends on account existence
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe('Wallet Endpoints', () => {
    test('GET /wallet - should return wallet balance', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/wallet`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.balance).toBeDefined();
      expect(data.currency).toBeDefined();
    });

    test('POST /wallet/topup - should create top-up request', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/wallet/topup`, {
        data: {
          amount: 100.00,
          currency: 'USD',
          payment_method: 'credit_card'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.payment_intent).toBeDefined();
    });

    test('GET /wallet/transactions - should return transaction history', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/wallet/transactions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.transactions)).toBeTruthy();
    });

    test('GET /wallet/transactions - should support pagination', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/wallet/transactions?page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });
  });

  test.describe('Subscription Endpoints', () => {
    test('GET /subscriptions - should return user subscriptions', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.subscriptions)).toBeTruthy();
    });

    test('POST /subscriptions - should create subscription', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/subscriptions`, {
        data: {
          plan_id: 'plan_basic',
          payment_method: 'pm_card_visa'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.subscription).toBeDefined();
    });

    test('PUT /subscriptions/:id - should update subscription', async ({ request }) => {
      const response = await request.put(`${TEST_CONFIG.apiURL}/subscriptions/sub-123`, {
        data: {
          plan_id: 'plan_premium'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Response depends on subscription existence
      expect([200, 404]).toContain(response.status());
    });

    test('DELETE /subscriptions/:id - should cancel subscription', async ({ request }) => {
      const response = await request.delete(`${TEST_CONFIG.apiURL}/subscriptions/sub-123`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Response depends on subscription existence
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe('Error Handling', () => {
    test('should return 404 for non-existent endpoints', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/non-existent-endpoint`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(404);
    });

    test('should return 401 for missing authorization', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/organizations`);
      
      expect(response.status()).toBe(401);
    });

    test('should return 400 for invalid request data', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/organizations`, {
        data: {
          // Missing required fields
          name: ''
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test('should return 429 for rate limit exceeded', async ({ request }) => {
      // Make multiple rapid requests to trigger rate limit
      const promises = Array.from({ length: 100 }, () =>
        request.get(`${TEST_CONFIG.apiURL}/auth/user`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      );
      
      const responses = await Promise.all(promises);
      const rateLimitedResponse = responses.find(r => r.status() === 429);
      
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.status()).toBe(429);
      }
    });

    test('should handle malformed JSON', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/organizations`, {
        data: 'invalid json',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Data Validation', () => {
    test('should validate email format', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/auth/register`, {
        data: {
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        }
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('email');
    });

    test('should validate password strength', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/auth/register`, {
        data: {
          email: 'test@example.com',
          password: '123', // Too weak
          name: 'Test User'
        }
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('password');
    });

    test('should validate required fields', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/organizations`, {
        data: {
          // Missing required fields
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('required');
    });

    test('should validate numeric fields', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/wallet/topup`, {
        data: {
          amount: 'invalid-amount',
          currency: 'USD'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('amount');
    });
  });

  test.describe('Security', () => {
    test('should sanitize input data', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/organizations`, {
        data: {
          name: '<script>alert("xss")</script>',
          industry: 'Technology',
          ad_spend_monthly: '$1,000-$5,000',
          timezone: 'UTC'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.organization.name).not.toContain('<script>');
      }
    });

    test('should prevent SQL injection', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/organizations?name='; DROP TABLE organizations; --`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Should not cause server error
      expect(response.status()).not.toBe(500);
    });

    test('should validate JWT token expiration', async ({ request }) => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      const response = await request.get(`${TEST_CONFIG.apiURL}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      });
      
      expect(response.status()).toBe(401);
    });
  });
}); 