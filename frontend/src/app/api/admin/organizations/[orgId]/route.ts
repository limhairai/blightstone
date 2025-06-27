import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch individual organization with businesses
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const { orgId } = params

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  try {
    // Fetch organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgError) {
      if (orgError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      throw orgError
    }

    // Fetch associated businesses, but *exclude* the old columns
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, status, created_at, website_url') // Adjusted to select only existing columns
      .eq('organization_id', orgId)

    if (bizError) {
      throw bizError
    }

    // Calculate additional stats for the frontend
    const businessesWithStats = businesses.map(b => ({
      ...b,
      adAccountsCount: 0, // Placeholder
      totalSpend: 0, // Placeholder
      monthlyBudget: 0, // Placeholder
    }))

    return NextResponse.json({
      organization,
      businesses: businessesWithStats,
    })
  } catch (error: any) {
    console.error('Error fetching organization details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization details', details: error.message },
      { status: 500 }
    )
  }
} 