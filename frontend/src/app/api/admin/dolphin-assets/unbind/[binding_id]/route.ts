import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildApiUrl, createAuthHeaders } from '../../../../../../lib/api-utils'

async function getAuth(request: NextRequest) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )
    const { data: { session } } = await supabase.auth.getSession()
    return { session, user: session?.user }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { binding_id: string } }
) {
    const { session } = await getAuth(request);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const cascade = searchParams.get('cascade') !== 'false'; // Default to true
        const reason = searchParams.get('reason');
        
        // Build backend URL
        const backendUrl = buildApiUrl(`/api/dolphin-assets/unbind/${params.binding_id}`);
        const urlWithParams = new URL(backendUrl);
        urlWithParams.searchParams.set('cascade', cascade.toString());
        if (reason) {
            urlWithParams.searchParams.set('reason', reason);
        }
        
        console.log('🔍 Unbind API: Calling backend URL:', urlWithParams.toString());
        
        const response = await fetch(urlWithParams.toString(), {
            method: 'POST',
            headers: createAuthHeaders(session.access_token),
        });

        console.log('🔍 Unbind API: Backend response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("🔍 Unbind API: Backend error:", errorData);
            return NextResponse.json(errorData, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Admin unbind API proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 