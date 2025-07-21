#!/usr/bin/env node

// Script to get real bank transfer reference numbers for testing
const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

async function getTestReferences() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('❌ Missing Supabase credentials')
    console.log('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
    return
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    
    console.log('🔍 Fetching pending bank transfer requests...\n')
    
    // Get pending bank transfer requests
    const { data: pendingRequests, error } = await supabase
      .from('bank_transfer_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Database error:', error.message)
      return
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log('📝 No pending bank transfer requests found.')
      console.log('\n💡 To create a test request:')
      console.log('1. Go to your app → Wallet → Bank Transfer')
      console.log('2. Request any amount ($50-$50,000)')
      console.log('3. Copy the reference number from the result')
      console.log('4. Run this script again')
      return
    }

    console.log(`✅ Found ${pendingRequests.length} pending request(s):\n`)

    pendingRequests.forEach((request, index) => {
      console.log(`${index + 1}. Reference: ${request.reference_number}`)
      console.log(`   Amount: $${request.requested_amount}`)
      console.log(`   Created: ${new Date(request.created_at).toLocaleString()}`)
      console.log(`   Request ID: ${request.request_id}`)
      console.log('')
    })

    if (pendingRequests.length > 0) {
      const firstRef = pendingRequests[0].reference_number
      console.log('🧪 For testing, use this reference number:')
      console.log(`   ${firstRef}`)
      console.log('\n🚀 Test with:')
      console.log(`   AIRWALLEX_WEBHOOK_SECRET=your-secret node scripts/test-bank-transfer-webhook.js successful_transfer`)
      console.log('\n📝 Update the reference in test-bank-transfer-webhook.js:')
      console.log(`   reference: '${firstRef}',`)
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

// Check if tables exist
async function checkTables() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    
    // Test if bank_transfer_requests table exists
    const { data, error } = await supabase
      .from('bank_transfer_requests')
      .select('count')
      .limit(1)

    if (error) {
      console.log('❌ bank_transfer_requests table not found')
      console.log('Run the database migration first:')
      console.log('   Check supabase/migrations/ for bank transfer migrations')
      return false
    }

    return true
  } catch (error) {
    console.log('❌ Database connection failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🏦 Bank Transfer Reference Helper\n')
  
  const tablesExist = await checkTables()
  if (!tablesExist) return

  await getTestReferences()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { getTestReferences } 