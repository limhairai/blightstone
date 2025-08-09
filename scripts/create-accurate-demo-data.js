const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAccurateDemoData() {
    console.log('🚀 Creating Accurate Blightstone Demo Data...\n');
    
    try {
        // Get demo user and org
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        const { data: org } = await supabase.from('organizations').select('*').eq('owner_id', demoUser.id).single();
        const { data: wallet } = await supabase.from('wallets').select('*').eq('organization_id', org.organization_id).single();
        
        console.log('👤 Demo User:', demoUser.email);
        console.log('🏢 Organization:', org.name);
        
        // 1. Clear existing incorrect data
        console.log('\n1️⃣ Clearing incorrect demo data...');
        await supabase.from('transactions').delete().eq('organization_id', org.organization_id);
        await supabase.from('topup_requests').delete().eq('organization_id', org.organization_id);
        await supabase.from('application').delete().eq('organization_id', org.organization_id);
        await supabase.from('asset').delete().eq('organization_id', org.organization_id);
        console.log('✅ Cleared old data');
        
        // 2. Reset wallet balance
        console.log('\n2️⃣ Setting wallet balance...');
        await supabase
            .from('wallets')
            .update({ balance_cents: 2500000 }) // $25,000
            .eq('organization_id', org.organization_id);
        console.log('✅ Wallet balance set to $25,000');
        
        // 3. Create ONLY wallet top-ups (what Blightstone actually tracks)
        console.log('\n3️⃣ Creating wallet top-up transactions...');
        const walletTopups = [
            {
                organization_id: org.organization_id,
                wallet_id: wallet.wallet_id,
                type: 'top_up',
                amount_cents: 500000, // $5,000
                status: 'completed',
                description: 'Wallet top-up via Stripe',
                created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                wallet_id: wallet.wallet_id,
                type: 'top_up',
                amount_cents: 1000000, // $10,000
                status: 'completed',
                description: 'Wallet top-up via Stripe',
                created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                wallet_id: wallet.wallet_id,
                type: 'top_up',
                amount_cents: 1000000, // $10,000
                status: 'completed',
                description: 'Wallet top-up via Stripe',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        for (const transaction of walletTopups) {
            await supabase.from('transactions').insert(transaction);
        }
        console.log('✅ Created 3 wallet top-up transactions ($25,000 total)');
        
        // 4. Create business manager applications (what clients actually request)
        console.log('\n4️⃣ Creating business manager applications...');
        const applications = [
            {
                organization_id: org.organization_id,
                name: 'First Business Manager Request',
                request_type: 'new_business_manager',
                website_url: 'https://techstartup.pro',
                status: 'fulfilled',
                client_notes: 'Need business manager for our tech product advertising',
                admin_notes: 'Approved - compliant website, good landing pages',
                approved_by: demoUser.id,
                approved_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                fulfilled_by: demoUser.id,
                fulfilled_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                name: 'Second Business Manager Request',
                request_type: 'new_business_manager',
                website_url: 'https://ecommerce-solutions.com',
                status: 'fulfilled',
                client_notes: 'Additional business manager for scaling operations',
                admin_notes: 'Approved - established business with good compliance history',
                approved_by: demoUser.id,
                approved_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
                fulfilled_by: demoUser.id,
                fulfilled_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                name: 'Third Business Manager Request',
                request_type: 'new_business_manager',
                website_url: 'https://saas-analytics.io',
                status: 'approved',
                client_notes: 'Need BM for new product launch campaigns',
                admin_notes: 'Approved - awaiting BlueFocus processing',
                approved_by: demoUser.id,
                approved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        for (const app of applications) {
            await supabase.from('application').insert(app);
        }
        console.log('✅ Created 3 business manager applications');
        
        // 5. Create topup requests (ad account funding - what Blightstone tracks)
        console.log('\n5️⃣ Creating ad account topup requests...');
        const topupRequests = [
            {
                organization_id: org.organization_id,
                requested_by: demoUser.id,
                ad_account_id: '123456789012345',
                ad_account_name: 'YC Demo Agency - 2024-12-05',
                amount_cents: 250000, // $2,500
                currency: 'USD',
                status: 'completed',
                request_type: 'topup',
                metadata: {
                    notes: 'Regular campaign funding'
                },
                processed_by: demoUser.id,
                processed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                fee_amount_cents: 7500, // Your 3% fee
                total_deducted_cents: 257500,
                plan_fee_percentage: 3.0,
                created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                requested_by: demoUser.id,
                ad_account_id: '123456789012346',
                ad_account_name: 'YC Demo Agency - 2024-12-15',
                amount_cents: 150000, // $1,500
                currency: 'USD',
                status: 'completed',
                request_type: 'topup',
                metadata: {
                    notes: 'Campaign scaling'
                },
                processed_by: demoUser.id,
                processed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                fee_amount_cents: 4500, // Your 3% fee
                total_deducted_cents: 154500,
                plan_fee_percentage: 3.0,
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                requested_by: demoUser.id,
                ad_account_id: '123456789012345',
                ad_account_name: 'YC Demo Agency - 2024-12-05',
                amount_cents: 500000, // $5,000
                currency: 'USD',
                status: 'pending',
                request_type: 'topup',
                metadata: {
                    notes: 'New campaign launch'
                },
                fee_amount_cents: 15000, // Your 3% fee
                total_deducted_cents: 515000,
                plan_fee_percentage: 3.0,
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        for (const request of topupRequests) {
            await supabase.from('topup_requests').insert(request);
        }
        console.log('✅ Created 3 ad account topup requests');
        
        console.log('\n🎉 Accurate Blightstone Demo Data Created!\n');
        console.log('📊 Demo Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 User: yc-demo@adhub.com');
        console.log('🏢 Organization: YC Demo Agency (Scale plan)');
        console.log('💳 Wallet Balance: $25,000');
        console.log('📋 BM Applications: 3 (2 fulfilled, 1 approved)');
        console.log('💰 Wallet Top-ups: 3 transactions ($25,000 total)');
        console.log('🎯 Ad Account Topups: 3 requests ($9,000 total)');
        console.log('💸 Your Revenue: $360 in fees (3% of topups)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('\n✅ This accurately shows:');
        console.log('• Client business manager request workflow');
        console.log('• Wallet funding via Stripe payments');
        console.log('• Ad account topup requests and processing');
        console.log('• Your fee structure (3% on ad account topups)');
        console.log('• Realistic ad account naming (org + date)');
        console.log('• Scale-tier customer with healthy usage');
        
    } catch (error) {
        console.error('❌ Error creating accurate demo data:', error.message);
    }
}

createAccurateDemoData(); 