import { NextRequest, NextResponse } from 'next/server'
import { ApiService } from '@/lib/api'

export async function GET() {
  try {
    const tasks = await ApiService.getTasks()
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, taskId } = await request.json()
    
    if (!userId || !taskId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    await ApiService.completeTask(userId, taskId)
    
    return NextResponse.json({ 
      success: true,
      message: 'Task completed successfully' 
    })
  } catch (error: any) {
    console.error('Task completion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete task' },
      { status: 500 }
    )
  }
}