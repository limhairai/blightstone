import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organization_id');

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
        }

        // Fetch both bound Business Managers (Dolphin assets) and business applications
        const [dolphinData, businessAppsData] = await Promise.all([
            // 1. Bound Business Managers from Dolphin
            supabase
                .from('dolphin_assets')
                .select(`
                    *,
                    client_asset_bindings!inner(
                        id,
                        organization_id,
                        business_id,
                        spend_limit_cents,
                        fee_percentage,
                        status,
                        bound_at
                    )
                `)
                .eq('asset_type', 'business_manager')
                .eq('client_asset_bindings.organization_id', organizationId)
                .eq('client_asset_bindings.status', 'active')
                .order('discovered_at', { ascending: false }),
            
            // 2. Business applications from businesses table
            supabase
                .from('businesses')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })
        ]);

        if (dolphinData.error) {
            console.error('Supabase error fetching business managers:', dolphinData.error);
            return NextResponse.json({ error: 'Failed to fetch business managers' }, { status: 500 });
        }

        if (businessAppsData.error) {
            console.error('Supabase error fetching business applications:', businessAppsData.error);
            return NextResponse.json({ error: 'Failed to fetch business applications' }, { status: 500 });
        }

        // Transform bound Business Managers from Dolphin
        const boundBusinessManagers = (dolphinData.data || []).map(asset => {
            const binding = asset.client_asset_bindings[0];
            const metadata = asset.asset_metadata || {};
            
            return {
                id: asset.id,
                name: asset.name,
                status: asset.status,
                website_url: metadata.website_url || null,
                landing_page: metadata.landing_page || null,
                organization_id: binding.organization_id,
                created_at: asset.discovered_at,
                facebook_id: asset.asset_id,
                ad_accounts_count: metadata.cabs_count || 0,
                monthly_spend: metadata.monthly_spend || 0,
                balance: metadata.balance || 0,
                currency: metadata.currency || 'USD',
                bound_at: binding.bound_at,
                is_business_manager: true
            };
        });

        // Transform business applications
        const businessApplications = (businessAppsData.data || []).map(business => ({
            id: business.id,
            name: business.name,
            status: business.status,
            website_url: business.website_url,
            landing_page: business.landing_page,
            organization_id: business.organization_id,
            created_at: business.created_at,
            // Default values for applications
            facebook_id: null,
            ad_accounts_count: 0,
            monthly_spend: 0,
            balance: 0,
            currency: 'USD',
            bound_at: null,
            is_business_manager: false
        }));

        // Combine both lists
        const businesses = [...boundBusinessManagers, ...businessApplications];

        return NextResponse.json({ businesses });

    } catch (error) {
        console.error('Error fetching businesses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, website, organization_id } = body;

        if (!name || !organization_id) {
            return NextResponse.json({ 
                error: 'Business name and organization ID are required' 
            }, { status: 400 });
        }

        // Create business application in the businesses table
        const { data, error } = await supabase
            .from('businesses')
            .insert({
                name,
                website_url: website,
                organization_id,
                status: 'In Review', // All new business applications start in review
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating business application:', error);
            return NextResponse.json({ 
                error: 'Failed to create business application' 
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            business: data,
            message: 'Business application submitted successfully'
        });

    } catch (error) {
        console.error('Error creating business application:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    return NextResponse.json({ 
        error: 'Business Manager details cannot be modified. Contact support for assistance.' 
    }, { status: 400 });
} 