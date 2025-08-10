import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory storage for demo (replace with database in production)
const sessions = new Map()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { streamerId, title, maxSpeakingTime = 45 } = body

    const sessionId = "stream-" + Math.random().toString(36).substr(2, 9)

    // Store session in memory for demo
    const session = {
      id: sessionId,
      streamerId: streamerId || "demo-streamer",
      title: title || "StreamTalk Session",
      maxSpeakingTime,
      status: "active",
      createdAt: new Date().toISOString(),
    }

    sessions.set(sessionId, session)

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (request.headers.get("host")
        ? `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}`
        : "http://localhost:3000")

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        joinLink: `${baseUrl}/join/${session.id}`,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${baseUrl}/join/${session.id}`,
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

    const session = sessions.get(sessionId)

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
