import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase Admin Client banane ke liye Service Role Key zaroori hai
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Yeh key aapko .env file mein daalni hogi
)

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // 1. Delete user from Supabase Authentication (auth.users)
    // NOTE: Agar aapke database mein 'profiles' table par ON DELETE CASCADE set hai, 
    // toh user yahan se delete hone par profile bhi automatically delete ho jayegi.
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Vendor permanently deleted" }, { status: 200 })

  } catch (error: any) {
    console.error("Delete Vendor Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}