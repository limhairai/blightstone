import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const { businessId } = params

  if (!businessId) {
    return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
  }

  try {
    // Fetch business details
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (bizError) {
      if (bizError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 })
      }
      throw bizError
    }

    // Fetch associated ad accounts
    const { data: adAccounts, error: adAccountsError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('business_id', businessId)

    if (adAccountsError) {
      throw adAccountsError
    }

    return NextResponse.json({
      business,
      adAccounts,
    })
  } catch (error: any) {
    console.error('Error fetching business details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business details', details: error.message },
      { status: 500 }
    )
  }
} 