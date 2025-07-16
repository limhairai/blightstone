import { NextRequest, NextResponse } from 'next/server'
import { buildApiUrl } from '../../../lib/api-utils'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const backendUrl = buildApiUrl('/api/health')
        
        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            // During build time, backend might not be available - return a default response
            if (process.env.NODE_ENV === 'production' && response.status === 404) {
                return NextResponse.json({
                    status: 'build-time',
                    message: 'Backend not available during build',
                    timestamp: new Date().toISOString()
                })
            }
            
            const errorData = await response.json().catch(() => ({ detail: 'Backend unavailable' }))
            console.error('🔍 Health Check API: Backend error:', errorData)
            return NextResponse.json(errorData, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Health check API error:', error)
        
        // During build time, network errors are expected
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({
                status: 'build-time',
                message: 'Backend not available during build',
                timestamp: new Date().toISOString()
            })
        }
        
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
} 