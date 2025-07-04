import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { admin_user_id, asset_ids } = body

    if (!admin_user_id) {
      return NextResponse.json(
        { error: 'admin_user_id is required' },
        { status: 400 }
      )
    }

    if (!asset_ids || !Array.isArray(asset_ids) || asset_ids.length === 0) {
      return NextResponse.json(
        { error: 'asset_ids array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Verify admin user
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', admin_user_id)
      .single()

    if (adminError || !adminProfile?.is_superuser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Use the clean database function to fulfill the application
    const { data: result, error } = await supabase
      .rpc('fulfill_application', {
        p_application_id: id,
        p_asset_ids: asset_ids,
        p_admin_user_id: admin_user_id
      })

    if (error) {
      console.error('Error fulfilling application:', error)
      return NextResponse.json(
        { error: 'Failed to fulfill application' },
        { status: 500 }
      )
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Failed to fulfill application' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      assets_bound: result.assets_bound,
      errors: result.errors || 0,
      message: `Successfully bound ${result.assets_bound} assets to organization${result.errors > 0 ? ` (${result.errors} errors)` : ''}`
    })

  } catch (error) {
    console.error('Error in fulfill application API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 