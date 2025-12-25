import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ active: false }, { status: 200 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('scan_windows')
    .select('*')
    .order('window_started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ active: false })
  }

  const now = Date.now()
  const start = new Date(data.window_started_at).getTime()
  const end = data.window_ended_at
    ? new Date(data.window_ended_at).getTime()
    : null

  const active = end === null || now < end

  return NextResponse.json({
    active,
    startedAt: data.window_started_at,
    endsAt: data.window_ended_at,
  })
}
