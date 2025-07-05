import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const organizationId = params.orgId

    if (!organizationId) {
      return NextResponse.json({ message: "Organization ID is required" }, { status: 400 })
    }

    // Get all business manager bindings for this organization
    const { data: bindings, error: bindingsError } = await supabase
      .from('asset_binding')
      .select(`
        *,
        asset!inner(
          asset_id,
          type,
          dolphin_id,
          name,
          status,
          metadata
        )
      `)
      .eq('organization_id', organizationId)
      .eq('asset.type', 'business_manager')
      .eq('status', 'active')
      .order('bound_at', { ascending: false })

    if (bindingsError) {
      console.error("Error fetching organization business managers:", bindingsError)
      return NextResponse.json(
        { message: "Failed to fetch organization business managers", error: bindingsError.message },
        { status: 500 }
      )
    }

    // Transform the data
    const businessManagers = bindings?.map(binding => {
      const asset = binding.asset
      return {
        id: asset.asset_id,
        type: asset.type,
        dolphin_id: asset.dolphin_id,
        name: asset.name,
        status: asset.status,
        metadata: asset.metadata,
        binding_id: binding.binding_id,
        bound_at: binding.bound_at
      }
    }) || []

    return NextResponse.json({
      business_managers: businessManagers,
      count: businessManagers.length
    })

  } catch (error: any) {
    console.error("Failed to fetch organization business managers:", error)
    return NextResponse.json(
      { message: "Failed to fetch organization business managers", error: error.message },
      { status: 500 }
    )
  }
} 