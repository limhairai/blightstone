import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { type, business_manager_id, timezone, website_url } = await request.json();

        if (!type) {
            return NextResponse.json({ error: 'Application type is required.' }, { status: 400 });
        }

        // Get user's organization
        const { data: orgMembership, error: orgError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

        if (orgError || !orgMembership) {
            return NextResponse.json({ error: 'User is not a member of any organization.' }, { status: 403 });
        }

        const organization_id = orgMembership.organization_id;

        if (type === 'ad_account') {
            // Handle ad account application
            if (!business_manager_id) {
                return NextResponse.json({ error: 'Business manager ID is required for ad account applications.' }, { status: 400 });
            }

            // Check if the business manager exists and belongs to the user's organization
            const { data: bmData, error: bmError } = await supabase
                .from('asset_binding')
                .select('*')
                .eq('organization_id', organization_id)
                .eq('dolphin_id', business_manager_id)
                .eq('asset_type', 'business_manager')
                .single();

            if (bmError || !bmData) {
                return NextResponse.json({ error: 'Business manager not found or not accessible.' }, { status: 404 });
            }

            // Create ad account application
            const { data, error } = await supabase
                .from('ad_account_applications')
                .insert({
                    organization_id,
                    business_id: bmData.id, // Use the asset_binding ID
                    timezone: timezone || 'UTC',
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

            // Get organization name for application naming
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('name')
                .eq('organization_id', organization_id)
                .single();

            if (orgError || !orgData) {
                console.error('Error fetching organization:', orgError);
                return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
            }

            // Count existing applications for this organization to generate counter
            const { count, error: countError } = await supabase
                .from('application')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', organization_id)
                .eq('request_type', 'new_business_manager');

            if (countError) {
                console.error('Error counting applications:', countError);
                return NextResponse.json({ error: 'Failed to generate application name.' }, { status: 500 });
            }

            // Generate application name: AdHub-(Org Name)-(counter)
            const orgName = orgData.name.length > 20 ? orgData.name.substring(0, 20) : orgData.name;
            const cleanOrgName = orgName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
            const counter = String((count || 0) + 1).padStart(2, '0');
            const applicationName = `AdHub-${cleanOrgName}-${counter}`;

            // Insert into the application table
            const { data, error } = await supabase
                .from('application')
                .insert({
                    website_url,
                    organization_id,
                    request_type: 'new_business_manager',
                    status: 'pending',
                    name: applicationName
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