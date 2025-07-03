import { NextRequest, NextResponse } from 'next/server'
import { buildApiUrl } from '../../../lib/api-utils'

export async function GET(request: NextRequest) {
    try {
        const backendUrl = buildApiUrl('/api/monitoring')
        
        console.log('🔍 Monitoring API: Calling backend URL:', backendUrl)

        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        console.log('🔍 Monitoring API: Backend response status:', response.status)

        if (!response.ok) {
            const errorData = await response.json()
            console.error('🔍 Monitoring API: Backend error:', errorData)
            return NextResponse.json(errorData, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Monitoring API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
} 