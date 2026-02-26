import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Mock user database - in a real app, this would be a database query
const mockUsers = [
  {
    id: '1',
    email: 'demo@stellarbatchpay.com',
    password: 'demo123', // In production, this would be hashed
    name: 'Demo User',
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const { email, password } = loginSchema.parse(body)
    
    // Find user (in production, you'd query your database)
    const user = mockUsers.find(u => u.email === email && u.password === password)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Generate JWT token (in production, use a proper JWT library)
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })).toString('base64')
    
    // Return success response with token
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
