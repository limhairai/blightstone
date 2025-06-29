import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAuth(request: NextRequest) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
    return { session, user, supabase }
}

export async function POST(request: NextRequest) {
    const { session, user, supabase } = await getAuth(request)
    if (!session || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { asset_id, organization_id, cascade = true } = body

        if (!asset_id || !organization_id) {
            return NextResponse.json(
                { error: 'Asset ID and Organization ID are required' },
                { status: 400 }
            )
        }

        console.log('🔗 Unbind by asset request:', { asset_id, organization_id, cascade })

        // Find the active binding for this asset and organization
        const { data: bindings, error: bindingError } = await supabase
            .from('asset_binding')
            .select('id, asset_id, organization_id, status')
            .eq('asset_id', asset_id)
            .eq('organization_id', organization_id)
            .eq('status', 'active')

        if (bindingError) {
            console.error('🔗 Error finding binding:', bindingError)
            return NextResponse.json(
                { error: 'Failed to find asset binding' },
                { status: 500 }
            )
        }

        if (!bindings || bindings.length === 0) {
            console.error('🔗 No active binding found for asset:', { asset_id, organization_id })
            return NextResponse.json(
                { error: 'No active binding found for this asset' },
                { status: 404 }
            )
        }

        const binding = bindings[0]
        console.log('🔗 Found binding:', binding)

        // Now call the backend unbind endpoint using the binding ID
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/dolphin-assets/unbind/${binding.id}?cascade=${cascade}`

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        })

        console.log('🔗 Backend response status:', response.status)

        if (!response.ok) {
            const errorData = await response.json()
            console.log('🔗 Backend error:', errorData)
            return NextResponse.json(errorData, { status: response.status })
        }

        const data = await response.json()
        console.log('🔗 Backend success:', data)
        
        // Add unbind_count to the response for better UI feedback
        return NextResponse.json({
            ...data,
            unbind_count: data.assets_unbound || 1
        })

    } catch (error) {
        console.error('Unbind by asset API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
} 