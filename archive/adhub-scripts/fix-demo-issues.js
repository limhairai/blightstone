const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDemoIssues() {
    console.log('🔧 Fixing YC Demo Account Issues...\n');
    
    try {
        // Get demo user and org
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        const { data: org } = await supabase.from('organizations').select('*').eq('owner_id', demoUser.id).single();
        
        console.log('👤 Demo User:', demoUser.email);
        console.log('🏢 Organization ID:', org.organization_id);
        
        // 1. Fix organization plan period
        console.log('\n1️⃣ Fixing organization plan period...');
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        
        await supabase
            .from('organizations')
            .update({
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                subscription_status: 'active'
            })
            .eq('organization_id', org.organization_id);
        
        console.log('✅ Set plan period: now to', periodEnd.toLocaleDateString());
        
        // 2. Create onboarding state
        console.log('\n2️⃣ Creating onboarding state...');
        const onboardingState = {
            organization_id: org.organization_id,
            step: 'completed',
            completed_steps: [
                'choose_plan',
                'fund_wallet', 
                'apply_business_manager',
                'add_pixel',
                'topup_ad_account'
            ],
            current_step: 'completed',
            is_completed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Check if onboarding state exists
        const { data: existingOnboarding } = await supabase
            .from('onboarding_states')
            .select('*')
            .eq('organization_id', org.organization_id)
            .single();
        
        if (existingOnboarding) {
            await supabase
                .from('onboarding_states')
                .update(onboardingState)
                .eq('organization_id', org.organization_id);
            console.log('✅ Updated existing onboarding state');
        } else {
            await supabase
                .from('onboarding_states')
                .insert(onboardingState);
            console.log('✅ Created new onboarding state');
        }
        
        // 3. Verify the fixes
        console.log('\n3️⃣ Verifying fixes...');
        const { data: updatedOrg } = await supabase
            .from('organizations')
            .select('*')
            .eq('organization_id', org.organization_id)
            .single();
        
        const { data: updatedOnboarding } = await supabase
            .from('onboarding_states')
            .select('*')
            .eq('organization_id', org.organization_id)
            .single();
        
        console.log('✅ Organization plan period:', updatedOrg.current_period_end ? 'SET' : 'NULL');
        console.log('✅ Onboarding state:', updatedOnboarding ? 'EXISTS' : 'MISSING');
        console.log('✅ Onboarding completed:', updatedOnboarding?.is_completed ? 'YES' : 'NO');
        
        // 4. Test ad accounts query again
        console.log('\n4️⃣ Testing ad accounts query...');
        const { data: adAccounts } = await supabase
            .from('asset')
            .select('*, asset_binding!inner(*)')
            .eq('type', 'ad_account')
            .eq('asset_binding.organization_id', org.organization_id)
            .eq('asset_binding.is_active', true);
        
        console.log('✅ Ad accounts found:', adAccounts?.length || 0);
        adAccounts?.forEach(ad => {
            console.log(`   - ${ad.name} (active: ${ad.asset_binding[0]?.is_active})`);
        });
        
        console.log('\n🎉 Demo Account Issues Fixed!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Plan period set correctly');
        console.log('✅ Onboarding state created');
        console.log('✅ Setup guide should show all steps completed');
        console.log('✅ Ad accounts should now display properly');
        
    } catch (error) {
        console.error('❌ Error fixing demo issues:', error.message);
    }
}

fixDemoIssues(); 