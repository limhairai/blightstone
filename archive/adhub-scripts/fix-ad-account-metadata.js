const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdAccountMetadata() {
    console.log('🔧 Fixing Ad Account Metadata...\n');
    
    try {
        const { data: users } = await supabase.auth.admin.listUsers();
        const demoUser = users.users.find(u => u.email === 'yc-demo@adhub.com');
        const { data: org } = await supabase.from('organizations').select('*').eq('owner_id', demoUser.id).single();
        
        // Get business managers and ad accounts
        const { data: bms } = await supabase
            .from('asset')
            .select('*')
            .eq('type', 'business_manager')
            .like('name', 'YC Demo Agency%');
        
        const { data: adAccounts } = await supabase
            .from('asset')
            .select('*')
            .eq('type', 'ad_account')
            .like('name', 'YC Demo Agency%');
        
        console.log('Found business managers:', bms?.length || 0);
        console.log('Found ad accounts:', adAccounts?.length || 0);
        
        // Create a mapping based on the date in the name
        const bmMap = new Map();
        bms?.forEach(bm => {
            const dateMatch = bm.name.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
                bmMap.set(dateMatch[1], bm);
            }
        });
        
        console.log('\n🔧 Updating ad account metadata...');
        
        // Update each ad account with the corresponding business manager ID
        for (const adAccount of adAccounts || []) {
            const dateMatch = adAccount.name.match(/(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
                const bm = bmMap.get(dateMatch[1]);
                if (bm) {
                    const updatedMetadata = {
                        ...adAccount.metadata,
                        business_manager_id: bm.dolphin_id,
                        business_manager_name: bm.name,
                        business_manager_dolphin_id: bm.dolphin_id
                    };
                    
                    console.log(`   - ${adAccount.name} -> ${bm.name} (${bm.dolphin_id})`);
                    
                    const { error } = await supabase
                        .from('asset')
                        .update({ metadata: updatedMetadata })
                        .eq('asset_id', adAccount.asset_id);
                    
                    if (error) {
                        console.error(`   ❌ Error updating ${adAccount.name}:`, error.message);
                    } else {
                        console.log(`   ✅ Updated ${adAccount.name}`);
                    }
                }
            }
        }
        
        // Verify the updates
        console.log('\n🔍 Verifying updates...');
        const { data: updatedAdAccounts } = await supabase
            .from('asset')
            .select('*')
            .eq('type', 'ad_account')
            .like('name', 'YC Demo Agency%');
        
        updatedAdAccounts?.forEach(ad => {
            console.log(`   - ${ad.name}:`);
            console.log(`     Business Manager ID: ${ad.metadata?.business_manager_id}`);
            console.log(`     Business Manager Name: ${ad.metadata?.business_manager_name}`);
        });
        
        // Test the frontend API filtering
        console.log('\n🔍 Testing frontend API filtering...');
        if (bms && bms.length > 0) {
            const bmId = bms[0].dolphin_id;
            console.log(`Testing filter with BM ID: ${bmId}`);
            
            // This simulates what the frontend API does
            const { data: filteredAccounts } = await supabase.rpc('get_organization_assets', {
                p_organization_id: org.organization_id,
                p_asset_type: 'ad_account'
            });
            
            const accountsForThisBM = filteredAccounts?.filter(ad => 
                ad.metadata?.business_manager_id === bmId
            ) || [];
            
            console.log(`   Found ${accountsForThisBM.length} ad accounts for BM ${bmId}:`);
            accountsForThisBM.forEach(ad => {
                console.log(`     - ${ad.name}`);
            });
        }
        
        console.log('\n🎉 Ad Account Metadata Fixed!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Ad accounts now have business_manager_id in metadata');
        console.log('✅ Frontend filtering by business manager should work');
        console.log('✅ Ad accounts will show up in business manager views');
        
    } catch (error) {
        console.error('❌ Error fixing ad account metadata:', error.message);
    }
}

fixAdAccountMetadata(); 