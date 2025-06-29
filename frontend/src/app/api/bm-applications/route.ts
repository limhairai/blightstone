import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This is a placeholder for the actual application type
type Application = {
  id: string;
  website_url: string;
  status: string;
  created_at: string;
  organization_name?: string;
};

// GET /api/bm-applications
// Fetches all applications for the admin panel using the new get_applications function.
export async function GET(request: Request) {
    
    
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

    try {

        const { data, error } = await supabase.rpc('get_applications');

        if (error) {
            console.error('Error fetching applications:', error);
            // Check if it's an authentication/authorization error
            if (error.message?.includes('permission') || error.message?.includes('superuser')) {
                return NextResponse.json({ error: 'Insufficient permissions. Admin access required.' }, { status: 403 });
            }
            return NextResponse.json({ error: 'Failed to fetch applications: ' + error.message }, { status: 500 });
        }



        if (!data) {
            // This can happen if the user is not an admin, or if there are no applications.

            return NextResponse.json([], { status: 200 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error in applications API:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}

// POST /api/bm-applications
// Creates a new BM application for a client.
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
        const { website_url, organization_id } = await request.json();

        if (!website_url || !organization_id) {
            return NextResponse.json({ error: 'Website URL and Organization ID are required.' }, { status: 400 });
        }
        
        // Security Check: Verify the user is a member of the organization they're submitting for.
        const { data: membership, error: membershipError } = await supabaseAdmin
            .from('organization_members')
            .select('user_id')
            .eq('user_id', user.id)
            .eq('organization_id', organization_id)
            .maybeSingle();

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'You are not a member of this organization.' }, { status: 403 });
        }

        // Get organization name for application naming
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .select('name')
            .eq('organization_id', organization_id)
            .single();

        if (orgError || !orgData) {
            console.error('Error fetching organization:', orgError);
            return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
        }

        // Count existing applications for this organization to generate counter
        const { count, error: countError } = await supabaseAdmin
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

        // Insert into the new application table
        const { data, error } = await supabaseAdmin
            .from('application')
            .insert({
                website_url,
                organization_id,
                request_type: 'new_business_manager', // Default to new business manager request
                status: 'pending',
                name: applicationName
            })
            .select()
            .single();

        if (error) {
            console.error('Database error creating application:', error);
            throw error;
        }


        return NextResponse.json({ success: true, application: data });

    } catch (error) {
        console.error('Error creating BM application:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 