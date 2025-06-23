import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURE: Verify authentication from HTTP-only cookie
    const user = await getUserFromRequest()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        permissions: user.permissions
      }
    })
    
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
