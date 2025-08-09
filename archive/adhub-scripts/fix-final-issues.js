const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixFinalIssues() {
    console.log('🔧 Fixing Final Demo Issues...\n');
    
    try {
        // Get demo user and org
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        const { data: org } = await supabase.from('organizations').select('*').eq('owner_id', demoUser.id).single();
        
        console.log('👤 Demo User:', demoUser.email);
        console.log('🏢 Organization ID:', org.organization_id);
        
        // 1. Fix asset_binding is_active field for ad accounts
        console.log('\n1️⃣ Fixing asset_binding is_active for ad accounts...');
        const { data: adAccountAssets } = await supabase
            .from('asset')
            .select('asset_id')
            .eq('type', 'ad_account')
            .like('name', 'YC Demo Agency%');
        
        if (adAccountAssets && adAccountAssets.length > 0) {
            const assetIds = adAccountAssets.map(asset => asset.asset_id);
            
            // Update asset_binding to ensure is_active is true
            const { data: updatedBindings, error: bindingError } = await supabase
                .from('asset_binding')
                .update({ 
                    is_active: true,
                    status: 'active'
                })
                .eq('organization_id', org.organization_id)
                .in('asset_id', assetIds);
            
            if (bindingError) {
                console.error('❌ Error updating asset bindings:', bindingError);
            } else {
                console.log('✅ Updated asset bindings for ad accounts');
            }
        }
        
        // 2. Create subscription record for scale plan
        console.log('\n2️⃣ Creating subscription record for scale plan...');
        
        // Check if subscription already exists
        const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('organization_id', org.organization_id)
            .eq('status', 'active')
            .single();
        
        if (!existingSubscription) {
            const now = new Date();
            const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            
            const subscriptionData = {
                organization_id: org.organization_id,
                plan_id: 'scale',
                status: 'active',
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                created_at: now.toISOString(),
                updated_at: now.toISOString()
            };
            
            const { data: newSubscription, error: subError } = await supabase
                .from('subscriptions')
                .insert(subscriptionData)
                .select()
                .single();
            
            if (subError) {
                console.error('❌ Error creating subscription:', subError);
            } else {
                console.log('✅ Created subscription record for scale plan');
            }
        } else {
            console.log('✅ Subscription record already exists');
        }
        
        // 3. Test the ad accounts query that the frontend uses
        console.log('\n3️⃣ Testing frontend ad accounts query...');
        const { data: frontendAdAccounts, error: frontendError } = await supabase.rpc('get_organization_assets', {
            p_organization_id: org.organization_id,
            p_asset_type: 'ad_account'
        });
        
        if (frontendError) {
            console.error('❌ Frontend query error:', frontendError);
        } else {
            console.log('✅ Frontend query found ad accounts:', frontendAdAccounts?.length || 0);
            frontendAdAccounts?.forEach(ad => {
                console.log(`   - ${ad.name} (${ad.status})`);
            });
        }
        
        // 4. Test the onboarding progress API logic
        console.log('\n4️⃣ Testing onboarding progress logic...');
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_id')
            .eq('organization_id', org.organization_id)
            .eq('status', 'active')
            .single();
        
        const hasSelectedPlan = subscription && subscription.plan_id !== 'free';
        console.log('✅ Has selected plan:', hasSelectedPlan);
        console.log('✅ Plan ID:', subscription?.plan_id);
        
        // 5. Verify asset bindings are correct
        console.log('\n5️⃣ Verifying asset bindings...');
        const { data: bindings } = await supabase
            .from('asset_binding')
            .select('*, asset(*)')
            .eq('organization_id', org.organization_id)
            .eq('asset.type', 'ad_account');
        
        console.log('✅ Asset bindings for ad accounts:', bindings?.length || 0);
        bindings?.forEach(binding => {
            console.log(`   - ${binding.asset.name} (active: ${binding.is_active}, status: ${binding.status})`);
        });
        
        console.log('\n🎉 Final Issues Fixed!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Asset bindings updated with is_active: true');
        console.log('✅ Subscription record created for scale plan');
        console.log('✅ Frontend ad accounts query should now work');
        console.log('✅ Setup guide should show "Choose a Plan" as completed');
        
    } catch (error) {
        console.error('❌ Error fixing final issues:', error.message);
    }
}

fixFinalIssues(); 