import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURE: Clear authentication cookie
    const cookieStore = cookies()
    cookieStore.delete('auth-token')
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
    
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
