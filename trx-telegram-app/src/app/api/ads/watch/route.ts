import { NextRequest, NextResponse } from 'next/server'
import { ApiService } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user can watch ad (cooldown check)
    const canWatch = await ApiService.canWatchAd(userId)
    
    if (!canWatch) {
      return NextResponse.json(
        { error: 'Cooldown period not finished' },
        { status: 429 }
      )
    }

    // Record ad view and update user balance
    await ApiService.recordAdView(userId)
    
    return NextResponse.json({ 
      success: true, 
      reward: 0.005,
      message: 'Ad view recorded successfully' 
    })
  } catch (error: any) {
    console.error('Ad watch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record ad view' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const canWatch = await ApiService.canWatchAd(userId)
    const lastAdTime = await ApiService.getLastAdWatch(userId)
    
    let cooldownRemaining = 0
    if (!canWatch && lastAdTime) {
      const now = new Date()
      const timeDiff = now.getTime() - lastAdTime.getTime()
      const remainingMs = (15 * 1000) - timeDiff
      cooldownRemaining = Math.max(0, Math.ceil(remainingMs / 1000))
    }

    return NextResponse.json({ 
      canWatch,
      cooldownRemaining,
      lastAdTime: lastAdTime?.toISOString()
    })
  } catch (error) {
    console.error('Ad status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check ad status' },
      { status: 500 }
    )
  }
}