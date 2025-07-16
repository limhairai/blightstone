import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getPlanPricing } from '@/lib/config/pricing-config'

// Helper function to check if BM can add more domains
async function checkBMDomainLimit(bmId: string, organizationId: string): Promise<boolean> {
  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get organization plan
  const { data: orgData, error: orgError } = await supabaseService
    .from('organizations')
    .select('plan_id')
    .eq('organization_id', organizationId)
    .single()

  if (orgError || !orgData) {
    console.error('Error fetching organization plan:', orgError)
    return false
  }

  const planId = orgData.plan_id || 'free'
  const planLimits = getPlanPricing(planId)

  if (!planLimits) {
    return false
  }

  // Get current domain count for this BM
  const { count: currentCount } = await supabaseService
    .from('bm_domains')
    .select('*', { count: 'exact', head: true })
    .eq('bm_asset_id', bmId)
    .eq('is_active', true)

  const limit = planLimits.domainsPerBm
  return limit === -1 || (currentCount || 0) < limit
}

// Create service role client for admin operations
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Create user client for authentication
function createUserClient() {
  const cookieStore = cookies()
  return createServerClient(
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
}

// GET /api/business-managers/[bmId]/domains
// Get all domains for a specific Business Manager
export async function GET(
  request: NextRequest,
  { params }: { params: { bmId: string } }
) {
  try {
    const supabase = createUserClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const bmId = params.bmId

    // Get user's organization
    const { data: orgMembership, error: orgError } = await supabaseService
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !orgMembership) {
      return NextResponse.json({ error: 'User is not a member of any organization' }, { status: 403 })
    }

    const organizationId = orgMembership.organization_id

    // Verify the BM belongs to the user's organization
    const { data: bmBinding, error: bmError } = await supabaseService
      .from('asset_binding')
      .select(`
        binding_id,
        asset:asset_id (
          asset_id,
          name,
          type
        )
      `)
      .eq('asset_id', bmId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single()

    if (bmError || !bmBinding) {
      return NextResponse.json({ error: 'Business Manager not found or not accessible' }, { status: 404 })
    }

    // Verify it's actually a business manager
    if (bmBinding.asset?.[0]?.type !== 'business_manager') {
      return NextResponse.json({ error: 'Asset is not a business manager' }, { status: 400 })
    }

    // Get domains for this BM
    const { data: domains, error: domainsError } = await supabaseService
      .from('bm_domains')
      .select('*')
      .eq('bm_asset_id', bmId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (domainsError) {
      console.error('Error fetching domains:', domainsError)
      return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 })
    }

    // Get domain limits for this organization
    const { data: domainLimit, error: limitError } = await supabaseService
      .rpc('get_domains_per_bm_limit', { p_organization_id: organizationId })

    if (limitError) {
      console.error('Error fetching domain limit:', limitError)
      return NextResponse.json({ error: 'Failed to fetch domain limit' }, { status: 500 })
    }

    // Get current domain count
    const { data: currentCount, error: countError } = await supabaseService
      .rpc('get_bm_domain_count', { p_bm_asset_id: bmId })

    if (countError) {
      console.error('Error fetching domain count:', countError)
      return NextResponse.json({ error: 'Failed to fetch domain count' }, { status: 500 })
    }

    return NextResponse.json({
      domains: domains || [],
      bmInfo: {
        id: bmBinding.asset?.[0]?.asset_id,
        name: bmBinding.asset?.[0]?.name
      },
      limits: {
        current: currentCount || 0,
        max: domainLimit || 0,
        canAddMore: domainLimit === -1 || (currentCount || 0) < domainLimit
      }
    })

  } catch (error) {
    console.error('Error in domains GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/business-managers/[bmId]/domains
// Add a new domain to a Business Manager
export async function POST(
  request: NextRequest,
  { params }: { params: { bmId: string } }
) {
  try {
    const supabase = createUserClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const bmId = params.bmId
    const { domain_url } = await request.json()

    if (!domain_url || !domain_url.trim()) {
      return NextResponse.json({ error: 'Domain URL is required' }, { status: 400 })
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    if (!urlPattern.test(domain_url.trim())) {
      return NextResponse.json({ error: 'Invalid domain URL format' }, { status: 400 })
    }

    // Get user's organization
    const { data: orgMembership, error: orgError } = await supabaseService
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !orgMembership) {
      return NextResponse.json({ error: 'User is not a member of any organization' }, { status: 403 })
    }

    const organizationId = orgMembership.organization_id

    // Verify the BM belongs to the user's organization
    const { data: bmBinding, error: bmError } = await supabaseService
      .from('asset_binding')
      .select(`
        binding_id,
        asset:asset_id (
          asset_id,
          name,
          type
        )
      `)
      .eq('asset_id', bmId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single()

    if (bmError || !bmBinding) {
      return NextResponse.json({ error: 'Business Manager not found or not accessible' }, { status: 404 })
    }

    // Verify it's actually a business manager
    if (bmBinding.asset?.[0]?.type !== 'business_manager') {
      return NextResponse.json({ error: 'Asset is not a business manager' }, { status: 400 })
    }

    // Check if the BM can add more domains using pricing config
    const canAddDomain = await checkBMDomainLimit(bmId, organizationId)

    if (!canAddDomain) {
      return NextResponse.json({ 
        error: 'Domain limit reached',
        message: 'This Business Manager has reached its domain limit for your current plan'
      }, { status: 403 })
    }

    // Check if domain already exists for this BM
    const { data: existingDomain, error: existingError } = await supabaseService
      .from('bm_domains')
      .select('domain_id')
      .eq('bm_asset_id', bmId)
      .eq('domain_url', domain_url.trim())
      .eq('is_active', true)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing domain:', existingError)
      return NextResponse.json({ error: 'Failed to validate domain' }, { status: 500 })
    }

    if (existingDomain) {
      return NextResponse.json({ 
        error: 'Domain already exists',
        message: 'This domain is already associated with this Business Manager'
      }, { status: 409 })
    }

    // Add the domain
    const { data: newDomain, error: insertError } = await supabaseService
      .from('bm_domains')
      .insert({
        organization_id: organizationId,
        bm_asset_id: bmId,
        domain_url: domain_url.trim(),
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error adding domain:', insertError)
      return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      domain: newDomain,
      message: 'Domain added successfully'
    })

  } catch (error) {
    console.error('Error in domains POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/business-managers/[bmId]/domains/[domainId]
// This will be handled by a separate route file 