const { createClient } = require('@supabase/supabase-js');

// Staging Supabase configuration
const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ Please set SUPABASE_SERVICE_KEY environment variable');
    console.log('Get it from: https://supabase.com/dashboard/project/xewhfrwuzkfbnpwtdxuf/settings/api');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function createYCDemoAccount() {
    console.log('🚀 Creating YC Demo Account for Blightstone...\n');
    
    try {
        // 1. Get or Create YC Demo User
        console.log('1️⃣ Finding/creating YC demo user...');
        
        // First try to find existing user
        const { data: users } = await supabase.auth.admin.listUsers();
        let demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        
        if (!demoUser) {
            // Create user if doesn't exist
            const { data: userData, error: userError } = await supabase.auth.admin.createUser({
                email: 'yc-demo@adhub.com',
                password: 'YC2025Demo!',
                email_confirm: true,
                user_metadata: { 
                    full_name: 'YC Demo User',
                    role: 'demo'
                }
            });
            
            if (userError) {
                throw userError;
            }
            
            demoUser = userData.user;
            console.log('✅ YC Demo user created');
        } else {
            console.log('✅ YC Demo user found');
        }
        
        // 2. Create Demo Organization
        console.log('2️⃣ Creating demo organization...');
        
        // First check if organization exists
        const { data: existingOrg } = await supabase
            .from('organizations')
            .select('*')
            .eq('owner_id', demoUser.id)
            .single();
            
        let org;
        if (existingOrg) {
            // Update existing organization
            const { data: updatedOrg, error: orgError } = await supabase
                .from('organizations')
                .update({
                    name: 'YC Demo Agency',
                    plan_id: 'scale',
                    ad_spend_monthly: '$5,000 - $10,000',
                    industry: 'Digital Marketing Agency',
                    timezone: 'America/New_York',
                    how_heard_about_us: 'Y Combinator',
                })
                .eq('owner_id', demoUser.id)
                .select()
                .single();
                
            if (orgError) throw orgError;
            org = updatedOrg;
            console.log('✅ Demo organization updated');
        } else {
            // Create new organization
            const { data: newOrg, error: orgError } = await supabase
                .from('organizations')
                .insert({
                    name: 'YC Demo Agency',
                    owner_id: demoUser.id,
                    plan_id: 'scale',
                    ad_spend_monthly: '$5,000 - $10,000',
                    industry: 'Digital Marketing Agency',
                    timezone: 'America/New_York',
                    how_heard_about_us: 'Y Combinator',
                    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                })
                .select()
                .single();
                
            if (orgError) throw orgError;
                         org = newOrg;
             console.log('✅ Demo organization created');
         }
        
        // 3. Add user as organization owner
        console.log('3️⃣ Setting up organization ownership...');
        await supabase
            .from('organization_members')
            .upsert({
                organization_id: org.organization_id,
                user_id: demoUser.id,
                role: 'owner'
            }, { onConflict: 'organization_id,user_id' });
            
        console.log('✅ User added as organization owner');
        
        // 4. Create wallet with substantial balance
        console.log('4️⃣ Creating demo wallet...');
        await supabase
            .from('wallets')
            .upsert({
                organization_id: org.organization_id,
                balance_cents: 2500000, // $25,000 balance
                currency: 'USD'
            }, { onConflict: 'organization_id' });
            
        console.log('✅ Demo wallet created with $25,000.00');
        
        // 5. Create sample businesses
        console.log('5️⃣ Creating sample businesses...');
        const businesses = [
            {
                name: 'TechStartup Pro',
                website_url: 'https://techstartup.pro',
                status: 'active',
                organization_id: org.organization_id,
                created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                name: 'E-commerce Solutions',
                website_url: 'https://ecommerce-solutions.com',
                status: 'active',
                organization_id: org.organization_id,
                created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                name: 'SaaS Analytics',
                website_url: 'https://saas-analytics.io',
                status: 'pending',
                organization_id: org.organization_id,
                created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        for (const business of businesses) {
            await supabase.from('businesses').upsert(business, { onConflict: 'name,organization_id' });
        }
        
        console.log('✅ Created 3 sample businesses');
        
        // 6. Create sample transactions
        console.log('6️⃣ Creating transaction history...');
        const transactions = [
            {
                organization_id: org.organization_id,
                type: 'top_up',
                amount_cents: 500000, // $5,000
                status: 'completed',
                description: 'Initial funding - Stripe payment',
                created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                type: 'ad_spend',
                amount_cents: -125000, // -$1,250
                status: 'completed',
                description: 'TechStartup Pro campaign spend',
                created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                type: 'ad_spend',
                amount_cents: -89500, // -$895
                status: 'completed',
                description: 'E-commerce Solutions campaign spend',
                created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                organization_id: org.organization_id,
                type: 'top_up',
                amount_cents: 1000000, // $10,000
                status: 'completed',
                description: 'Monthly funding - Stripe payment',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        for (const transaction of transactions) {
            await supabase.from('transactions').upsert(transaction);
        }
        
        console.log('✅ Created realistic transaction history');
        
        // 7. Update profile
        console.log('7️⃣ Setting up user profile...');
        await supabase
            .from('profiles')
            .upsert({
                profile_id: demoUser.id,
                organization_id: org.organization_id,
                name: 'YC Demo User',
                email: 'yc-demo@adhub.com',
                role: 'client',
                is_superuser: false
            }, { onConflict: 'profile_id' });
            
        console.log('✅ User profile configured');
        
        // 8. Summary
        console.log('\n🎉 YC Demo Account Setup Complete!\n');
        console.log('📋 Demo Account Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌐 URL: https://staging.adhub.tech');
        console.log('📧 Email: yc-demo@adhub.com');
        console.log('🔑 Password: YC2025Demo!');
        console.log('🏢 Organization: YC Demo Agency');
        console.log('💰 Plan: Scale ($199/month)');
        console.log('💳 Wallet Balance: $25,000.00');
        console.log('🏪 Businesses: 3 (2 active, 1 pending)');
        console.log('💸 Monthly Spend: $5,000 - $10,000');
        console.log('🏭 Industry: Digital Marketing Agency');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✨ This account showcases:');
        console.log('• High-value customer profile (Scale tier)');
        console.log('• Multiple business management');
        console.log('• Transaction history with real patterns');
        console.log('• Professional agency setup');
        console.log('• Onboarding data showing growth potential');
        console.log('\n🚀 Perfect for YC investor demos!');
        
    } catch (error) {
        console.error('❌ Error creating YC demo account:', error.message);
        process.exit(1);
    }
}

// Run the setup
createYCDemoAccount(); 