import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface WalletTopupRequest {
  organizationId: string
  amount: number // in dollars
  paymentMethod: 'stripe' | 'bank_transfer' | 'crypto'
  transactionId: string // external transaction ID
  metadata?: Record<string, any>
  description?: string
}

export interface WalletTopupResult {
  success: boolean
  walletId?: string
  transactionId?: string
  newBalance?: number
  error?: string
}

/**
 * Unified wallet topup service that handles all payment methods
 */
export class WalletService {
  /**
   * Process a wallet topup from any payment method
   */
  static async processTopup(request: WalletTopupRequest): Promise<WalletTopupResult> {
    try {
      // Get or create wallet
      const wallet = await this.getOrCreateWallet(request.organizationId)
      if (!wallet.success) {
        console.error('Failed to get/create wallet:', wallet.error)
        return { success: false, error: wallet.error }
      }

      const amountCents = Math.round(request.amount * 100)
      const newBalanceCents = (wallet.balanceCents || 0) + amountCents

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance_cents: newBalanceCents,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', request.organizationId)

      if (updateError) {
        console.error('Error updating wallet balance:', updateError)
        return { success: false, error: 'Failed to update wallet balance' }
      }

      // Create transaction record
      const description = request.description || `Wallet Top-up - $${request.amount.toFixed(2)}`
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          organization_id: request.organizationId,
          wallet_id: wallet.walletId,
          type: 'deposit',
          amount_cents: amountCents,
          status: 'completed',
          description,
          metadata: {
            payment_method: request.paymentMethod,
            external_transaction_id: request.transactionId,
            ...request.metadata
          }
        })
        .select('transaction_id')
        .single()

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError)
        // Don't fail the topup if transaction record fails, but log it
      }

      // Trigger cache invalidation for immediate UI updates
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/cache/invalidate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CACHE_INVALIDATION_SECRET || 'internal-cache-invalidation'}`
          },
          body: JSON.stringify({
            organizationId: request.organizationId,
            type: 'wallet'
          })
        })
    
      } catch (cacheError) {
        console.error('Failed to invalidate wallet cache:', cacheError)
        // Don't fail the topup if cache invalidation fails
      }

      return {
        success: true,
        walletId: wallet.walletId,
        transactionId: transaction?.transaction_id,
        newBalance: newBalanceCents / 100
      }

    } catch (error) {
      console.error('Error processing wallet topup:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

    /**
   * Get existing wallet or create new one
   */
  private static async getOrCreateWallet(organizationId: string): Promise<{
    success: boolean
    walletId?: string
    balanceCents?: number
    error?: string
  }> {
    // First validate that the organization exists
    const { data: orgExists, error: orgError } = await supabase
      .from('organizations')
      .select('organization_id')
      .eq('organization_id', organizationId)
      .single()

    if (orgError || !orgExists) {
      console.error('Organization not found for wallet creation:', {
        organizationId,
        error: orgError
      })
      return { 
        success: false, 
        error: `Organization ${organizationId} not found` 
      }
    }

    // Try to get existing wallet
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('wallet_id, balance_cents')
      .eq('organization_id', organizationId)
      .single()

    if (walletData) {
      return {
        success: true,
        walletId: walletData.wallet_id,
        balanceCents: walletData.balance_cents || 0
      }
    }

    // Create wallet if it doesn't exist (organization is validated above)
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({
        organization_id: organizationId,
        balance_cents: 0,
        reserved_balance_cents: 0
      })
      .select('wallet_id, balance_cents')
      .single()

    if (createError) {
      console.error('Failed to create wallet:', createError)
      return { success: false, error: 'Failed to create wallet' }
    }

    return {
      success: true,
      walletId: newWallet.wallet_id,
      balanceCents: newWallet.balance_cents || 0
    }
  }

  /**
   * Get wallet balance for an organization
   */
  static async getBalance(organizationId: string): Promise<{
    success: boolean
    balance?: number
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance_cents')
        .eq('organization_id', organizationId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const totalBalance = (data.balance_cents || 0) / 100

      return {
        success: true,
        balance: totalBalance
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
} 