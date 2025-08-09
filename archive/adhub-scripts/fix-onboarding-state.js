const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixOnboardingState() {
    console.log('🔧 Fixing Onboarding State for YC Demo...\n');
    
    try {
        // Get demo user
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        
        console.log('👤 Demo User:', demoUser.email);
        console.log('🆔 User ID:', demoUser.id);
        
        // Create correct onboarding state
        console.log('\n1️⃣ Creating correct onboarding state...');
        const onboardingState = {
            user_id: demoUser.id,
            has_created_organization: true,
            has_verified_email: true,
            has_completed_profile: true,
            has_submitted_application: true,
            has_received_assets: true,
            has_made_first_topup: true,
            current_step: 'completed',
            completed_at: new Date().toISOString(),
            has_explicitly_dismissed: false
        };
        
        // Check if onboarding state exists
        const { data: existingOnboarding } = await supabase
            .from('onboarding_states')
            .select('*')
            .eq('user_id', demoUser.id)
            .single();
        
        if (existingOnboarding) {
            await supabase
                .from('onboarding_states')
                .update(onboardingState)
                .eq('user_id', demoUser.id);
            console.log('✅ Updated existing onboarding state');
        } else {
            await supabase
                .from('onboarding_states')
                .insert(onboardingState);
            console.log('✅ Created new onboarding state');
        }
        
        // Verify the fix
        console.log('\n2️⃣ Verifying onboarding state...');
        const { data: updatedOnboarding } = await supabase
            .from('onboarding_states')
            .select('*')
            .eq('user_id', demoUser.id)
            .single();
        
        if (updatedOnboarding) {
            console.log('✅ Onboarding state found!');
            console.log('   - Organization created:', updatedOnboarding.has_created_organization);
            console.log('   - Email verified:', updatedOnboarding.has_verified_email);
            console.log('   - Profile completed:', updatedOnboarding.has_completed_profile);
            console.log('   - Application submitted:', updatedOnboarding.has_submitted_application);
            console.log('   - Assets received:', updatedOnboarding.has_received_assets);
            console.log('   - First topup made:', updatedOnboarding.has_made_first_topup);
            console.log('   - Current step:', updatedOnboarding.current_step);
            console.log('   - Completed at:', updatedOnboarding.completed_at);
        } else {
            console.log('❌ Onboarding state still missing');
        }
        
        console.log('\n🎉 Onboarding State Fixed!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Setup guide should now show all steps completed');
        console.log('✅ "Choose a Plan" should be marked as done');
        
    } catch (error) {
        console.error('❌ Error fixing onboarding state:', error.message);
    }
}

fixOnboardingState(); 