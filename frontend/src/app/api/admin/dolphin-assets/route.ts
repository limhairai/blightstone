import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildApiUrl, createAuthHeaders } from '../../../../lib/api-utils'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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
    return session
}

export async function GET(request: NextRequest) {
    const session = await getAuth(request)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organization_id')
        const assetType = searchParams.get('type')
        
        if (!organizationId) {
            return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
        }

        const backendUrl = buildApiUrl(`/api/dolphin-assets/client/${organizationId}`)
        const urlWithParams = new URL(backendUrl)
        if (assetType) {
            urlWithParams.searchParams.set('type', assetType)
        }

        console.log('🔍 Frontend API: Calling backend URL:', urlWithParams.toString())

        const response = await fetch(urlWithParams.toString(), {
            method: 'GET',
            headers: createAuthHeaders(session.access_token),
        })

        console.log('🔍 Frontend API: Backend response status:', response.status)

        if (!response.ok) {
            const errorData = await response.json()
            console.log('🔍 Frontend API: Backend error:', errorData)
            return NextResponse.json(errorData, { status: response.status })
        }

        const data = await response.json()
        console.log('🔍 Frontend API: Backend data:', data)
        return NextResponse.json(data)

    } catch (error) {
        console.error('Dolphin assets API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
} 