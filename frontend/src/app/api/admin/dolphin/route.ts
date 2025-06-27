import { NextRequest, NextResponse } from 'next/server'

// Mock Dolphin accounts for demo
const mockDolphinAccounts = [
  {
    id: 'dolphin-001',
    name: 'Facebook Account #1',
    platform: 'Facebook',
    status: 'available',
    profile_id: 'profile-001',
    created_at: new Date().toISOString()
  },
  {
    id: 'dolphin-002', 
    name: 'Facebook Account #2',
    platform: 'Facebook',
    status: 'available',
    profile_id: 'profile-002',
    created_at: new Date().toISOString()
  },
  {
    id: 'dolphin-003',
    name: 'Facebook Account #3', 
    platform: 'Facebook',
    status: 'bound',
    profile_id: 'profile-003',
    bound_to: 'app-003',
    created_at: new Date().toISOString()
  }
]

// GET - Fetch available Dolphin accounts
export async function GET(request: NextRequest) {
  try {
    // In production, this would:
    // 1. Verify admin authentication
    // 2. Call Dolphin API to get available accounts
    // 3. Return accounts that can be bound
    
    const availableAccounts = mockDolphinAccounts.filter(account => account.status === 'available')
    
    return NextResponse.json({
      success: true,
      accounts: availableAccounts,
      total: availableAccounts.length
    })
  } catch (error) {
    console.error('Error fetching Dolphin accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Dolphin accounts' },
      { status: 500 }
    )
  }
}

// POST - Bind Dolphin account to application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { application_id, dolphin_account_id, spend_limit } = body
    
    // In production, this would:
    // 1. Verify admin authentication
    // 2. Call Dolphin API to bind the account
    // 3. Update application status to 'provisioned'
    // 4. Send notification to client
    // 5. Set up spend limits and monitoring
    
    const dolphinAccount = mockDolphinAccounts.find(acc => acc.id === dolphin_account_id)
    
    if (!dolphinAccount) {
      return NextResponse.json(
        { error: 'Dolphin account not found' },
        { status: 404 }
      )
    }
    
    if (dolphinAccount.status !== 'available') {
      return NextResponse.json(
        { error: 'Dolphin account is not available for binding' },
        { status: 400 }
      )
    }
    
    // Simulate binding process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update account status
    dolphinAccount.status = 'bound'
    dolphinAccount.bound_to = application_id
    
    return NextResponse.json({
      success: true,
      message: 'Account successfully bound to application',
      binding_details: {
        application_id,
        dolphin_account_id,
        spend_limit,
        bound_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error binding Dolphin account:', error)
    return NextResponse.json(
      { error: 'Failed to bind Dolphin account' },
      { status: 500 }
    )
  }
}

// PUT - Sync with Dolphin (refresh available accounts)
export async function PUT(request: NextRequest) {
  try {
    // In production, this would:
    // 1. Verify admin authentication  
    // 2. Call Dolphin API to sync account status
    // 3. Update local database with latest account info
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Add a new "synced" account for demo
    const newAccount = {
      id: `dolphin-${Date.now()}`,
      name: `Facebook Account #${mockDolphinAccounts.length + 1}`,
      platform: 'Facebook',
      status: 'available',
      profile_id: `profile-${Date.now()}`,
      created_at: new Date().toISOString()
    }
    
    mockDolphinAccounts.push(newAccount)
    
    return NextResponse.json({
      success: true,
      message: 'Successfully synced with Dolphin',
      synced_accounts: mockDolphinAccounts.length,
      available_accounts: mockDolphinAccounts.filter(acc => acc.status === 'available').length
    })
  } catch (error) {
    console.error('Error syncing with Dolphin:', error)
    return NextResponse.json(
      { error: 'Failed to sync with Dolphin' },
      { status: 500 }
    )
  }
}
