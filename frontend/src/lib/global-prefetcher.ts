import { mutate } from 'swr'
import { authenticatedFetcher } from './swr-config'

interface PrefetcherOptions {
  session: any
  organizationId: string
}

export class GlobalDataPrefetcher {
  private session: any
  private organizationId: string
  private prefetchComplete = new Set<string>()

  constructor({ session, organizationId }: PrefetcherOptions) {
    this.session = session
    this.organizationId = organizationId
  }

  async prefetchAllDashboardData() {
    if (!this.session?.access_token || !this.organizationId) return

    console.log('🚀 Starting aggressive data prefetch...')
    const startTime = Date.now()

    // Define all the data endpoints we need to prefetch
    const prefetchTasks = [
      // Core organization data
      this.prefetchOrganizationData(),
      
      // Wallet & financial data
      this.prefetchWalletData(),
      
      // Support & tickets
      this.prefetchSupportData(),
      
      // Settings & team
      this.prefetchSettingsData(),
      
      // Transactions
      this.prefetchTransactionsData(),
      
      // Business managers & applications
      this.prefetchBusinessData(),
      
      // Assets & pixels
      this.prefetchAssetsData(),
    ]

    // Execute all prefetch tasks in parallel for maximum speed
    await Promise.allSettled(prefetchTasks)

    const endTime = Date.now()
    console.log(`✅ Global prefetch completed in ${endTime - startTime}ms`)
    console.log(`📊 Prefetched ${this.prefetchComplete.size} datasets`)
    
    // Mark global prefetch as complete for instant page wrapper
    localStorage.setItem('adhub_global_prefetch_complete', Date.now().toString())
    console.log('🎯 Global prefetch marked complete - all future navigation will be instant!')
  }

  private async prefetchOrganizationData() {
    try {
      const cacheKey = [`/api/organizations?id=${this.organizationId}`, this.session.access_token]
      await mutate(cacheKey, () => 
        authenticatedFetcher(`/api/organizations?id=${this.organizationId}`, this.session.access_token),
        { revalidate: false }
      )
      this.prefetchComplete.add('organization')
    } catch (error) {
      console.warn('Failed to prefetch organization data:', error)
    }
  }

  private async prefetchWalletData() {
    try {
      // Wallet transactions
      const transactionsCacheKey = [`/api/transactions?organizationId=${this.organizationId}`, this.session.access_token]
      await mutate(transactionsCacheKey, () =>
        authenticatedFetcher(`/api/transactions?organizationId=${this.organizationId}`, this.session.access_token),
        { revalidate: false }
      )

      // Topup requests
      const topupCacheKey = [`/api/topup-requests`, this.session.access_token]
      await mutate(topupCacheKey, () =>
        authenticatedFetcher('/api/topup-requests', this.session.access_token),
        { revalidate: false }
      )

      this.prefetchComplete.add('wallet')
    } catch (error) {
      console.warn('Failed to prefetch wallet data:', error)
    }
  }

  private async prefetchSupportData() {
    try {
      const cacheKey = [`/api/support/tickets`, this.session.access_token]
      await mutate(cacheKey, () =>
        authenticatedFetcher('/api/support/tickets', this.session.access_token),
        { revalidate: false }
      )
      this.prefetchComplete.add('support')
    } catch (error) {
      console.warn('Failed to prefetch support data:', error)
    }
  }

  private async prefetchSettingsData() {
    try {
      // Subscription data
      const subscriptionCacheKey = [`/api/subscriptions`, this.session.access_token]
      await mutate(subscriptionCacheKey, () =>
        authenticatedFetcher('/api/subscriptions', this.session.access_token),
        { revalidate: false }
      )

      // Team members (if applicable)
      const teamCacheKey = [`/api/organizations/${this.organizationId}/members`, this.session.access_token]
      await mutate(teamCacheKey, () =>
        authenticatedFetcher(`/api/organizations/${this.organizationId}/members`, this.session.access_token),
        { revalidate: false }
      )

      this.prefetchComplete.add('settings')
    } catch (error) {
      console.warn('Failed to prefetch settings data:', error)
    }
  }

  private async prefetchTransactionsData() {
    try {
      // All transactions with common filters
      const filters = ['all', 'deposit', 'transfer', 'withdrawal']
      const cachePromises = filters.map(filter => {
        const cacheKey = [`/api/transactions?type=${filter}`, this.session.access_token]
        return mutate(cacheKey, () =>
          authenticatedFetcher(`/api/transactions?type=${filter}`, this.session.access_token),
          { revalidate: false }
        )
      })

      await Promise.allSettled(cachePromises)
      this.prefetchComplete.add('transactions')
    } catch (error) {
      console.warn('Failed to prefetch transactions data:', error)
    }
  }

  private async prefetchBusinessData() {
    try {
      // Business managers
      const bmCacheKey = [`/api/business-managers`, this.session.access_token]
      await mutate(bmCacheKey, () =>
        authenticatedFetcher('/api/business-managers', this.session.access_token),
        { revalidate: false }
      )

      // Applications
      const appCacheKey = [`applications`, this.session.access_token]
      await mutate(appCacheKey, () =>
        authenticatedFetcher('/api/applications', this.session.access_token),
        { revalidate: false }
      )

      this.prefetchComplete.add('business')
    } catch (error) {
      console.warn('Failed to prefetch business data:', error)
    }
  }

  private async prefetchAssetsData() {
    try {
      // Pixels
      const pixelsCacheKey = [`/api/organizations/${this.organizationId}/pixels`, this.session.access_token]
      await mutate(pixelsCacheKey, () =>
        authenticatedFetcher(`/api/organizations/${this.organizationId}/pixels`, this.session.access_token),
        { revalidate: false }
      )

      // Ad accounts
      const accountsCacheKey = [`/api/ad-accounts`, this.session.access_token]
      await mutate(accountsCacheKey, () =>
        authenticatedFetcher('/api/ad-accounts', this.session.access_token),
        { revalidate: false }
      )

      this.prefetchComplete.add('assets')
    } catch (error) {
      console.warn('Failed to prefetch assets data:', error)
    }
  }

  // Method to check if data is already prefetched
  isPrefetched(dataType: string): boolean {
    return this.prefetchComplete.has(dataType)
  }

  // Method to get prefetch progress
  getPrefetchProgress(): { completed: number; total: number } {
    return {
      completed: this.prefetchComplete.size,
      total: 7 // Total number of data types we prefetch
    }
  }
} 