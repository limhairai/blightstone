const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAdAccounts() {
    console.log('🔍 Debugging Ad Accounts for YC Demo...\n');
    
    try {
        // Get demo user and org
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        const { data: org } = await supabase.from('organizations').select('*').eq('owner_id', demoUser.id).single();
        
        console.log('👤 Demo User:', demoUser.email);
        console.log('🏢 Organization ID:', org.organization_id);
        
        // Check all ad account assets
        console.log('\n1️⃣ Checking all ad account assets...');
        const { data: allAdAssets } = await supabase
            .from('asset')
            .select('*')
            .eq('type', 'ad_account');
        
        console.log('Total ad account assets in system:', allAdAssets?.length || 0);
        allAdAssets?.forEach(ad => {
            console.log(`   - ${ad.name} (${ad.status}) - ID: ${ad.asset_id}`);
        });
        
        // Check asset bindings for YC demo org
        console.log('\n2️⃣ Checking asset bindings for YC demo org...');
        const { data: bindings } = await supabase
            .from('asset_binding')
            .select('*, asset(*)')
            .eq('organization_id', org.organization_id);
        
        console.log('Total asset bindings for YC demo:', bindings?.length || 0);
        bindings?.forEach(binding => {
            if (binding.asset?.type === 'ad_account') {
                console.log(`   - Ad Account: ${binding.asset.name} (active: ${binding.is_active}, status: ${binding.status})`);
            }
        });
        
        // Check specifically for YC Demo ad accounts
        console.log('\n3️⃣ Checking YC Demo ad accounts specifically...');
        const { data: ycAdAssets } = await supabase
            .from('asset')
            .select('*, asset_binding(*)')
            .eq('type', 'ad_account')
            .like('name', 'YC Demo Agency%');
        
        console.log('YC Demo ad account assets:', ycAdAssets?.length || 0);
        ycAdAssets?.forEach(ad => {
            const binding = ad.asset_binding?.[0];
            console.log(`   - ${ad.name} (binding: ${binding ? 'YES' : 'NO'}, org: ${binding?.organization_id}, active: ${binding?.is_active})`);
        });
        
        // Check if there's a query issue
        console.log('\n4️⃣ Testing the exact query the frontend might use...');
        const { data: frontendQuery } = await supabase
            .from('asset')
            .select('*, asset_binding!inner(*)')
            .eq('type', 'ad_account')
            .eq('asset_binding.organization_id', org.organization_id)
            .eq('asset_binding.is_active', true);
        
        console.log('Frontend-style query results:', frontendQuery?.length || 0);
        frontendQuery?.forEach(ad => {
            console.log(`   - ${ad.name} (active: ${ad.asset_binding[0]?.is_active})`);
        });
        
        // Check organization plan status
        console.log('\n5️⃣ Checking organization plan status...');
        console.log('Plan ID:', org.plan_id);
        console.log('Subscription Status:', org.subscription_status);
        console.log('Current Period End:', org.current_period_end);
        
        // Check onboarding states
        console.log('\n6️⃣ Checking onboarding states...');
        const { data: onboarding } = await supabase
            .from('onboarding_states')
            .select('*')
            .eq('organization_id', org.organization_id)
            .single();
        
        if (onboarding) {
            console.log('Onboarding state found:', onboarding);
        } else {
            console.log('No onboarding state found - this might be the issue!');
        }
        
    } catch (error) {
        console.error('❌ Error debugging:', error.message);
    }
}

debugAdAccounts(); 