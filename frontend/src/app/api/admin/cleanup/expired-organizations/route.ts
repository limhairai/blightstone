import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request (you might want to add authentication)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Run the cleanup function
    const { data: deletedCount, error } = await supabase
      .rpc('cleanup_expired_organizations')

    if (error) {
      console.error('Error cleaning up expired organizations:', error)
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }

    console.log(`Cleaned up ${deletedCount} expired organizations`)

    return NextResponse.json({ 
      success: true, 
      deletedCount: deletedCount || 0,
      message: `Successfully cleaned up ${deletedCount || 0} expired organizations`
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint for manual testing
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get organizations that would be cleaned up
    const { data: expiredOrgs, error } = await supabase
      .from('organizations')
      .select('organization_id, name, subscription_status, data_retention_until')
      .eq('subscription_status', 'grace_period')
      .lt('data_retention_until', new Date().toISOString())

    if (error) {
      console.error('Error fetching expired organizations:', error)
      return NextResponse.json({ error: 'Failed to fetch expired organizations' }, { status: 500 })
    }

    return NextResponse.json({
      expiredOrganizations: expiredOrgs || [],
      count: expiredOrgs?.length || 0
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 