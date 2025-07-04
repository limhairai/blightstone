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

export async function POST(request: NextRequest) {
    const { session } = await getAuth(request)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { asset_id, cascade = true, reason } = body

        if (!asset_id) {
            return NextResponse.json({ error: 'asset_id is required' }, { status: 400 })
        }

        // Get the asset binding first
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get() { return undefined },
                },
            }
        )

        const { data: bindings, error } = await supabase
            .from('asset_binding')
            .select('binding_id, asset_id, organization_id')
            .eq('asset_id', asset_id)
            .eq('status', 'active')

        if (error) {
            console.error('Error fetching asset bindings:', error)
            return NextResponse.json({ error: 'Failed to fetch asset bindings' }, { status: 500 })
        }

        if (!bindings || bindings.length === 0) {
            return NextResponse.json({ error: 'No active binding found for this asset' }, { status: 404 })
        }

        // Unbind each binding (there should typically be only one)
        const results = []
        for (const binding of bindings) {
            try {
                const backendUrl = buildApiUrl(`/api/dolphin-assets/unbind/${binding.binding_id}`)
                const urlWithParams = new URL(backendUrl)
                urlWithParams.searchParams.set('cascade', cascade.toString())
                if (reason) {
                    urlWithParams.searchParams.set('reason', reason)
                }

                const response = await fetch(urlWithParams.toString(), {
                    method: 'POST',
                    headers: createAuthHeaders(session.access_token),
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    console.error('Unbind by Asset API: Backend error:', errorData)
                    results.push({ binding_id: binding.binding_id, success: false, error: errorData })
                } else {
                    const data = await response.json()
                    results.push({ binding_id: binding.binding_id, success: true, data })
                }
            } catch (error) {
                console.error(`Error unbinding ${binding.binding_id}:`, error)
                results.push({ 
                    binding_id: binding.binding_id, 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                })
            }
        }

        return NextResponse.json({ results })

    } catch (error) {
        console.error('Unbind by asset API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
} 