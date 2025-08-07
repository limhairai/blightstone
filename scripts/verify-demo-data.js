const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ Please set SUPABASE_SERVICE_KEY environment variable');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDemoData() {
    console.log('🔍 Verifying YC Demo Account Data...\n');
    
    try {
        // 1. Check user
        console.log('1️⃣ Checking user...');
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        
        if (!demoUser) {
            console.log('❌ Demo user not found');
            return;
        }
        console.log('✅ Demo user found:', demoUser.email);
        
        // 2. Check organization
        console.log('2️⃣ Checking organization...');
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('owner_id', demoUser.id)
            .single();
            
        if (orgError || !org) {
            console.log('❌ Demo organization not found:', orgError?.message);
            return;
        }
        console.log('✅ Demo organization found:', org.name);
        
        // 3. Check wallet
        console.log('3️⃣ Checking wallet...');
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('*')
            .eq('organization_id', org.organization_id)
            .single();
            
        if (walletError || !wallet) {
            console.log('❌ Demo wallet not found:', walletError?.message);
        } else {
            console.log('✅ Demo wallet found: $' + (wallet.balance_cents / 100).toLocaleString());
        }
        
        // 4. Check businesses
        console.log('4️⃣ Checking businesses...');
        const { data: businesses, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('organization_id', org.organization_id);
            
        if (businessError) {
            console.log('❌ Error checking businesses:', businessError.message);
        } else {
            console.log('✅ Businesses found:', businesses?.length || 0);
            businesses?.forEach(b => console.log(`   - ${b.name} (${b.status})`));
        }
        
        // 5. Check transactions
        console.log('5️⃣ Checking transactions...');
        const { data: transactions, error: transError } = await supabase
            .from('transactions')
            .select('*')
            .eq('organization_id', org.organization_id)
            .order('created_at', { ascending: false });
            
        if (transError) {
            console.log('❌ Error checking transactions:', transError.message);
        } else {
            console.log('✅ Transactions found:', transactions?.length || 0);
            transactions?.forEach(t => {
                const amount = t.amount_cents / 100;
                const sign = amount >= 0 ? '+' : '';
                console.log(`   - ${sign}$${amount.toLocaleString()} - ${t.description}`);
            });
        }
        
        // 6. Check profile
        console.log('6️⃣ Checking profile...');
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('profile_id', demoUser.id)
            .single();
            
        if (profileError) {
            console.log('❌ Profile not found:', profileError.message);
        } else {
            console.log('✅ Profile found:', profile.name, profile.email);
        }
        
        console.log('\n🎯 Demo Account Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 User: yc-demo@adhub.com');
        console.log('🏢 Organization:', org.name);
        console.log('💰 Plan:', org.plan_id);
        console.log('💳 Wallet: $' + ((wallet?.balance_cents || 0) / 100).toLocaleString());
        console.log('🏪 Businesses:', businesses?.length || 0);
        console.log('💸 Transactions:', transactions?.length || 0);
        console.log('🌍 Industry:', org.industry);
        console.log('💵 Monthly Spend:', org.ad_spend_monthly);
        
        console.log('\n🚀 To test as YC investor:');
        console.log('1. Open incognito browser');
        console.log('2. Go to: https://staging.adhub.tech');
        console.log('3. Login: yc-demo@adhub.com / YC2025Demo!');
        
    } catch (error) {
        console.error('❌ Error verifying demo data:', error.message);
    }
}

verifyDemoData(); 