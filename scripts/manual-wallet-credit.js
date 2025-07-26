const { createClient } = require('@supabase/supabase-js')

// Use environment variables or hardcode for one-time script
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Please set SUPABASE environment variables:')
  console.error('export NEXT_PUBLIC_SUPABASE_URL=your_url')
  console.error('export SUPABASE_SERVICE_ROLE_KEY=your_service_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function creditWallet(organizationId, amountCents, description = 'Manual bank transfer credit') {
  try {
    console.log(`💰 Crediting wallet for organization: ${organizationId}`)
    console.log(`💵 Amount: $${amountCents / 100}`)
    
    // Step 1: Get the organization's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('wallet_id, balance_cents, organization_id')
      .eq('organization_id', organizationId)
      .single()
    
    if (walletError || !wallet) {
      throw new Error(`Wallet not found for organization ${organizationId}: ${walletError?.message}`)
    }
    
    console.log(`📊 Current balance: $${wallet.balance_cents / 100}`)
    
    // Step 2: Update wallet balance
    const newBalance = wallet.balance_cents + amountCents
    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance_cents: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_id', wallet.wallet_id)
    
    if (updateError) {
      throw new Error(`Failed to update wallet: ${updateError.message}`)
    }
    
    console.log(`📈 New balance: $${newBalance / 100}`)
    
    // Step 3: Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        organization_id: organizationId,
        wallet_id: wallet.wallet_id,
        type: 'wallet_deposit',
        amount_cents: amountCents,
        status: 'completed',
        description: description,
        metadata: {
          manual_credit: true,
          original_amount: 100000, // $1000 original transfer
          gateway_fee: 500, // $5 gateway fee (0.5%)
          net_amount: amountCents, // $995 net
          processed_by: 'admin',
          reason: 'Bank transfer without reference number'
        }
      })
    
    if (transactionError) {
      throw new Error(`Failed to create transaction: ${transactionError.message}`)
    }
    
    console.log('✅ Transaction record created')
    console.log('🎉 Wallet credited successfully!')
    
    return { success: true, newBalance: newBalance / 100 }
    
  } catch (error) {
    console.error('❌ Error crediting wallet:', error.message)
    return { success: false, error: error.message }
  }
}

// Manual credit for shadowalkerllc's organization
async function creditShadowWalker() {
  const organizationId = '7a9d87b5-1c77-4559-b829-56223155a012' // shadowalkerllc's org
  const amountCents = 99500 // $995 (after 0.5% gateway fee)
  const description = 'Bank transfer - $1000 less 0.5% gateway fee'
  
  console.log('🏦 Processing manual bank transfer credit...')
  console.log('👤 Client: shadowalkerllc@gmail.com')
  console.log('💰 Original transfer: $1000')
  console.log('💸 Gateway fee (0.5%): $5')
  console.log('✅ Net credit: $995')
  console.log('')
  
  const result = await creditWallet(organizationId, amountCents, description)
  
  if (result.success) {
    console.log('')
    console.log('📋 NEXT STEPS:')
    console.log('1. ✅ Wallet credited with $995')
    console.log('2. 🔄 Client can now do ad account topup requests')
    console.log('3. 💼 1.25% starter plan fee will apply on topup requests')
    console.log('4. 🎯 Final ad spend from $995 = ~$982.56')
  }
}

// Run the script
if (require.main === module) {
  creditShadowWalker()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}

module.exports = { creditWallet } 