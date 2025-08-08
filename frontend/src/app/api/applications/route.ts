import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getPlanPricing } from '@/lib/config/pricing-config';

// Helper function to associate pages with an application
async function associatePagesWithApplication(
    supabaseService: any,
    applicationId: string,
    pageIds: string[],
    organizationId: string
): Promise<boolean> {
    if (!pageIds || pageIds.length === 0) {
        return true; // No pages to associate
    }

    try {
        // First, verify that all page IDs belong to the organization
        const { data: pages, error: pagesError } = await supabaseService
            .from('pages')
            .select('page_id')
            .eq('organization_id', organizationId)
            .in('page_id', pageIds);

        if (pagesError) {
            console.error('Error verifying pages:', pagesError);
            return false;
        }

        if (!pages || pages.length !== pageIds.length) {
            console.error('Some pages do not belong to the organization');
            return false;
        }

        // Create application_pages associations
        const applicationPages = pageIds.map(pageId => ({
            application_id: applicationId,
            page_id: pageId
        }));

        const { error: associationError } = await supabaseService
            .from('application_pages')
            .insert(applicationPages);

        if (associationError) {
            console.error('Error creating page associations:', associationError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in associatePagesWithApplication:', error);
        return false;
    }
}

// Helper function to check plan limits using pricing config
async function checkPlanLimit(organizationId: string, limitType: 'businessManagers' | 'adAccounts' | 'pixels'): Promise<boolean> {
    const supabaseService = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get organization plan
    const { data: orgData, error: orgError } = await supabaseService
        .from('organizations')
        .select('plan_id')
        .eq('organization_id', organizationId)
        .single();

    if (orgError || !orgData) {
        console.error('Error fetching organization plan:', orgError);
        return false;
    }

    const planId = orgData.plan_id || 'free';
    const planLimits = getPlanPricing(planId);

    if (!planLimits) {
        return false;
    }

    // Get current usage counts
    let currentCount = 0;
    let pendingCount = 0;

    if (limitType === 'businessManagers') {
        // Count active business managers
        const { count: activeCount } = await supabaseService
            .from('asset_binding')
            .select('*, asset!inner(type)', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('asset.type', 'business_manager')
            .eq('status', 'active')
            .eq('is_active', true);

        // Count pending business manager applications
        const { count: pendingBMCount } = await supabaseService
            .from('application')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('request_type', 'new_business_manager')
            .in('status', ['pending', 'processing']);

        currentCount = (activeCount || 0) + (pendingBMCount || 0);
        const limit = planLimits.businessManagers;
        return limit === -1 || currentCount < limit;

    } else if (limitType === 'adAccounts') {
        // Count active ad accounts
        const { count: activeCount } = await supabaseService
            .from('asset_binding')
            .select('*, asset!inner(type)', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('asset.type', 'ad_account')
            .eq('status', 'active')
            .eq('is_active', true);

        // Count pending ad account applications
        const { count: pendingAACount } = await supabaseService
            .from('application')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('request_type', 'additional_accounts')
            .in('status', ['pending', 'processing']);

        currentCount = (activeCount || 0) + (pendingAACount || 0);
        const limit = planLimits.adAccounts;
        return limit === -1 || currentCount < limit;

    } else if (limitType === 'pixels') {
        // Count active pixels
        const { count: activeCount } = await supabaseService
            .from('asset_binding')
            .select('*, asset!inner(type)', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('asset.type', 'pixel')
            .eq('status', 'active')
            .eq('is_active', true);

        // Count pending pixel applications
        const { count: pendingPixelCount } = await supabaseService
            .from('application')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('request_type', 'pixel_connection')
            .in('status', ['pending', 'processing']);

        currentCount = (activeCount || 0) + (pendingPixelCount || 0);
        const limit = planLimits.pixels;
        return limit === -1 || currentCount < limit;
    }

    return false;
}

// GET /api/applications
// Fetch user's applications
export async function GET(request: NextRequest) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('profile_id', user.id)
        .single();

    if (!profile?.organization_id) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    try {
        // Fetch applications for user's organization
        const { data: applications, error } = await supabase
            .from('application')
            .select(`
                application_id,
                name,
                website_url,
                status,
                created_at,
                updated_at,
                request_type,
                client_notes,
                admin_notes
            `)
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching applications:', error);
            return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
        }

        // Transform data to match frontend interface
        const transformedApplications = (applications || []).map((app: any) => ({
            id: app.application_id,
            account_name: app.name || 'Application',
            website_url: app.website_url,
            spend_limit: 0, // Not stored in current schema
            status: app.status,
            submitted_at: app.created_at,
            reviewed_at: app.updated_at,
            rejection_reason: app.admin_notes,
            businesses: {
                id: app.application_id, // Use application ID as fallback
                name: app.request_type === 'new_business_manager' ? 'New Business Manager' : 'Additional Accounts'
            }
        }));

        return NextResponse.json({ applications: transformedApplications });
    } catch (error) {
        console.error('Error in applications GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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
        const { type, business_manager_id, timezone, website_url, pixel_id, pixel_name, target_bm_dolphin_id, domains, page_ids, pages_to_create } = await request.json();

        if (!type) {
            return NextResponse.json({ error: 'Application type is required.' }, { status: 400 });
        }

        // Get user's organization using service role to bypass RLS
        // Get the primary organization (where user is owner) or the first organization they're a member of
        const { data: orgMemberships, error: orgError } = await supabaseService
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', user.id)
            .order('role', { ascending: false }); // Order by role to prioritize owners

        if (orgError || !orgMemberships || orgMemberships.length === 0) {
            console.error('Organization membership error:', orgError);
            return NextResponse.json({ error: 'User is not a member of any organization.' }, { status: 403 });
        }

        // Use the first organization (prioritize owner role)
        const orgMembership = orgMemberships[0];

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

        // Check plan limits before allowing applications using pricing config
        if (type === 'business_manager') {
            // Check for existing pending application for the same domains
            const { data: existingApplication, error: existingAppError } = await supabaseService
                .from('application')
                .select('application_id')
                .eq('organization_id', organization_id)
                .eq('request_type', 'new_business_manager')
                .in('status', ['pending', 'processing'])
                .contains('domains', domains)

            if (existingApplication && existingApplication.length > 0) {
                return NextResponse.json({
                    error: 'Duplicate Application',
                    message: 'An application for a business manager with these domains is already pending.'
                }, { status: 409 });
            }

            // Check if organization can add more business managers
            const canAddBM = await checkPlanLimit(organization_id, 'businessManagers');

            if (!canAddBM) {
                return NextResponse.json({ 
                    error: 'Plan Limit Reached',
                    message: 'You have reached the maximum number of business managers for your current plan. Please upgrade to add more business managers.'
                }, { status: 403 });
            }
        } else if (type === 'ad_account') {
            // Check if organization can add more ad accounts
            const canAddAccounts = await checkPlanLimit(organization_id, 'adAccounts');

            if (!canAddAccounts) {
                return NextResponse.json({ 
                    error: 'Plan Limit Reached',
                    message: 'You have reached the maximum number of ad accounts for your current plan. Please upgrade to add more ad accounts.'
                }, { status: 403 });
            }
        }

        if (type === 'pixel_connection') {
            // Handle pixel connection application
            if (!pixel_id || !target_bm_dolphin_id) {
                return NextResponse.json({ error: 'Pixel ID and Business Manager ID are required for pixel connection requests.' }, { status: 400 });
            }

            // Skip pixel limit check since pixel limits are disabled
            // Note: Pixel limits are disabled in pricing config (enablePixelLimits: false)

            // Check if the business manager exists and belongs to the user's organization
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
                binding.asset.dolphin_id === target_bm_dolphin_id
            );

            if (!matchingBM || !matchingBM.asset) {
                console.error('Business manager not found for dolphin_id:', target_bm_dolphin_id);
                return NextResponse.json({ error: 'Business manager not found or not accessible.' }, { status: 404 });
            }

            // Check if this pixel is already connected or has a pending request
            const { data: existingPixel, error: pixelCheckError } = await supabaseService
                .from('application')
                .select('application_id, status')
                .eq('organization_id', organization_id)
                .eq('request_type', 'pixel_connection')
                .eq('pixel_id', pixel_id)
                .in('status', ['pending', 'processing'])
                .single();

            if (pixelCheckError && pixelCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error checking existing pixel request:', pixelCheckError);
                return NextResponse.json({ error: 'Failed to validate pixel request.' }, { status: 500 });
            }

            if (existingPixel) {
                return NextResponse.json({ 
                    error: 'Pixel Request Already Exists',
                    message: 'A pixel connection request for this pixel is already pending or being processed.'
                }, { status: 409 });
            }

            // Check if this pixel is already connected as an asset
            const { data: existingAsset, error: assetCheckError } = await supabaseService
                .from('asset_binding')
                .select(`
                    binding_id,
                    asset:asset_id (
                        asset_id,
                        dolphin_id,
                        type
                    )
                `)
                .eq('organization_id', organization_id)
                .eq('status', 'active');

            if (assetCheckError) {
                console.error('Error checking existing pixel asset:', assetCheckError);
                return NextResponse.json({ error: 'Failed to validate pixel asset.' }, { status: 500 });
            }

            const existingPixelAsset = assetCheckError ? null : existingAsset?.find((binding: any) => 
                binding.asset && 
                binding.asset.type === 'pixel' && 
                binding.asset.dolphin_id === pixel_id
            );

            if (existingPixelAsset) {
                return NextResponse.json({ 
                    error: 'Pixel Already Connected',
                    message: 'This pixel is already connected to your organization.'
                }, { status: 409 });
            }

            // Create pixel connection application
            const { data, error } = await supabaseService
                .from('application')
                .insert({
                    organization_id,
                    request_type: 'pixel_connection',
                    pixel_id,
                    pixel_name: pixel_name || `Pixel ${pixel_id}`,
                    target_bm_dolphin_id,
                    website_url: 'N/A', // Required field but not relevant for pixel connections
                    status: 'pending'
                })
                .select()
                .single();

            if (error) {
                console.error('Database error creating pixel connection application:', error);
                return NextResponse.json({ error: 'Failed to create pixel connection request.' }, { status: 500 });
            }

            return NextResponse.json({ success: true, application: data });

        } else if (type === 'ad_account') {
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

            // Associate pages with the application
            if (page_ids && page_ids.length > 0) {
                const pagesAssociated = await associatePagesWithApplication(
                    supabaseService,
                    data.application_id,
                    page_ids,
                    organization_id
                );

                if (!pagesAssociated) {
                    console.warn('Failed to associate pages with ad account application');
                    // Don't fail the application creation, but log the warning
                }
            }

            return NextResponse.json({ success: true, application: data });

        } else if (type === 'business_manager') {
            // Handle business manager application
            if (!website_url) {
                return NextResponse.json({ error: 'Website URL is required for business manager applications.' }, { status: 400 });
            }

            // For business manager applications, we don't need to check promotion URL limits
            // since domains are now handled per-BM and will be checked when adding domains
            // This is handled by the domain system, not the application system

            // Check if this promotion URL is already in use by this organization
            const { data: existingUrl, error: urlCheckError } = await supabaseService
                .from('promotion_urls')
                .select('url_id')
                .eq('organization_id', organization_id)
                .eq('url', website_url)
                .eq('is_active', true)
                .single();

            if (urlCheckError && urlCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error checking existing promotion URL:', urlCheckError);
                return NextResponse.json({ error: 'Failed to validate promotion URL.' }, { status: 500 });
            }

            if (existingUrl) {
                return NextResponse.json({ 
                    error: 'Promotion URL Already Used',
                    message: 'This promotion URL is already in use by your organization. Please use a different URL.'
                }, { status: 409 });
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
                    status: 'pending',
                    domains: domains || [], // Store domains array for later processing
                    pages_to_create: pages_to_create || [] // Store pages to create for later processing
                })
                .select()
                .single();

            if (error) {
                console.error('Database error creating business manager application:', error);
                return NextResponse.json({ error: 'Failed to create business manager application.' }, { status: 500 });
            }

            // Add promotion URL to tracking table
            const { error: urlInsertError } = await supabaseService
                .from('promotion_urls')
                .insert({
                    organization_id,
                    url: website_url,
                    is_active: true
                });

            if (urlInsertError) {
                console.error('Error tracking promotion URL:', urlInsertError);
                // Don't fail the application creation, but log the error
                console.warn('Business manager application created but promotion URL tracking failed');
            }

            // Note: Pages will be created by admin when processing the application
            // The pages_to_create data is stored in the application record

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