import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { buildApiUrl, createAuthHeaders } from '../../../../../../lib/api-utils';

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
        // Build backend URL for auto-sync
        const backendUrl = buildApiUrl('/api/dolphin-assets/sync/auto');
        
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: createAuthHeaders(session.access_token),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("🔍 Auto-sync API: Backend error:", errorData);
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Admin auto-sync API proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 