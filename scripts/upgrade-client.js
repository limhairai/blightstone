#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/.env.production' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upgradeClientToStarter(clientEmail, subscriptionMonths = 1) {
  try {
    console.log(`🔍 Looking for client with email: ${clientEmail}`);

    // Step 1: Find the client organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select(`
        organization_id,
        name,
        plan_id,
        profiles!organizations_owner_id_fkey(email)
      `)
      .eq('profiles.email', clientEmail)
      .single();

    if (orgError || !orgData) {
      console.error('❌ Client not found:', orgError?.message || 'No organization found');
      return;
    }

    console.log(`✅ Found organization: ${orgData.name} (ID: ${orgData.organization_id})`);
    console.log(`📋 Current plan: ${orgData.plan_id}`);

    // Step 2: Update organization to starter plan
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + subscriptionMonths);

    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        plan_id: 'starter',
        subscription_status: 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', orgData.organization_id);

    if (updateError) {
      console.error('❌ Failed to update organization:', updateError.message);
      return;
    }

    console.log(`✅ Updated organization to starter plan`);

    // Step 3: Create/update subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        organization_id: orgData.organization_id,
        plan_id: 'starter',
        status: 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (subError) {
      console.error('❌ Failed to create subscription:', subError.message);
      return;
    }

    console.log(`✅ Created subscription record`);

    // Step 4: Verify the upgrade
    const { data: verifyData, error: verifyError } = await supabase
      .from('organizations')
      .select(`
        organization_id,
        name,
        plan_id,
        subscription_status,
        current_period_start,
        current_period_end
      `)
      .eq('organization_id', orgData.organization_id)
      .single();

    if (verifyError) {
      console.error('❌ Failed to verify upgrade:', verifyError.message);
      return;
    }

    console.log('\n🎉 CLIENT SUCCESSFULLY UPGRADED!');
    console.log('=====================================');
    console.log(`📧 Client Email: ${clientEmail}`);
    console.log(`🏢 Organization: ${verifyData.name}`);
    console.log(`📋 Plan: ${verifyData.plan_id}`);
    console.log(`📅 Valid until: ${new Date(verifyData.current_period_end).toLocaleDateString()}`);
    console.log(`💰 Monthly allowance: $15,000`);
    console.log(`🏢 Business Managers: 1`);
    console.log(`📊 Ad Accounts: 3`);
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Get email from command line argument
const clientEmail = process.argv[2];
const months = parseInt(process.argv[3]) || 1;

if (!clientEmail) {
  console.log('Usage: node upgrade-client.js <client-email> [months]');
  console.log('Example: node upgrade-client.js john@example.com 3');
  process.exit(1);
}

upgradeClientToStarter(clientEmail, months); 