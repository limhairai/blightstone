import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// GET /api/promotion-urls
// Get all promotion URLs for the user's organization
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Get user's organization
        const { data: orgMembership, error: orgError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

        if (orgError || !orgMembership) {
            return NextResponse.json({ error: 'User is not a member of any organization.' }, { status: 403 });
        }

        // Get promotion URLs for the organization
        const { data: promotionUrls, error: urlsError } = await supabase
            .from('promotion_urls')
            .select('*')
            .eq('organization_id', orgMembership.organization_id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (urlsError) {
            console.error('Error fetching promotion URLs:', urlsError);
            return NextResponse.json({ error: 'Failed to fetch promotion URLs.' }, { status: 500 });
        }

        // Get plan limits
        const { data: planLimit, error: limitError } = await supabase
            .rpc('get_promotion_url_limit', { org_id: orgMembership.organization_id });

        if (limitError) {
            console.error('Error fetching promotion URL limit:', limitError);
            return NextResponse.json({ error: 'Failed to fetch plan limits.' }, { status: 500 });
        }

        return NextResponse.json({ 
            promotionUrls: promotionUrls || [],
            limit: planLimit,
            used: promotionUrls?.length || 0
        });

    } catch (error) {
        console.error('Error fetching promotion URLs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/promotion-urls
// Add a new promotion URL
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

    // Create service role client for plan limit checks
    const supabaseService = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
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

        // Note: Promotion URLs are deprecated in favor of per-BM domains
        // This endpoint is maintained for backward compatibility
        // Domain limits are now enforced per-BM, not organization-wide

        // Check if this promotion URL is already in use by this organization
        const { data: existingUrl, error: urlCheckError } = await supabase
            .from('promotion_urls')
            .select('url_id')
            .eq('organization_id', organization_id)
            .eq('url', url)
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

        // Add promotion URL to tracking table
        const { data, error: urlInsertError } = await supabase
            .from('promotion_urls')
            .insert({
                organization_id,
                url,
                is_active: true
            })
            .select()
            .single();

        if (urlInsertError) {
            console.error('Error adding promotion URL:', urlInsertError);
            return NextResponse.json({ error: 'Failed to add promotion URL.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, promotionUrl: data });

    } catch (error) {
        console.error('Error adding promotion URL:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/promotion-urls
// Remove a promotion URL
export async function DELETE(request: NextRequest) {
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
        const { searchParams } = new URL(request.url);
        const urlId = searchParams.get('urlId');

        if (!urlId) {
            return NextResponse.json({ error: 'URL ID is required' }, { status: 400 });
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

        // Deactivate the promotion URL (soft delete)
        const { error: deleteError } = await supabase
            .from('promotion_urls')
            .update({ is_active: false })
            .eq('url_id', urlId)
            .eq('organization_id', orgMembership.organization_id);

        if (deleteError) {
            console.error('Error deactivating promotion URL:', deleteError);
            return NextResponse.json({ error: 'Failed to remove promotion URL.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error removing promotion URL:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 