import { NextRequest, NextResponse } from 'next/server'
import { ApiService } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const { telegramUser, referrerId } = await request.json()
    
    if (!telegramUser || !telegramUser.id) {
      return NextResponse.json(
        { error: 'Invalid telegram user data' },
        { status: 400 }
      )
    }

    const user = await ApiService.createOrUpdateUser(telegramUser, referrerId)
    
    return NextResponse.json({ user })
  } catch (error) {
    console.error('User creation/update error:', error)
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get('telegramId')
    
    if (!telegramId) {
      return NextResponse.json(
        { error: 'Telegram ID is required' },
        { status: 400 }
      )
    }

    const user = await ApiService.getUserByTelegramId(parseInt(telegramId))
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}