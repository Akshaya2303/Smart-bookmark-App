import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  const origin = request.headers.get('origin') || 'https://smart-bookmark-app-hazel-beta.vercel.app'
  return NextResponse.redirect(new URL('/', origin))
}