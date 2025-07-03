import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { buildApiUrl, createAuthHeaders } from '../../../../lib/api-utils';

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
    const { data: { session } } = await supabase.auth.getSession();
    return { session, user: session?.user };
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

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Admin sync API proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 