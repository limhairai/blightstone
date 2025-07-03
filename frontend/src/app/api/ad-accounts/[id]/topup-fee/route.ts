import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildApiUrl, createAuthHeaders } from '../../../../../lib/api-utils'

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

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { session } = await getAuth(request)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const amount = searchParams.get('amount')
        
        if (!amount) {
            return NextResponse.json({ error: 'Amount parameter is required' }, { status: 400 })
        }

        const backendUrl = buildApiUrl(`/api/ad-accounts/${params.id}/topup-fee`)
        const urlWithParams = new URL(backendUrl)
        urlWithParams.searchParams.set('amount', amount)

        console.log('🔍 Topup Fee API: Calling backend URL:', urlWithParams.toString())

        const response = await fetch(urlWithParams.toString(), {
            method: 'GET',
            headers: createAuthHeaders(session.access_token),
        })

        console.log('🔍 Topup Fee API: Backend response status:', response.status)

        if (!response.ok) {
            const errorData = await response.json()
            console.error('🔍 Topup Fee API: Backend error:', errorData)
            return NextResponse.json(errorData, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Topup fee API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
} 