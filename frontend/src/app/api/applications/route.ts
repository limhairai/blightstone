import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// POST /api/applications
// Creates a new application (business manager or ad account)
export async function POST(request: NextRequest) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    // Create service role client to bypass RLS for organization membership checks
    const supabaseService = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { type, business_manager_id, timezone, website_url } = await request.json();

        if (!type) {
            return NextResponse.json({ error: 'Application type is required.' }, { status: 400 });
        }

        // Get user's organization using service role to bypass RLS
        const { data: orgMembership, error: orgError } = await supabaseService
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

        if (orgError || !orgMembership) {
            console.error('Organization membership error:', orgError);
            return NextResponse.json({ error: 'User is not a member of any organization.' }, { status: 403 });
        }

        const organization_id = orgMembership.organization_id;

        // Check organization subscription status using service role
        const { data: orgData, error: orgSubError } = await supabaseService
            .from('organizations')
            .select('plan_id, subscription_status')
            .eq('organization_id', organization_id)
            .single();

        if (orgSubError || !orgData) {
            console.error('Error fetching organization subscription:', orgSubError);
            return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
        }

        // Prevent free users from submitting any type of application
        if (orgData.plan_id === 'free') {
            return NextResponse.json({ 
                error: 'Upgrade Required',
                message: 'Asset applications (business managers and ad accounts) are available on paid plans only. Please upgrade your plan to continue.'
            }, { status: 403 });
        }

        // Check plan limits before allowing applications
        if (type === 'business_manager') {
            // Check if organization can add more business managers
            const { data: canAddBM, error: bmLimitError } = await supabaseService
                .rpc('check_plan_limits', {
                    org_id: organization_id,
                    limit_type: 'businesses'
                });

            if (bmLimitError) {
                console.error('Error checking business manager limits:', bmLimitError);
                return NextResponse.json({ error: 'Failed to check plan limits.' }, { status: 500 });
            }

            if (!canAddBM) {
                return NextResponse.json({ 
                    error: 'Plan Limit Reached',
                    message: 'You have reached the maximum number of business managers for your current plan. Please upgrade to add more business managers.'
                }, { status: 403 });
            }
        } else if (type === 'ad_account') {
            // Check if organization can add more ad accounts
            const { data: canAddAccounts, error: accountLimitError } = await supabaseService
                .rpc('check_plan_limits', {
                    org_id: organization_id,
                    limit_type: 'ad_accounts'
                });

            if (accountLimitError) {
                console.error('Error checking ad account limits:', accountLimitError);
                return NextResponse.json({ error: 'Failed to check plan limits.' }, { status: 500 });
            }

            if (!canAddAccounts) {
                return NextResponse.json({ 
                    error: 'Plan Limit Reached',
                    message: 'You have reached the maximum number of ad accounts for your current plan. Please upgrade to add more ad accounts.'
                }, { status: 403 });
            }
        }

        if (type === 'ad_account') {
            // Handle ad account application
            if (!business_manager_id) {
                return NextResponse.json({ error: 'Business manager ID is required for ad account applications.' }, { status: 400 });
            }

            // Check if the business manager exists and belongs to the user's organization using service role
            const { data: bmBindings, error: bmError } = await supabaseService
                .from('asset_binding')
                .select(`
                    binding_id,
                    asset:asset_id (
                        asset_id,
                        dolphin_id,
                        type,
                        name
                    )
                `)
                .eq('organization_id', organization_id)
                .eq('status', 'active');

            if (bmError) {
                console.error('Business manager lookup error:', bmError);
                return NextResponse.json({ error: 'Failed to lookup business managers.' }, { status: 500 });
            }

            // Filter to find the matching business manager
            const matchingBM = bmBindings?.find((binding: any) => 
                binding.asset && 
                binding.asset.type === 'business_manager' && 
                binding.asset.dolphin_id === business_manager_id
            );

            if (!matchingBM || !matchingBM.asset) {
                console.error('Business manager not found for dolphin_id:', business_manager_id);
                return NextResponse.json({ error: 'Business manager not found or not accessible.' }, { status: 404 });
            }

            // Create application for additional ad accounts using service role
            const { data, error } = await supabaseService
                .from('application')
                .insert({
                    organization_id,
                    request_type: 'additional_accounts',
                    target_bm_dolphin_id: business_manager_id,
                    website_url: website_url || 'N/A', // website_url is required in schema
                    status: 'pending'
                })
                .select()
                .single();

            if (error) {
                console.error('Database error creating ad account application:', error);
                return NextResponse.json({ error: 'Failed to create ad account application.' }, { status: 500 });
            }

            return NextResponse.json({ success: true, application: data });

        } else if (type === 'business_manager') {
            // Handle business manager application
            if (!website_url) {
                return NextResponse.json({ error: 'Website URL is required for business manager applications.' }, { status: 400 });
            }

            // Get organization name for application naming using service role
            const { data: orgNameData, error: orgError } = await supabaseService
                .from('organizations')
                .select('name')
                .eq('organization_id', organization_id)
                .single();

            if (orgError || !orgNameData) {
                console.error('Error fetching organization:', orgError);
                return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
            }

            // Count existing applications for this organization to generate counter using service role
            const { count, error: countError } = await supabaseService
                .from('application')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', organization_id)
                .eq('request_type', 'new_business_manager');

            if (countError) {
                console.error('Error counting applications:', countError);
                return NextResponse.json({ error: 'Failed to generate application name.' }, { status: 500 });
            }

            // Generate application name: AdHub-(Org Name)-(counter)
            const orgName = orgNameData.name.length > 20 ? orgNameData.name.substring(0, 20) : orgNameData.name;
            const cleanOrgName = orgName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
            const counter = String((count || 0) + 1).padStart(2, '0');
            const applicationName = `AdHub-${cleanOrgName}-${counter}`;

            // Insert into the application table using service role
            const { data, error } = await supabaseService
                .from('application')
                .insert({
                    website_url,
                    organization_id,
                    request_type: 'new_business_manager',
                    status: 'pending'
                })
                .select()
                .single();

            if (error) {
                console.error('Database error creating business manager application:', error);
                return NextResponse.json({ error: 'Failed to create business manager application.' }, { status: 500 });
            }

            return NextResponse.json({ success: true, application: data });

        } else {
            return NextResponse.json({ error: 'Invalid application type.' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error creating application:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 