const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMetadata() {
    console.log('🔍 Checking Asset Metadata...\n');
    
    try {
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        const { data: org } = await supabase.from('organizations').select('*').eq('owner_id', demoUser.id).single();
        
        console.log('🔍 Checking ad account metadata...');
        const { data: adAccounts } = await supabase
            .from('asset')
            .select('*')
            .eq('type', 'ad_account')
            .like('name', 'YC Demo Agency%');
        
        console.log('Ad accounts found:', adAccounts?.length || 0);
        adAccounts?.forEach(ad => {
            console.log(`   - ${ad.name}:`);
            console.log(`     Metadata: ${JSON.stringify(ad.metadata)}`);
            console.log(`     Dolphin ID: ${ad.dolphin_id}`);
        });
        
        console.log('\n🔍 Checking business manager metadata...');
        const { data: bms } = await supabase
            .from('asset')
            .select('*')
            .eq('type', 'business_manager')
            .like('name', 'YC Demo Agency%');
        
        console.log('Business managers found:', bms?.length || 0);
        bms?.forEach(bm => {
            console.log(`   - ${bm.name}:`);
            console.log(`     Metadata: ${JSON.stringify(bm.metadata)}`);
            console.log(`     Dolphin ID: ${bm.dolphin_id}`);
        });
        
        console.log('\n🔍 Testing ad accounts API with bm_id filter...');
        // Test the ad accounts API with a business manager ID
        if (bms && bms.length > 0) {
            const bmId = bms[0].dolphin_id;
            console.log(`Testing with BM ID: ${bmId}`);
            
            // Simulate the frontend API call
            const { data: filteredAccounts } = await supabase.rpc('get_organization_assets', {
                p_organization_id: org.organization_id,
                p_asset_type: 'ad_account'
            });
            
            console.log('All ad accounts from RPC:', filteredAccounts?.length || 0);
            filteredAccounts?.forEach(ad => {
                console.log(`   - ${ad.name} (metadata: ${JSON.stringify(ad.metadata)})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkMetadata(); 