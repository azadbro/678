import { NextRequest, NextResponse } from 'next/server'
import { ApiService } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, walletAddress } = await request.json()
    
    if (!userId || !amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount < 3.5) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is 3.5 TRX' },
        { status: 400 }
      )
    }

    // Basic TRX address validation
    if (!walletAddress.startsWith('T') || walletAddress.length !== 34) {
      return NextResponse.json(
        { error: 'Invalid TRX wallet address' },
        { status: 400 }
      )
    }

    await ApiService.requestWithdrawal(userId, amount, walletAddress)
    
    return NextResponse.json({ 
      success: true,
      message: 'Withdrawal request submitted successfully' 
    })
  } catch (error: any) {
    console.error('Withdrawal request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal request' },
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

    const withdrawals = await ApiService.getUserWithdrawals(userId)
    
    return NextResponse.json({ withdrawals })
  } catch (error) {
    console.error('Withdrawals fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}