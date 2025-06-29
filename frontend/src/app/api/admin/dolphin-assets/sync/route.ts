import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    return session;
}

export async function POST(request: NextRequest) {
    const session = await getAuth(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get force_refresh parameter from query string
        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get('force_refresh') === 'true';
        
        // Build backend URL with force_refresh as query parameter (not body)
        const backendUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/dolphin-assets/sync/discover`);
        if (forceRefresh) {
            backendUrl.searchParams.set('force_refresh', 'true');
        }
        
        const response = await fetch(backendUrl.toString(), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Backend sync error:", errorData);
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