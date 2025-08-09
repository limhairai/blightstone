const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFullDemoData() {
    console.log('🚀 Creating Full Blightstone Demo Data...\n');
    
    try {
        // Get demo user and org
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        const { data: org } = await supabase.from('organizations').select('*').eq('owner_id', demoUser.id).single();
        const { data: wallet } = await supabase.from('wallets').select('*').eq('organization_id', org.organization_id).single();
        
        console.log('👤 Demo User:', demoUser.email);
        console.log('🏢 Organization:', org.name);
        console.log('💳 Wallet ID:', wallet.wallet_id);
        
        // 1. Create Business Manager Applications (client requests)
        console.log('\n1️⃣ Creating business manager applications...');
        const applications = [
            {
                organization_id: org.organization_id,
                name: 'TechStartup Pro BM',
                request_type: 'new_business_manager',
                website_url: 'https://techstartup.pro',
                status: 'fulfilled',
                client_notes: 'Need BM for scaling our tech product campaigns',
                admin_notes: 'Approved - high-quality landing page, good compliance',
                approved_by: demoUser.id,
                approved_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                fulfilled_by: demoUser.id,
                fulfilled_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                name: 'E-commerce Solutions BM',
                request_type: 'new_business_manager',
                website_url: 'https://ecommerce-solutions.com',
                status: 'fulfilled',
                client_notes: 'Expanding e-commerce advertising across multiple products',
                admin_notes: 'Approved - established e-commerce site with good conversion rates',
                approved_by: demoUser.id,
                approved_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
                fulfilled_by: demoUser.id,
                fulfilled_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                name: 'SaaS Analytics BM',
                request_type: 'new_business_manager',
                website_url: 'https://saas-analytics.io',
                status: 'approved',
                client_notes: 'New SaaS product launch, need Facebook advertising setup',
                admin_notes: 'Approved - pending BlueFocus processing',
                approved_by: demoUser.id,
                approved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        for (const app of applications) {
            await supabase.from('application').upsert(app);
        }
        console.log('✅ Created 3 business manager applications');
        
        // 2. Create Asset records (representing BMs and Ad Accounts)
        console.log('\n2️⃣ Creating asset records...');
        const assets = [
            {
                organization_id: org.organization_id,
                type: 'business_manager',
                name: 'TechStartup Pro BM',
                dolphin_id: 'BM_789012345',
                status: 'active',
                metadata: {
                    bm_name: 'TechStartup Pro Business Manager',
                    creation_date: '2024-12-05',
                    ad_accounts_count: 3,
                    spend_limit: '$50,000'
                },
                created_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                type: 'ad_account',
                name: 'TechStartup Pro - Main',
                dolphin_id: 'AD_123456789',
                parent_asset_id: null, // Would reference BM asset in real setup
                status: 'active',
                metadata: {
                    account_id: '123456789012345',
                    currency: 'USD',
                    spend_limit: '$10,000',
                    daily_budget: '$500',
                    campaigns_count: 8
                },
                created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                type: 'ad_account',
                name: 'TechStartup Pro - Retargeting',
                dolphin_id: 'AD_123456790',
                status: 'active',
                metadata: {
                    account_id: '123456789012346',
                    currency: 'USD',
                    spend_limit: '$5,000',
                    daily_budget: '$200',
                    campaigns_count: 4
                },
                created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                type: 'business_manager',
                name: 'E-commerce Solutions BM',
                dolphin_id: 'BM_789012346',
                status: 'active',
                metadata: {
                    bm_name: 'E-commerce Solutions Business Manager',
                    creation_date: '2024-12-12',
                    ad_accounts_count: 2,
                    spend_limit: '$30,000'
                },
                created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                type: 'pixel',
                name: 'TechStartup Pro Pixel',
                dolphin_id: 'PX_789012345',
                status: 'active',
                metadata: {
                    pixel_id: '789012345678901',
                    events_tracked: ['PageView', 'Purchase', 'AddToCart', 'Lead'],
                    last_activity: '2024-12-29'
                },
                created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        for (const asset of assets) {
            await supabase.from('asset').upsert(asset);
        }
        console.log('✅ Created 5 asset records (BMs, Ad Accounts, Pixels)');
        
        // 3. Create Topup Requests (funding workflow)
        console.log('\n3️⃣ Creating topup requests...');
        const topupRequests = [
            {
                organization_id: org.organization_id,
                requested_by: demoUser.id,
                ad_account_id: 'AD_123456789',
                ad_account_name: 'TechStartup Pro - Main',
                amount_cents: 250000, // $2,500
                currency: 'USD',
                status: 'completed',
                request_type: 'topup',
                metadata: {
                    campaign_names: ['Holiday Sale Campaign', 'Brand Awareness Q4'],
                    urgency: 'high'
                },
                processed_by: demoUser.id,
                processed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                fee_amount_cents: 7500, // 3% fee
                total_deducted_cents: 257500,
                plan_fee_percentage: 3.0,
                created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                requested_by: demoUser.id,
                ad_account_id: 'AD_123456790',
                ad_account_name: 'TechStartup Pro - Retargeting',
                amount_cents: 150000, // $1,500
                currency: 'USD',
                status: 'completed',
                request_type: 'topup',
                metadata: {
                    campaign_names: ['Retargeting - Cart Abandoners'],
                    urgency: 'medium'
                },
                processed_by: demoUser.id,
                processed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                fee_amount_cents: 4500, // 3% fee
                total_deducted_cents: 154500,
                plan_fee_percentage: 3.0,
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                requested_by: demoUser.id,
                ad_account_id: 'AD_123456789',
                ad_account_name: 'TechStartup Pro - Main',
                amount_cents: 500000, // $5,000
                currency: 'USD',
                status: 'pending',
                request_type: 'topup',
                metadata: {
                    campaign_names: ['New Year Campaign 2025'],
                    urgency: 'high',
                    notes: 'Scaling successful campaigns for Q1'
                },
                fee_amount_cents: 15000, // 3% fee
                total_deducted_cents: 515000,
                plan_fee_percentage: 3.0,
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        for (const request of topupRequests) {
            await supabase.from('topup_requests').upsert(request);
        }
        console.log('✅ Created 3 topup requests ($9,000 total)');
        
        // 4. Add topup-related transactions
        console.log('\n4️⃣ Adding topup-related transactions...');
        const newTransactions = [
            {
                organization_id: org.organization_id,
                wallet_id: wallet.wallet_id,
                type: 'topup_fee',
                amount_cents: -7500, // Fee for first topup
                status: 'completed',
                description: 'Topup fee (3%) - TechStartup Pro Main ($2,500)',
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                wallet_id: wallet.wallet_id,
                type: 'ad_account_transfer',
                amount_cents: -250000, // Transfer to ad account
                status: 'completed',
                description: 'Transfer to Ad Account - TechStartup Pro Main',
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                wallet_id: wallet.wallet_id,
                type: 'topup_fee',
                amount_cents: -4500, // Fee for second topup
                status: 'completed',
                description: 'Topup fee (3%) - TechStartup Pro Retargeting ($1,500)',
                created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                wallet_id: wallet.wallet_id,
                type: 'ad_account_transfer',
                amount_cents: -150000, // Transfer to ad account
                status: 'completed',
                description: 'Transfer to Ad Account - TechStartup Pro Retargeting',
                created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        for (const transaction of newTransactions) {
            await supabase.from('transactions').upsert(transaction);
        }
        console.log('✅ Added 4 topup-related transactions');
        
        console.log('\n🎉 Full Blightstone Demo Data Created!\n');
        console.log('📊 Demo now includes:');
        console.log('• 3 Business Manager applications (2 fulfilled, 1 approved)');
        console.log('• 2 Business Managers with 3 Ad Accounts total');
        console.log('• 1 Pixel for tracking');
        console.log('• 3 Topup requests ($9,000 total, 2 completed, 1 pending)');
        console.log('• 7 transactions showing full financial workflow');
        console.log('• $25,000 wallet balance minus fees and transfers');
        
        console.log('\n💰 Financial Summary:');
        console.log('• Initial Balance: $25,000');
        console.log('• Topup Fees: -$120 (3% on transfers)');
        console.log('• Ad Account Transfers: -$4,000');
        console.log('• Current Balance: ~$20,880');
        
        console.log('\n🚀 This showcases:');
        console.log('• Complete client onboarding workflow');
        console.log('• Business manager acquisition process');
        console.log('• Ad account funding and management');
        console.log('• Fee structure and transaction history');
        console.log('• Asset tracking and organization');
        
    } catch (error) {
        console.error('❌ Error creating full demo data:', error.message);
    }
}

createFullDemoData(); 