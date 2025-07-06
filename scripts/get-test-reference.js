#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getTestReference() {
  console.log('🔍 Looking for pending bank transfer requests...')
  
  try {
    const { data: requests, error } = await supabase
      .from('bank_transfer_requests')
      .select('reference_number, requested_amount, organization_id, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ Error fetching requests:', error)
      return
    }

    if (!requests || requests.length === 0) {
      console.log('📝 No pending bank transfer requests found.')
      console.log('💡 Create a bank transfer request in your app first, then run this script.')
      return
    }

    console.log('\n✅ Found pending bank transfer requests:')
    requests.forEach((request, index) => {
      console.log(`\n${index + 1}. Reference: ${request.reference_number}`)
      console.log(`   Amount: $${request.requested_amount}`)
      console.log(`   Org ID: ${request.organization_id}`)
      console.log(`   Created: ${new Date(request.created_at).toLocaleString()}`)
    })

    const latestRequest = requests[0]
    console.log(`\n🎯 Use this reference for testing: ${latestRequest.reference_number}`)
    console.log(`💰 Test amount: $${latestRequest.requested_amount}`)
    
    console.log('\n📋 Copy this command to test:')
    console.log(`node scripts/test-bank-transfer-webhook.js successful_transfer`)
    console.log('\n📝 Or update the test script with this reference number.')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  getTestReference()
}

module.exports = { getTestReference } 