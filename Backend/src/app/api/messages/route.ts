// DEPRECATED: use /api/messages/threads/[id]
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const threadId = searchParams.get('threadId') || searchParams.get('conversationId')

  if (!threadId) {
    console.log('[MESSAGES/API] ❌ missing threadId')
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: 'threadId is required' },
      { status: 400 }
    )
  }

  // Redirect explícito al endpoint canónico
  const redirectUrl = new URL(`/api/messages/threads/${threadId}`, req.url)
  return NextResponse.redirect(redirectUrl, { status: 307 })
}


export async function POST(req: NextRequest) {
  console.log('[MESSAGES/API] ❌ POST deprecated - use /api/messages/threads')
  return NextResponse.json(
    { 
      error: 'BAD_REQUEST',
      message: 'Use POST /api/messages/threads to create conversations',
      deprecation: 'This endpoint is deprecated'
    },
    { status: 400 }
  )
}
