import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { streamerId, title, maxSpeakingTime = 45 } = await request.json()

    const sessionId = "stream-" + Math.random().toString(36).substr(2, 9)

    // Create session in database
    const [session] = await sql`
      INSERT INTO sessions (id, streamer_id, title, max_speaking_time, status, created_at)
      VALUES (${sessionId}, ${streamerId}, ${title}, ${maxSpeakingTime}, 'active', NOW())
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        joinLink: `${process.env.NEXT_PUBLIC_APP_URL}/join/${session.id}`,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${process.env.NEXT_PUBLIC_APP_URL}/join/${session.id}`,
      },
    })
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 })
    }

    const [session] = await sql`
      SELECT * FROM sessions WHERE id = ${sessionId} AND status = 'active'
    `

    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      session,
    })
  } catch (error) {
    console.error("Session fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch session" }, { status: 500 })
  }
}
