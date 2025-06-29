import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    const { data: { user } } = await supabase.auth.getUser()
    return { session, user }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { binding_id: string } }
) {
    const { session, user } = await getAuth(request)
    if (!session || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const cascade = searchParams.get('cascade')
        const reason = searchParams.get('reason')
        
        const backendUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/dolphin-assets/unbind/${params.binding_id}`)
        if (cascade) {
            backendUrl.searchParams.set('cascade', cascade)
        }
        if (reason) {
            backendUrl.searchParams.set('reason', reason)
        }

        const response = await fetch(backendUrl.toString(), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            return NextResponse.json(errorData, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Unbind API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
} 