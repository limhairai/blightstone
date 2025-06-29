import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAuth(request: NextRequest) {
    const cookieStore = cookies()
    const supabase = createServerClient(
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
    const { data: { session } } = await supabase.auth.getSession()
    return session
}

// Helper function to extract team from profile name
function extractTeamFromProfile(profileName: string) {
  const parts = profileName.split('-');
  if (parts.length >= 3) {
    return {
      team: parts[0], // A, B, etc.
      role: parts[1], // Admin, Backup
      instance: parts[2] // 1, 2, etc.
    };
  }
  return null;
}

// GET - Fetch teams data from Dolphin assets
export async function GET(request: NextRequest) {
  const session = await getAuth(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call backend to get all assets
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/dolphin-assets/all-assets`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    const assets = Array.isArray(data) ? data : (data.assets || [])
    
    // Get profiles and extract team information
    const profiles = assets.filter(asset => asset.asset_type === 'profile')
    const businessManagers = assets.filter(asset => asset.asset_type === 'business_manager')
    const adAccounts = assets.filter(asset => asset.asset_type === 'ad_account')
    
    // Group profiles by team
    const teamMap = new Map()
    
    profiles.forEach(profile => {
      const teamInfo = extractTeamFromProfile(profile.name)
      if (teamInfo) {
        const teamKey = teamInfo.team
        if (!teamMap.has(teamKey)) {
          teamMap.set(teamKey, {
            id: teamKey,
            name: `Team ${teamKey}`,
            description: `Team ${teamKey} - Dolphin Profile Management`,
            profiles: [],
            businessManagers: [],
            adAccounts: [],
            status: 'active'
          })
        }
        
        const team = teamMap.get(teamKey)
        team.profiles.push({
          ...profile,
          teamInfo
        })
      }
    })
    
    // Associate Business Managers and Ad Accounts with teams
    businessManagers.forEach(bm => {
      const managingProfile = bm.asset_metadata?.managing_profile
      if (managingProfile) {
        const teamInfo = extractTeamFromProfile(managingProfile)
        if (teamInfo && teamMap.has(teamInfo.team)) {
          teamMap.get(teamInfo.team).businessManagers.push(bm)
        }
      }
    })
    
    adAccounts.forEach(account => {
      const managingProfile = account.asset_metadata?.managing_profile
      if (managingProfile) {
        const teamInfo = extractTeamFromProfile(managingProfile)
        if (teamInfo && teamMap.has(teamInfo.team)) {
          teamMap.get(teamInfo.team).adAccounts.push(account)
        }
      }
    })
    
    // Convert to teams array with statistics
    const teams = Array.from(teamMap.values()).map(team => {
      const activeProfiles = team.profiles.filter(p => p.status === 'active').length
      const totalProfiles = team.profiles.length
      const adminProfiles = team.profiles.filter(p => p.teamInfo.role === 'Admin').length
      const backupProfiles = team.profiles.filter(p => p.teamInfo.role === 'Backup').length
      
      // Business Manager capacity logic
      const bmCount = team.businessManagers.length
      const bmCapacity = 20 // Each team can manage up to 20 Business Managers
      const bmUtilization = Math.min(100, Math.round((bmCount / bmCapacity) * 100))
      
      // Calculate team status based on BM capacity and profile availability
      let status = 'active'
      if (activeProfiles === 0) {
        status = 'suspended'
      } else if (adminProfiles === 0) {
        status = 'needs_backup'
      } else if (bmCount >= bmCapacity) {
        status = 'at_capacity'
      }
      
      return {
        ...team,
        profilesCount: totalProfiles,
        activeProfiles,
        adminProfiles,
        backupProfiles,
        businessManagersCount: bmCount,
        adAccountsCount: team.adAccounts.length,
        bmCapacity: bmCapacity,
        bmUtilization: bmUtilization,
        // Legacy fields for compatibility
        organizationsCount: bmCount, // Map to BM count for backward compatibility
        activeBusinesses: bmCount,
        utilizationRate: bmUtilization,
        capacity: bmCapacity,
        status
      }
    })
    
    // Sort teams by name
    teams.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error in GET /api/admin/teams:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST - Create team (not applicable for our Dolphin-based system)
export async function POST(request: NextRequest) {
  const session = await getAuth(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ 
    error: 'Team creation not supported. Teams are automatically created based on Dolphin profile naming convention ({TEAM}-{ROLE}-{INSTANCE}).' 
  }, { status: 400 })
} 