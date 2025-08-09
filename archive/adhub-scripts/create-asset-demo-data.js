const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAssetDemoData() {
    console.log('🚀 Creating Asset-Based Demo Data for Blightstone...\n');
    
    try {
        // Get demo user and org
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        const { data: org } = await supabase.from('organizations').select('*').eq('owner_id', demoUser.id).single();
        
        console.log('👤 Demo User:', demoUser.email);
        console.log('🏢 Organization:', org.name);
        
        // 1. Clear existing asset data
        console.log('\n1️⃣ Clearing existing asset data...');
        await supabase.from('asset_binding').delete().eq('organization_id', org.organization_id);
        await supabase.from('asset').delete().in('dolphin_id', [
            'bm_123456789',
            'bm_987654321', 
            'bm_456789123',
            'ad_111222333',
            'ad_444555666',
            'ad_777888999',
            'pixel_123456',
            'pixel_789012'
        ]);
        console.log('✅ Cleared old asset data');
        
        // 2. Create Business Manager assets
        console.log('\n2️⃣ Creating Business Manager assets...');
        const businessManagers = [
            {
                type: 'business_manager',
                dolphin_id: 'bm_123456789',
                name: 'YC Demo Agency - 2024-12-05',
                status: 'active',
                metadata: {
                    website_url: 'https://techstartup.pro',
                    application_notes: 'Approved - compliant website, good landing pages'
                }
            },
            {
                type: 'business_manager', 
                dolphin_id: 'bm_987654321',
                name: 'YC Demo Agency - 2024-12-15',
                status: 'active',
                metadata: {
                    website_url: 'https://ecommerce-solutions.com',
                    application_notes: 'Approved - established business with good compliance history'
                }
            },
            {
                type: 'business_manager',
                dolphin_id: 'bm_456789123', 
                name: 'YC Demo Agency - 2024-12-20',
                status: 'active',
                metadata: {
                    website_url: 'https://saas-analytics.io',
                    application_notes: 'Approved - awaiting BlueFocus processing'
                }
            }
        ];
        
        for (const bm of businessManagers) {
            await supabase.from('asset').insert(bm);
        }
        console.log('✅ Created 3 business manager assets');
        
        // 3. Create Ad Account assets
        console.log('\n3️⃣ Creating Ad Account assets...');
        const adAccounts = [
            {
                type: 'ad_account',
                dolphin_id: 'ad_111222333',
                name: 'YC Demo Agency - 2024-12-05',
                status: 'active',
                metadata: {
                    account_type: 'business',
                    currency: 'USD',
                    timezone: 'America/New_York'
                }
            },
            {
                type: 'ad_account',
                dolphin_id: 'ad_444555666',
                name: 'YC Demo Agency - 2024-12-15', 
                status: 'active',
                metadata: {
                    account_type: 'business',
                    currency: 'USD',
                    timezone: 'America/New_York'
                }
            },
            {
                type: 'ad_account',
                dolphin_id: 'ad_777888999',
                name: 'YC Demo Agency - 2024-12-20',
                status: 'active', 
                metadata: {
                    account_type: 'business',
                    currency: 'USD',
                    timezone: 'America/New_York'
                }
            }
        ];
        
        for (const ad of adAccounts) {
            await supabase.from('asset').insert(ad);
        }
        console.log('✅ Created 3 ad account assets');
        
        // 4. Create Pixel assets
        console.log('\n4️⃣ Creating Pixel assets...');
        const pixels = [
            {
                type: 'pixel',
                dolphin_id: 'pixel_123456',
                name: 'YC Demo Agency - Main Pixel',
                status: 'active',
                metadata: {
                    pixel_type: 'standard',
                    domain: 'techstartup.pro'
                }
            },
            {
                type: 'pixel',
                dolphin_id: 'pixel_789012',
                name: 'YC Demo Agency - Retargeting Pixel',
                status: 'active',
                metadata: {
                    pixel_type: 'standard',
                    domain: 'ecommerce-solutions.com'
                }
            }
        ];
        
        for (const pixel of pixels) {
            await supabase.from('asset').insert(pixel);
        }
        console.log('✅ Created 2 pixel assets');
        
        // 5. Create Asset Bindings (link assets to organization)
        console.log('\n5️⃣ Creating Asset Bindings...');
        
        // Get all created assets
        const { data: allAssets } = await supabase.from('asset').select('*').in('dolphin_id', [
            'bm_123456789', 'bm_987654321', 'bm_456789123',
            'ad_111222333', 'ad_444555666', 'ad_777888999',
            'pixel_123456', 'pixel_789012'
        ]);
        
        const assetBindings = allAssets.map(asset => ({
            asset_id: asset.asset_id,
            organization_id: org.organization_id,
            status: 'active',
            bound_by: demoUser.id,
            bound_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            last_activity_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            total_topup_amount_cents: asset.type === 'ad_account' ? 
                Math.floor(Math.random() * 500000) + 100000 : 0 // $1,000 - $6,000 for ad accounts
        }));
        
        for (const binding of assetBindings) {
            await supabase.from('asset_binding').insert(binding);
        }
        console.log('✅ Created asset bindings for all assets');
        
        console.log('\n🎉 Asset-Based Demo Data Created!\n');
        console.log('📊 Demo Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 User: yc-demo@adhub.com');
        console.log('🏢 Organization: YC Demo Agency (Scale plan)');
        console.log('💳 Wallet Balance: $25,000');
        console.log('📋 Business Managers: 3 active');
        console.log('🎯 Ad Accounts: 3 active');
        console.log('📊 Pixels: 2 active');
        console.log('💰 Wallet Top-ups: 3 transactions ($25,000 total)');
        console.log('🎯 Ad Account Topups: 3 requests ($9,000 total)');
        console.log('💸 Your Revenue: $270 in fees (3% of topups)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('\n✅ This shows Blightstone\'s actual asset system:');
        console.log('• Unified asset table for BMs, Ad Accounts, and Pixels');
        console.log('• Asset bindings linking assets to organizations');
        console.log('• Realistic naming (org + date)');
        console.log('• Active status for all assets');
        console.log('• Topup history for ad accounts');
        console.log('• Complete workflow from application to fulfillment');
        
    } catch (error) {
        console.error('❌ Error creating asset demo data:', error.message);
    }
}

createAssetDemoData(); 