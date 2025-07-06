#!/usr/bin/env node

const crypto = require('crypto')

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/airwallex'
const WEBHOOK_SECRET = process.env.AIRWALLEX_WEBHOOK_SECRET || 'test-secret-key'

// Test scenarios
const testScenarios = {
  successful_transfer: {
    name: 'transfer.completed',
    data: {
      object: {
        id: 'txn_test_' + Date.now(),
        amount: 500.00,
        currency: 'USD',
        reference: 'ADHUB-9015780E-03E3CCA3-1560', // Real reference from database
        description: 'Bank transfer from client',
        memo: 'ADHUB-9015780E-03E3CCA3-1560',
        status: 'completed',
        created_at: new Date().toISOString(),
        metadata: {
          reference: 'ADHUB-9015780E-03E3CCA3-1560'
        }
      }
    }
  },
  
  failed_transfer: {
    name: 'transfer.failed',
    data: {
      object: {
        id: 'txn_fail_' + Date.now(),
        amount: 100.00,
        currency: 'USD',
        reference: 'ADHUB-9015780E-03E3CCA3-1560',
        description: 'Failed bank transfer',
        status: 'failed',
        failure_reason: 'Insufficient funds',
        created_at: new Date().toISOString()
      }
    }
  },
  
  unmatched_transfer: {
    name: 'transfer.completed',
    data: {
      object: {
        id: 'txn_unmatched_' + Date.now(),
        amount: 100.00,
        currency: 'USD',
        reference: 'INVALID-REFERENCE-123', // This won't match our pattern
        description: 'Transfer with invalid reference',
        status: 'completed',
        created_at: new Date().toISOString()
      }
    }
  }
}

function generateSignature(body, secret) {
  return 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
}

async function testWebhook(scenarioName, scenario) {
  console.log(`\n🧪 Testing scenario: ${scenarioName}`)
  console.log('📤 Sending webhook...')
  
  const body = JSON.stringify(scenario)
  
  // For development testing, don't send signature if no secret is configured
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Airwallex-Webhook/1.0'
  }
  
  if (WEBHOOK_SECRET && WEBHOOK_SECRET !== 'test-secret-key') {
    const signature = generateSignature(body, WEBHOOK_SECRET)
    headers['x-airwallex-signature'] = signature
    console.log('🔐 Using signature verification')
  } else {
    console.log('⚠️ Running in development mode without signature')
  }
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: headers,
      body: body
    })
    
    const responseText = await response.text()
    
    if (response.ok) {
      console.log('✅ Webhook successful')
      console.log('📥 Response:', responseText)
    } else {
      console.log('❌ Webhook failed')
      console.log('📥 Status:', response.status)
      console.log('📥 Response:', responseText)
    }
    
  } catch (error) {
    console.log('💥 Error sending webhook:', error.message)
  }
}

async function main() {
  console.log('🚀 Bank Transfer Webhook Tester')
  console.log('🎯 Target URL:', WEBHOOK_URL)
  console.log('🔐 Using webhook secret:', WEBHOOK_SECRET ? 'configured' : 'not configured')
  
  const scenario = process.argv[2] || 'successful_transfer'
  
  if (!testScenarios[scenario]) {
    console.log('\n❌ Unknown scenario. Available scenarios:')
    Object.keys(testScenarios).forEach(name => {
      console.log(`   - ${name}`)
    })
    process.exit(1)
  }
  
  console.log('\n⚠️  IMPORTANT: Make sure you have a real bank transfer request in your database')
  console.log('   with reference number: ADHUB-12345678-87654321-1234')
  console.log('   or update the reference in this script to match an existing request.\n')
  
  await testWebhook(scenario, testScenarios[scenario])
  
  console.log('\n✅ Test completed!')
  console.log('💡 Check your application logs and database to verify the webhook was processed correctly.')
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testScenarios, generateSignature, testWebhook } 