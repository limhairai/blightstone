import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = params.id

    // Get business managers assigned to this organization via asset bindings
    const { data: bindings, error: bindingsError } = await supabase
      .from('client_asset_bindings')
      .select(`
        asset_id,
        dolphin_assets!inner (
          id,
          name,
          dolphin_asset_id,
          asset_type,
          status
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .eq('dolphin_assets.asset_type', 'business_manager')

    if (bindingsError) {
      console.error('Error fetching business managers:', bindingsError)
      return NextResponse.json(
        { error: 'Failed to fetch business managers' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected interface
    const businessManagers = bindings?.map(binding => ({
      id: binding.dolphin_assets.id,
      name: binding.dolphin_assets.name,
      dolphin_asset_id: binding.dolphin_assets.dolphin_asset_id,
      status: binding.dolphin_assets.status
    })) || []

    return NextResponse.json({
      business_managers: businessManagers
    })

  } catch (error) {
    console.error('Error in business managers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 