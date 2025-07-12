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
    // It's secure to get the session first, as getUser will re-authenticate
    const { data: { session } } = await supabase.auth.getSession();
    return { session, user: session?.user };
}

export async function POST(request: NextRequest) {
    const { session } = await getAuth(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const autoBindRelated = searchParams.get('auto_bind_related') === 'true';
        
        // Build backend URL
        const backendUrl = buildApiUrl('/api/dolphin-assets/bind');
        const urlWithParams = new URL(backendUrl);
        if (autoBindRelated) {
            urlWithParams.searchParams.set('auto_bind_related', 'true');
        }
        
        console.log('🔍 Bind API: Calling backend URL:', urlWithParams.toString());
        
        const response = await fetch(urlWithParams.toString(), {
            method: 'POST',
            headers: createAuthHeaders(session.access_token),
            body: JSON.stringify(body),
        });

        console.log('🔍 Bind API: Backend response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("🔍 Bind API: Backend error:", errorData);
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Admin bind API proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
