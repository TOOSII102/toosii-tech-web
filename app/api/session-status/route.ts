import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const sessionStore = new Map<string, { status: string; sessionId?: string }>()

export function setSessionStatus(id: string, status: { status: string; sessionId?: string }) {
  sessionStore.set(id, status)
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''
  if (!id) return NextResponse.json({ status: 'unknown' })
  const entry = sessionStore.get(id)
  if (!entry) return NextResponse.json({ status: 'pending' })
  return NextResponse.json(entry)
}
