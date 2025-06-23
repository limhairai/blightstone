// Centralized mock data for admin panel - consistent across all pages
// Scale: 1,247 clients, 3,500+ ad accounts, 12,847 transactions

export interface AppClient {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'active' | 'suspended' | 'pending' | 'inactive';
  tier: 'starter' | 'professional' | 'enterprise';
  joinDate: string;
  lastActivity: string;
  totalSpend: number;
  monthlySpend: number;
  businessCount: number;
  adAccountCount: number;
  balance: number;
  creditLimit: number;
  paymentMethod: string;
  country: string;
  timezone: string;
  tags: string[];
}

export interface AppBusiness {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  industry: string;
  status: 'active' | 'suspended' | 'pending' | 'rejected';
  verificationStatus: 'verified' | 'pending' | 'rejected' | 'not_verified';
  createdAt: string;
  lastActivity: string;
  adAccountCount: number;
  totalSpend: number;
  monthlySpend: number;
  businessManagerId: string;
  website: string;
  country: string;
  currency: string;
  bmId?: string;
  domains: string[];
  logo?: string;
  accountsCount: number;
  totalBalance: number;
  monthlyQuota: number;
  businessType: 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship';
}

export interface AppAdAccount {
  id: string;
  name: string;
  businessId: string;
  businessName: string;
  clientId: string;
  clientName: string;
  status: 'active' | 'banned' | 'restricted' | 'pending' | 'suspended';
  provider: string;
  accountId: string;
  spend: number;
  limit: number;
  utilization: number;
  lastActivity: string;
  createdAt: string;
  currency: string;
  timezoneName: string;
  campaignCount: number;
  dailyBudget: number;
  monthlySpend: number;
}

export interface AppApplication {
  id: string;
  clientId: string;
  clientName: string;
  businessId: string;
  businessName: string;
  type: 'new_business' | 'ad_account';
  stage: 'received' | 'document_prep' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedRep: string | null;
  provider: string;
  slaDeadline: string;
  createdAt: string;
  lastUpdated: string;
  notes: string[];
  documents: { name: string; status: 'pending' | 'complete' | 'missing' }[];
  estimatedProcessingTime: number;
}

export interface AppTransaction {
  id: string;
  clientId: string;
  clientName: string;
  businessId?: string;
  businessName?: string;
  type: 'deposit' | 'withdrawal' | 'spend' | 'refund' | 'fee' | 'commission';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  date: string;
  description: string;
  reference?: string;
  paymentMethod: string;
  processingFee: number;
  netAmount: number;
}

export interface AppInventoryItem {
  id: string;
  type: 'ad_account' | 'business_manager' | 'page' | 'pixel' | 'domain';
  provider: string;
  status: 'available' | 'assigned' | 'suspended' | 'maintenance';
  assignedTo?: string;
  assignedAt?: string;
  createdAt: string;
  lastChecked: string;
  healthScore: number;
  metadata: Record<string, any>;
}

// Generate consistent mock data
export class AdminAppDataGenerator {
  private static instance: AdminAppDataGenerator;
  private clients: AppClient[] = [];
  private businesses: AppBusiness[] = [];
  private adAccounts: AppAdAccount[] = [];
  private applications: AppApplication[] = [];
  private transactions: AppTransaction[] = [];
  private inventory: AppInventoryItem[] = [];

  private constructor() {
    this.generateAllData();
  }

  public static getInstance(): AdminAppDataGenerator {
    if (!AdminAppDataGenerator.instance) {
      AdminAppDataGenerator.instance = new AdminAppDataGenerator();
    }
    return AdminAppDataGenerator.instance;
  }

  private generateAllData() {
    this.clients = this.generateClients(1247);
    this.businesses = this.generateBusinesses(this.clients);
    this.adAccounts = this.generateAdAccounts(this.businesses);
    this.applications = this.generateApplications(this.clients, this.businesses);
    this.transactions = this.generateTransactions(this.clients, this.businesses);
    this.inventory = this.generateInventory(4200); // Larger inventory pool
  }

  private generateClients(count: number): AppClient[] {
    const tiers = ['starter', 'professional', 'enterprise'];
    const statuses = ['active', 'suspended', 'pending', 'inactive'];
    const countries = ['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE'];
    const paymentMethods = ['Credit Card', 'Bank Transfer', 'Wire Transfer', 'ACH', 'PayPal'];

    return Array.from({ length: count }, (_, i) => {
      const clientLetter = String.fromCharCode(65 + (i % 26));
      const clientNumber = Math.floor(i / 26) + 1;
      const businessCount = Math.floor(Math.random() * 5) + 1;
      const adAccountCount = businessCount * (Math.floor(Math.random() * 4) + 1);
      const monthlySpend = Math.floor(Math.random() * 15000) + 2000;
      const totalSpend = monthlySpend * (Math.floor(Math.random() * 24) + 6);

      return {
        id: `client_${i.toString().padStart(4, '0')}`,
        name: `${clientLetter}${clientNumber} ${['Corp', 'LLC', 'Inc', 'Ltd', 'Co'][i % 5]}`,
        email: `client${clientLetter.toLowerCase()}${clientNumber}@example.com`,
        company: `${clientLetter}${clientNumber} ${['Marketing', 'Digital', 'Media', 'Advertising', 'Solutions'][i % 5]}`,
        status: statuses[i % 10 < 8 ? 0 : i % 10 < 9 ? 1 : i % 4] as any, // 80% active
        tier: tiers[i % 10 < 6 ? 0 : i % 10 < 9 ? 1 : 2] as any, // 60% starter, 30% pro, 10% enterprise
        joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalSpend,
        monthlySpend,
        businessCount,
        adAccountCount,
        balance: Math.floor(Math.random() * 20000) - 5000, // Some negative balances
        creditLimit: Math.floor(Math.random() * 10000) + 5000,
        paymentMethod: paymentMethods[i % paymentMethods.length],
        country: countries[i % countries.length],
        timezone: 'UTC',
        tags: [`tier_${tiers[i % 3]}`, countries[i % countries.length].toLowerCase()]
      };
    });
  }

  private generateBusinesses(clients: AppClient[]): AppBusiness[] {
    const industries = ['E-commerce', 'SaaS', 'Healthcare', 'Finance', 'Education', 'Real Estate', 'Travel', 'Food & Beverage'];
    const statuses = ['active', 'suspended', 'pending', 'rejected'];
    const verificationStatuses = ['verified', 'pending', 'rejected', 'not_verified'];
    const businessTypes = ['llc', 'corporation', 'partnership', 'sole_proprietorship'];

    const businesses: AppBusiness[] = [];
    let businessId = 0;

    clients.forEach(client => {
      for (let i = 0; i < client.businessCount; i++) {
        const business: AppBusiness = {
          id: `business_${businessId.toString().padStart(4, '0')}`,
          clientId: client.id,
          clientName: client.name,
          name: `${client.name} Business ${i + 1}`,
          industry: industries[businessId % industries.length],
          status: statuses[businessId % 10 < 8 ? 0 : businessId % 4] as any, // 80% active
          verificationStatus: verificationStatuses[businessId % 10 < 7 ? 0 : businessId % 4] as any, // 70% verified
          createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
          lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          adAccountCount: Math.floor(client.adAccountCount / client.businessCount),
          totalSpend: Math.floor(client.totalSpend / client.businessCount),
          monthlySpend: Math.floor(client.monthlySpend / client.businessCount),
          businessManagerId: `bm_${businessId.toString().padStart(4, '0')}`,
          website: `https://${client.name.toLowerCase().replace(/\s+/g, '')}.com`,
          country: client.country,
          currency: 'USD',
          bmId: `${Math.floor(Math.random() * 900000000) + 100000000}`,
          domains: [`${client.name.toLowerCase().replace(/\s+/g, '')}.com`],
          accountsCount: Math.floor(client.adAccountCount / client.businessCount),
          totalBalance: Math.floor(client.balance / client.businessCount),
          monthlyQuota: Math.floor(client.creditLimit / client.businessCount),
          businessType: businessTypes[businessId % businessTypes.length] as any
        };
        businesses.push(business);
        businessId++;
      }
    });

    return businesses;
  }

  private generateAdAccounts(businesses: AppBusiness[]): AppAdAccount[] {
    const providers = ['Meta', 'Google', 'TikTok', 'Snapchat', 'Twitter'];
    const statuses = ['active', 'banned', 'restricted', 'pending', 'suspended'];

    const adAccounts: AppAdAccount[] = [];
    let accountId = 0;

    businesses.forEach(business => {
      for (let i = 0; i < business.adAccountCount; i++) {
        const monthlySpend = Math.floor(business.monthlySpend / business.adAccountCount);
        const limit = monthlySpend * (1.2 + Math.random() * 0.8); // 120-200% of spend
        
        const adAccount: AppAdAccount = {
          id: `ad_account_${accountId.toString().padStart(4, '0')}`,
          name: `${business.name} Ad Account ${i + 1}`,
          businessId: business.id,
          businessName: business.name,
          clientId: business.clientId,
          clientName: business.clientName,
          status: statuses[accountId % 10 < 7 ? 0 : accountId % 5] as any, // 70% active
          provider: providers[accountId % providers.length],
          accountId: `act_${Math.floor(Math.random() * 900000000) + 100000000}`,
          spend: monthlySpend,
          limit,
          utilization: (monthlySpend / limit) * 100,
          lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          currency: business.currency,
          timezoneName: 'UTC',
          campaignCount: Math.floor(Math.random() * 20) + 1,
          dailyBudget: Math.floor(monthlySpend / 30),
          monthlySpend
        };
        adAccounts.push(adAccount);
        accountId++;
      }
    });

    return adAccounts;
  }

  private generateApplications(clients: AppClient[], businesses: AppBusiness[]): AppApplication[] {
    const types = ['new_business', 'ad_account'];
    const stages = ['received', 'document_prep', 'submitted', 'under_review', 'approved', 'rejected'];
    const reps = ['rep_1', 'rep_2', 'rep_3', null];

    return Array.from({ length: 847 }, (_, i) => {
      const client = clients[i % clients.length];
      const business = businesses.find(b => b.clientId === client.id) || businesses[0];
      
      // Create application with random creation date (0-30 days ago)
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      // Calculate time-based priority based on days since creation
      const daysSinceCreated = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      let priority: 'low' | 'medium' | 'high' | 'urgent';
      
      if (daysSinceCreated >= 7) {
        priority = 'urgent'; // 7+ days = overdue/urgent
      } else if (daysSinceCreated >= 4) {
        priority = 'high'; // 4-6 days = high priority
      } else if (daysSinceCreated >= 2) {
        priority = 'medium'; // 2-3 days = medium priority
      } else {
        priority = 'low'; // 0-1 days = low priority (new)
      }
      
      return {
        id: `app_${i.toString().padStart(4, '0')}`,
        clientId: client.id,
        clientName: client.name,
        businessId: business.id,
        businessName: business.name,
        type: types[i % types.length] as any,
        stage: stages[i % stages.length] as any,
        priority,
        assignedRep: reps[i % reps.length],
        provider: 'Meta', // Only Meta since you only work with Meta
        slaDeadline: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from creation
        createdAt: createdAt.toISOString(),
        lastUpdated: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        notes: [`Application received`, `Initial review completed`],
        documents: [
          { name: 'Business License', status: Math.random() > 0.3 ? 'complete' : 'pending' as any },
          { name: 'Tax ID', status: Math.random() > 0.2 ? 'complete' : 'missing' as any },
          { name: 'Bank Statement', status: Math.random() > 0.4 ? 'complete' : 'pending' as any }
        ],
        estimatedProcessingTime: Math.floor(Math.random() * 5) + 1
      };
    });
  }

  private generateTransactions(clients: AppClient[], businesses: AppBusiness[]): AppTransaction[] {
    const types = ['deposit', 'withdrawal', 'spend', 'refund', 'fee', 'commission'];
    const statuses = ['completed', 'pending', 'failed', 'cancelled'];
    const paymentMethods = ['Credit Card', 'Bank Transfer', 'Wire Transfer', 'ACH'];

    return Array.from({ length: 12847 }, (_, i) => {
      const client = clients[i % clients.length];
      const business = businesses.find(b => b.clientId === client.id);
      const amount = Math.floor(Math.random() * 10000) + 100;
      const processingFee = Math.floor(amount * 0.029); // 2.9% fee
      
      return {
        id: `txn_${i.toString().padStart(6, '0')}`,
        clientId: client.id,
        clientName: client.name,
        businessId: business?.id,
        businessName: business?.name,
        type: types[i % types.length] as any,
        amount,
        currency: 'USD',
        status: statuses[i % 10 < 8 ? 0 : i % 4] as any, // 80% completed
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        description: `${types[i % types.length]} - ${business?.name || client.name}`,
        reference: `REF${i.toString().padStart(8, '0')}`,
        paymentMethod: paymentMethods[i % paymentMethods.length],
        processingFee,
        netAmount: amount - processingFee
      };
    });
  }

  private generateInventory(count: number): AppInventoryItem[] {
    const types = ['ad_account', 'business_manager', 'page', 'pixel', 'domain'];
    const statuses = ['available', 'assigned', 'suspended', 'maintenance'];

    return Array.from({ length: count }, (_, i) => ({
      id: `inv_${i.toString().padStart(4, '0')}`,
      type: types[i % types.length] as any,
      provider: 'Meta', // Only Meta since you only work with Meta
      status: statuses[i % 10 < 6 ? 0 : i % 10 < 8 ? 1 : i % 4] as any, // 60% available, 20% assigned
      assignedTo: i % 10 >= 6 && i % 10 < 8 ? `client_${(i % 100).toString().padStart(4, '0')}` : undefined,
      assignedAt: i % 10 >= 6 && i % 10 < 8 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
      lastChecked: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      healthScore: Math.floor(Math.random() * 40) + 60,
      metadata: {
        accountId: `${Math.floor(Math.random() * 900000000) + 100000000}`,
        region: ['US', 'EU', 'APAC'][i % 3],
        tier: ['basic', 'premium', 'enterprise'][i % 3]
      }
    }));
  }

  // Public getters
  public getClients(): AppClient[] { return this.clients; }
  public getBusinesses(): AppBusiness[] { return this.businesses; }
  public getAdAccounts(): AppAdAccount[] { return this.adAccounts; }
  public getApplications(): AppApplication[] { return this.applications; }
  public getTransactions(): AppTransaction[] { return this.transactions; }
  public getInventory(): AppInventoryItem[] { return this.inventory; }

  // Filtered getters
  public getClientById(id: string): AppClient | undefined {
    return this.clients.find(c => c.id === id);
  }

  public getBusinessesByClientId(clientId: string): AppBusiness[] {
    return this.businesses.filter(b => b.clientId === clientId);
  }

  public getAdAccountsByBusinessId(businessId: string): AppAdAccount[] {
    return this.adAccounts.filter(a => a.businessId === businessId);
  }

  public getTransactionsByClientId(clientId: string): AppTransaction[] {
    return this.transactions.filter(t => t.clientId === clientId);
  }
}

// Export singleton instance
export const adminAppData = AdminAppDataGenerator.getInstance(); 