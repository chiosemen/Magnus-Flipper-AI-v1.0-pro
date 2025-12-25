import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ etaMinutes: null }, { status: 200 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('scan_windows')
    .select('window_started_at')
    .gt('window_started_at', new Date().toISOString())
    .order('window_started_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ etaMinutes: null })
  }

  const etaMs =
    new Date(data.window_started_at).getTime() - Date.now()

  return NextResponse.json({
    etaMinutes: Math.max(1, Math.ceil(etaMs / 60000)),
  })
}
