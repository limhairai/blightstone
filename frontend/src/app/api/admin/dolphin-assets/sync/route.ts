import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { buildApiUrl, createAuthHeaders } from '../../../../../lib/api-utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

async function getAuth(request: NextRequest) {
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
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return { session: null, user: null };
    }
    // Get the session to access the access_token
    const { data: { session } } = await supabase.auth.getSession();
    return { session, user };
}

export async function POST(request: NextRequest) {
    const { session } = await getAuth(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get force_refresh parameter from query string
        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get('force_refresh') === 'true';
        
        // Build backend URL with force_refresh as query parameter (not body)
        const backendUrl = buildApiUrl('/api/dolphin-assets/sync/discover');
        const urlWithParams = new URL(backendUrl);
        if (forceRefresh) {
            urlWithParams.searchParams.set('force_refresh', 'true');
        }
        
        console.log('🔍 Sync API: Calling backend URL:', urlWithParams.toString());
        
        const response = await fetch(urlWithParams.toString(), {
            method: 'POST',
            headers: createAuthHeaders(session.access_token),
        });

        console.log('🔍 Sync API: Backend response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("🔍 Sync API: Backend sync error:", errorData);
            return NextResponse.json(errorData, { status: response.status });
        }

        const backendData = await response.json();
        
        // After successful backend sync, also sync pixels
        console.log('🔍 Sync API: Backend sync completed, now syncing pixels...');
        
        let pixelSyncResults = null;
        try {
            const pixelSyncResponse = await fetch(`${request.url.split('/sync')[0]}/sync-pixels`, {
                method: 'POST',
                headers: {
                    'Authorization': request.headers.get('Authorization') || '',
                    'Content-Type': 'application/json'
                }
            });

            if (pixelSyncResponse.ok) {
                pixelSyncResults = await pixelSyncResponse.json();
                console.log('🔍 Sync API: Pixel sync completed successfully');
            } else {
                console.error('🔍 Sync API: Pixel sync failed:', pixelSyncResponse.status);
            }
        } catch (pixelError) {
            console.error('🔍 Sync API: Pixel sync error:', pixelError);
        }

        // Return combined results
        return NextResponse.json({
            ...backendData,
            pixel_sync: pixelSyncResults ? {
                success: true,
                results: pixelSyncResults.results
            } : {
                success: false,
                error: 'Pixel sync failed'
            }
        });

    } catch (error) {
        console.error('Admin sync API proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 