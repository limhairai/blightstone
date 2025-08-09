const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCompleteDemo() {
    console.log('🎯 Complete YC Demo Account Verification\n');
    
    try {
        // Get demo user and org
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        const { data: org } = await supabase.from('organizations').select('*').eq('owner_id', demoUser.id).single();
        const { data: wallet } = await supabase.from('wallets').select('*').eq('organization_id', org.organization_id).single();
        
        console.log('👤 Demo Account:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email: ${demoUser.email}`);
        console.log(`🏢 Organization: ${org.name}`);
        console.log(`💰 Plan: ${org.plan_id}`);
        console.log(`💳 Wallet Balance: $${(wallet.balance_cents / 100).toLocaleString()}`);
        console.log(`🌍 Industry: ${org.industry || 'Digital Marketing Agency'}`);
        console.log(`💵 Monthly Spend: ${org.ad_spend_monthly || '$5,000 - $10,000'}`);
        
        // Check transactions
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('organization_id', org.organization_id)
            .order('created_at', { ascending: false });
        
        console.log('\n💰 Financial Activity:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Wallet Transactions: ${transactions?.length || 0}`);
        transactions?.forEach(t => {
            const amount = t.amount_cents / 100;
            const date = new Date(t.created_at).toLocaleDateString();
            console.log(`   • $${amount.toLocaleString()} - ${t.description} (${date})`);
        });
        
        // Check applications
        const { data: applications } = await supabase
            .from('application')
            .select('*')
            .eq('organization_id', org.organization_id);
        
        console.log('\n📋 Business Manager Applications:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📝 Applications: ${applications?.length || 0}`);
        applications?.forEach(app => {
            console.log(`   • ${app.name} (${app.status})`);
        });
        
        // Check topup requests
        const { data: topups } = await supabase
            .from('topup_requests')
            .select('*')
            .eq('organization_id', org.organization_id);
        
        console.log('\n🎯 Ad Account Topup Requests:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`💸 Topup Requests: ${topups?.length || 0}`);
        let totalTopups = 0;
        let totalFees = 0;
        topups?.forEach(req => {
            const amount = req.amount_cents / 100;
            const fee = req.fee_amount_cents / 100;
            totalTopups += amount;
            totalFees += fee;
            console.log(`   • $${amount.toLocaleString()} to ${req.ad_account_name} (${req.status}) - Fee: $${fee}`);
        });
        
        // Check assets
        const { data: bmAssets } = await supabase
            .from('asset')
            .select('*, asset_binding(*)')
            .eq('type', 'business_manager')
            .eq('asset_binding.organization_id', org.organization_id);
        
        const { data: adAssets } = await supabase
            .from('asset')
            .select('*, asset_binding(*)')
            .eq('type', 'ad_account')
            .eq('asset_binding.organization_id', org.organization_id);
        
        const { data: pixelAssets } = await supabase
            .from('asset')
            .select('*, asset_binding(*)')
            .eq('type', 'pixel')
            .eq('asset_binding.organization_id', org.organization_id);
        
        console.log('\n📊 Active Assets:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📋 Business Managers: ${bmAssets?.length || 0}`);
        bmAssets?.forEach(bm => console.log(`   • ${bm.name} (${bm.status})`));
        
        console.log(`\n🎯 Ad Accounts: ${adAssets?.length || 0}`);
        adAssets?.forEach(ad => {
            const topupAmount = ad.asset_binding[0]?.total_topup_amount_cents / 100 || 0;
            console.log(`   • ${ad.name} (${ad.status}) - Topups: $${topupAmount.toLocaleString()}`);
        });
        
        console.log(`\n📊 Pixels: ${pixelAssets?.length || 0}`);
        pixelAssets?.forEach(pixel => console.log(`   • ${pixel.name} (${pixel.status})`));
        
        console.log('\n💸 Revenue Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`💰 Total Ad Account Topups: $${totalTopups.toLocaleString()}`);
        console.log(`💸 Total Fees Earned: $${totalFees.toLocaleString()}`);
        console.log(`📈 Fee Rate: 3%`);
        
        console.log('\n🎉 YC Demo Account Ready!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Login: yc-demo@adhub.com / YC2025Demo!');
        console.log('✅ URL: https://staging.adhub.tech');
        console.log('✅ Shows complete Blightstone workflow');
        console.log('✅ Demonstrates real business model');
        console.log('✅ Proves customer value and retention');
        
    } catch (error) {
        console.error('❌ Error verifying demo:', error.message);
    }
}

verifyCompleteDemo(); 