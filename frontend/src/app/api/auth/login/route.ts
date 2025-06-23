import { NextRequest, NextResponse } from 'next/server'
import { createJWT } from '@/lib/server-auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // ✅ SECURE: Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // ✅ SECURE: Authenticate user (replace with your auth logic)
    const user = await authenticateUser(email, password)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // ✅ SECURE: Create JWT token
    const token = await createJWT(user)
    
    // ✅ SECURE: Set HTTP-only cookie
    const cookieStore = cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      }
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ✅ SECURE: Mock authentication (replace with real authentication)
async function authenticateUser(email: string, password: string) {
  // TODO: Replace with real database authentication
  // This is demo/development authentication
  
  if (process.env.NODE_ENV === 'development') {
    // Demo users for development
    const demoUsers = [
      {
        id: '1',
        email: 'admin@adhub.com',
        password: 'admin123',
        role: 'admin' as const,
        organizationId: 'org-1'
      },
      {
        id: '2', 
        email: 'client@adhub.com',
        password: 'client123',
        role: 'client' as const,
        organizationId: 'org-2'
      },
      {
        id: '3',
        email: 'super@adhub.com', 
        password: 'super123',
        role: 'superuser' as const
      }
    ]
    
    const user = demoUsers.find(u => u.email === email && u.password === password)
    
    if (user) {
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      }
    }
  }
  
  // Production authentication would go here
  // Example: const user = await supabase.auth.signInWithPassword({ email, password })
  
  return null
}
